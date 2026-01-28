package com.qdrant.backup.client

import com.fasterxml.jackson.annotation.JsonProperty
import com.qdrant.backup.config.QdrantProperties
import com.qdrant.backup.model.*
import org.slf4j.LoggerFactory
import org.springframework.core.io.Resource
import org.springframework.http.HttpMethod
import org.springframework.stereotype.Component
import org.springframework.web.client.RestTemplate
import org.springframework.web.client.exchange
import org.springframework.web.client.getForObject
import org.springframework.web.client.postForObject
import java.io.InputStream
import java.time.Instant

/**
 * Wrapper around the Qdrant REST API providing higher-level operations.
 * Uses HTTP REST API for better compatibility and reliability.
 */
@Component
class QdrantClientWrapper(
    private val restTemplate: RestTemplate,
    private val qdrantProperties: QdrantProperties
) {
    private val logger = LoggerFactory.getLogger(QdrantClientWrapper::class.java)
    private val baseUrl get() = "${qdrantProperties.protocol}://${qdrantProperties.host}:${qdrantProperties.port}"

    fun isCloud(): Boolean = qdrantProperties.cloud

    fun getClusterStatus(): ClusterStatus {
        return try {
            val response = restTemplate.getForObject<QdrantClusterResponse>("$baseUrl/cluster")

            val peers = response?.result?.peers?.mapValues { (_, peerInfo) ->
                PeerInfo(peerInfo.uri)
            } ?: emptyMap()

            val raftInfo = response?.result?.raftInfo?.let { raft ->
                RaftInfo(
                    term = raft.term,
                    commit = raft.commit,
                    pendingOperations = raft.pendingOperations,
                    leader = raft.leader,
                    role = if (raft.isLeader) "Leader" else "Follower",
                    isVoter = raft.isVoter
                )
            } ?: RaftInfo(0, 0, 0, 0, "Unknown", false)

            val status = when {
                peers.isEmpty() -> "red"
                raftInfo.leader == 0L -> "yellow"
                else -> "green"
            }

            ClusterStatus(
                status = status,
                peerId = response?.result?.peerId ?: 0,
                peers = peers.mapKeys { it.key },
                raftInfo = raftInfo
            )
        } catch (e: Exception) {
            logger.warn("Failed to get cluster status, returning single-node status", e)
            // Return single-node status for non-cluster deployments
            ClusterStatus(
                status = "green",
                peerId = 0,
                peers = mapOf(0L to PeerInfo("$baseUrl")),
                raftInfo = RaftInfo(0, 0, 0, 0, "Leader", true)
            )
        }
    }

    fun getClusterNodes(): List<ClusterNode> {
        return try {
            val clusterStatus = getClusterStatus()

            clusterStatus.peers.map { (peerId, peerInfo) ->
                val shardsCount = try {
                    val collections = listCollections()
                    var count = 0
                    for (collection in collections.collections) {
                        try {
                            val clusterInfo = getCollectionClusterInfo(collection.name)
                            count += clusterInfo.localShards.count { it.shardId >= 0 }
                        } catch (e: Exception) {
                            // Skip collections we can't access
                        }
                    }
                    count
                } catch (e: Exception) {
                    0
                }

                ClusterNode(
                    peerId = peerId,
                    uri = peerInfo.uri,
                    isLeader = peerId == clusterStatus.raftInfo.leader,
                    shardsCount = shardsCount
                )
            }
        } catch (e: Exception) {
            logger.warn("Failed to get cluster nodes", e)
            listOf(
                ClusterNode(
                    peerId = 0,
                    uri = baseUrl,
                    isLeader = true,
                    shardsCount = 0
                )
            )
        }
    }

    fun listCollections(): CollectionsList {
        val response = restTemplate.getForObject<QdrantCollectionsResponse>("$baseUrl/collections")
        return CollectionsList(
            collections = response?.result?.collections?.map { CollectionInfo(it.name) } ?: emptyList()
        )
    }

    fun getCollection(name: String): CollectionDetail {
        val response = restTemplate.getForObject<QdrantCollectionDetailResponse>("$baseUrl/collections/$name")
        val info = response?.result ?: throw RuntimeException("Collection not found: $name")

        return CollectionDetail(
            name = name,
            status = info.status,
            vectorsCount = info.vectorsCount ?: 0,
            pointsCount = info.pointsCount ?: 0,
            segmentsCount = info.segmentsCount ?: 0,
            config = CollectionConfig(
                params = CollectionParams(
                    shardNumber = info.config?.params?.shardNumber ?: 1,
                    replicationFactor = info.config?.params?.replicationFactor ?: 1
                ),
                hnswConfig = info.config?.hnswConfig ?: emptyMap(),
                optimizerConfig = info.config?.optimizerConfig ?: emptyMap(),
                walConfig = info.config?.walConfig ?: emptyMap()
            )
        )
    }

    fun getCollectionClusterInfo(name: String): CollectionClusterInfo {
        val response = restTemplate.getForObject<QdrantCollectionClusterResponse>("$baseUrl/collections/$name/cluster")
        val info = response?.result ?: throw RuntimeException("Collection cluster info not found: $name")

        return CollectionClusterInfo(
            peerId = info.peerId ?: 0,
            shardCount = info.shardCount ?: 0,
            localShards = info.localShards?.map { shard ->
                LocalShard(
                    shardId = shard.shardId,
                    pointsCount = shard.pointsCount ?: 0,
                    state = shard.state ?: "Unknown"
                )
            } ?: emptyList(),
            remoteShards = info.remoteShards?.map { shard ->
                RemoteShard(
                    shardId = shard.shardId,
                    peerId = shard.peerId,
                    state = shard.state ?: "Unknown"
                )
            } ?: emptyList()
        )
    }

    fun listSnapshots(collectionName: String): List<Snapshot> {
        val response = restTemplate.getForObject<QdrantSnapshotsResponse>("$baseUrl/collections/$collectionName/snapshots")

        return response?.result?.map { snapshot ->
            Snapshot(
                name = snapshot.name,
                creationTime = parseQdrantTimestamp(snapshot.creationTime),
                size = snapshot.size,
                checksum = snapshot.checksum?.takeIf { it.isNotBlank() }
            )
        } ?: emptyList()
    }

    fun createSnapshot(collectionName: String, wait: Boolean): Snapshot {
        val url = "$baseUrl/collections/$collectionName/snapshots?wait=$wait"
        val response = restTemplate.postForObject<QdrantSnapshotResponse>(url, null)
        val snapshot = response?.result ?: throw RuntimeException("Failed to create snapshot")

        return Snapshot(
            name = snapshot.name,
            creationTime = parseQdrantTimestamp(snapshot.creationTime),
            size = snapshot.size,
            checksum = snapshot.checksum?.takeIf { it.isNotBlank() }
        )
    }

    fun downloadSnapshot(collectionName: String, snapshotName: String): Pair<InputStream, Long>? {
        return try {
            val url = "$baseUrl/collections/$collectionName/snapshots/$snapshotName"
            val response = restTemplate.exchange<Resource>(url, HttpMethod.GET)
            val resource = response.body
            val contentLength = response.headers.contentLength

            if (resource != null && resource.exists()) {
                Pair(resource.inputStream, contentLength)
            } else {
                null
            }
        } catch (e: Exception) {
            logger.error("Failed to download snapshot: $collectionName/$snapshotName", e)
            null
        }
    }

    fun deleteSnapshot(collectionName: String, snapshotName: String, wait: Boolean): Boolean {
        return try {
            val url = "$baseUrl/collections/$collectionName/snapshots/$snapshotName?wait=$wait"
            restTemplate.delete(url)
            true
        } catch (e: Exception) {
            logger.error("Failed to delete snapshot: $collectionName/$snapshotName", e)
            false
        }
    }

    fun recoverSnapshot(collectionName: String, location: String, priority: String, apiKey: String? = null): Boolean {
        return try {
            val url = "$baseUrl/collections/$collectionName/snapshots/recover"
            val request = mutableMapOf<String, Any>(
                "location" to location,
                "priority" to priority
            )
            // Add API key for URL-based recovery that requires authentication
            val effectiveApiKey = apiKey ?: qdrantProperties.apiKey?.takeIf { it.isNotBlank() }
            effectiveApiKey?.let { request["api_key"] = it }

            restTemplate.put(url, request)
            true
        } catch (e: Exception) {
            logger.error("Failed to recover snapshot: $collectionName from $location", e)
            throw e
        }
    }

    fun listShardSnapshots(collectionName: String, shardId: Int): List<Snapshot> {
        val response = restTemplate.getForObject<QdrantSnapshotsResponse>(
            "$baseUrl/collections/$collectionName/shards/$shardId/snapshots"
        )

        return response?.result?.map { snapshot ->
            Snapshot(
                name = snapshot.name,
                creationTime = parseQdrantTimestamp(snapshot.creationTime),
                size = snapshot.size,
                checksum = snapshot.checksum?.takeIf { it.isNotBlank() }
            )
        } ?: emptyList()
    }

    fun createShardSnapshot(collectionName: String, shardId: Int, wait: Boolean): Snapshot {
        val url = "$baseUrl/collections/$collectionName/shards/$shardId/snapshots?wait=$wait"
        val response = restTemplate.postForObject<QdrantSnapshotResponse>(url, null)
        val snapshot = response?.result ?: throw RuntimeException("Failed to create shard snapshot")

        return Snapshot(
            name = snapshot.name,
            creationTime = parseQdrantTimestamp(snapshot.creationTime),
            size = snapshot.size,
            checksum = snapshot.checksum?.takeIf { it.isNotBlank() }
        )
    }

    private fun parseQdrantTimestamp(timestamp: String?): Instant {
        if (timestamp == null) return Instant.now()
        return try {
            Instant.parse(timestamp)
        } catch (e: Exception) {
            Instant.now()
        }
    }
}

