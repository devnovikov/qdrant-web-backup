package com.qdrant.backup.model

import com.fasterxml.jackson.annotation.JsonProperty

data class CollectionInfo(
    val name: String
)

data class CollectionsList(
    val collections: List<CollectionInfo>
)

data class CollectionDetail(
    val name: String,
    val status: String,
    @JsonProperty("vectors_count")
    val vectorsCount: Long,
    @JsonProperty("points_count")
    val pointsCount: Long,
    @JsonProperty("segments_count")
    val segmentsCount: Int,
    val config: CollectionConfig
)

data class CollectionConfig(
    val params: CollectionParams,
    @JsonProperty("hnsw_config")
    val hnswConfig: Map<String, Any>? = null,
    @JsonProperty("optimizer_config")
    val optimizerConfig: Map<String, Any>? = null,
    @JsonProperty("wal_config")
    val walConfig: Map<String, Any>? = null
)

data class CollectionParams(
    @JsonProperty("shard_number")
    val shardNumber: Int,
    @JsonProperty("replication_factor")
    val replicationFactor: Int
)

data class CollectionClusterInfo(
    @JsonProperty("peer_id")
    val peerId: Long,
    @JsonProperty("shard_count")
    val shardCount: Int,
    @JsonProperty("local_shards")
    val localShards: List<LocalShard>,
    @JsonProperty("remote_shards")
    val remoteShards: List<RemoteShard>
)

data class LocalShard(
    @JsonProperty("shard_id")
    val shardId: Int,
    @JsonProperty("points_count")
    val pointsCount: Long,
    val state: String
)

data class RemoteShard(
    @JsonProperty("shard_id")
    val shardId: Int,
    @JsonProperty("peer_id")
    val peerId: Long,
    val state: String
)