// DTO classes for Qdrant REST API responses

data class QdrantClusterResponse(
    val result: QdrantClusterResult?,
    val status: String?,
    val time: Double?
)

data class QdrantClusterResult(
    @JsonProperty("peer_id") val peerId: Long?,
    val peers: Map<Long, QdrantPeerInfo>?,
    @JsonProperty("raft_info") val raftInfo: QdrantRaftInfo?
)

data class QdrantPeerInfo(
    val uri: String
)

data class QdrantRaftInfo(
    val term: Long,
    val commit: Long,
    @JsonProperty("pending_operations") val pendingOperations: Int,
    val leader: Long,
    @JsonProperty("is_leader") val isLeader: Boolean,
    @JsonProperty("is_voter") val isVoter: Boolean
)

data class QdrantCollectionsResponse(
    val result: QdrantCollectionsResult?,
    val status: String?,
    val time: Double?
)

data class QdrantCollectionsResult(
    val collections: List<QdrantCollectionBasic>?
)

data class QdrantCollectionBasic(
    val name: String
)

data class QdrantCollectionDetailResponse(
    val result: QdrantCollectionInfo?,
    val status: String?,
    val time: Double?
)

data class QdrantCollectionInfo(
    val status: String,
    @JsonProperty("vectors_count") val vectorsCount: Long?,
    @JsonProperty("points_count") val pointsCount: Long?,
    @JsonProperty("segments_count") val segmentsCount: Int?,
    val config: QdrantCollectionConfig?
)

data class QdrantCollectionConfig(
    val params: QdrantCollectionParams?,
    @JsonProperty("hnsw_config") val hnswConfig: Map<String, Any>?,
    @JsonProperty("optimizer_config") val optimizerConfig: Map<String, Any>?,
    @JsonProperty("wal_config") val walConfig: Map<String, Any>?
)

data class QdrantCollectionParams(
    @JsonProperty("shard_number") val shardNumber: Int?,
    @JsonProperty("replication_factor") val replicationFactor: Int?
)

data class QdrantCollectionClusterResponse(
    val result: QdrantCollectionClusterInfo?,
    val status: String?,
    val time: Double?
)

data class QdrantCollectionClusterInfo(
    @JsonProperty("peer_id") val peerId: Long?,
    @JsonProperty("shard_count") val shardCount: Int?,
    @JsonProperty("local_shards") val localShards: List<QdrantLocalShard>?,
    @JsonProperty("remote_shards") val remoteShards: List<QdrantRemoteShard>?
)

data class QdrantLocalShard(
    @JsonProperty("shard_id") val shardId: Int,
    @JsonProperty("points_count") val pointsCount: Long?,
    val state: String?
)

data class QdrantRemoteShard(
    @JsonProperty("shard_id") val shardId: Int,
    @JsonProperty("peer_id") val peerId: Long,
    val state: String?
)

data class QdrantSnapshotsResponse(
    val result: List<QdrantSnapshotInfo>?,
    val status: String?,
    val time: Double?
)

data class QdrantSnapshotResponse(
    val result: QdrantSnapshotInfo?,
    val status: String?,
    val time: Double?
)

data class QdrantSnapshotInfo(
    val name: String,
    @JsonProperty("creation_time") val creationTime: String?,
    val size: Long,
    val checksum: String?
)
