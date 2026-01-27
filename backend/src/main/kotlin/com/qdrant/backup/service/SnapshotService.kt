package com.qdrant.backup.service

import com.qdrant.backup.client.QdrantClientWrapper
import com.qdrant.backup.model.*
import com.qdrant.backup.repository.SnapshotMetadataRepository
import io.micrometer.core.instrument.Timer
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import java.io.InputStream
import java.time.Instant

@Service
class SnapshotService(
    private val qdrantClient: QdrantClientWrapper,
    private val metadataRepository: SnapshotMetadataRepository,
    private val snapshotCreationTimer: Timer
) {
    private val logger = LoggerFactory.getLogger(SnapshotService::class.java)

    fun listSnapshots(collectionName: String): List<Snapshot> {
        return qdrantClient.listSnapshots(collectionName)
    }

    fun createSnapshot(collectionName: String, wait: Boolean = true): Snapshot {
        logger.info("Creating snapshot for collection: $collectionName (wait: $wait)")

        val snapshot = snapshotCreationTimer.recordCallable {
            qdrantClient.createSnapshot(collectionName, wait)
        }!!

        // Store metadata
        metadataRepository.create(
            SnapshotMetadata(
                id = "",
                collectionName = collectionName,
                snapshotName = snapshot.name,
                size = snapshot.size,
                checksum = snapshot.checksum,
                createdAt = snapshot.creationTime
            )
        )

        logger.info("Snapshot created: ${snapshot.name} (size: ${snapshot.size} bytes)")
        return snapshot
    }

    fun downloadSnapshot(collectionName: String, snapshotName: String): Pair<InputStream, Long>? {
        return qdrantClient.downloadSnapshot(collectionName, snapshotName)
    }

    fun deleteSnapshot(collectionName: String, snapshotName: String, wait: Boolean = true): Boolean {
        logger.info("Deleting snapshot: $collectionName/$snapshotName")

        val result = qdrantClient.deleteSnapshot(collectionName, snapshotName, wait)

        if (result) {
            metadataRepository.delete(collectionName, snapshotName)
        }

        return result
    }

    fun recoverSnapshot(collectionName: String, request: RecoverSnapshotRequest): Boolean {
        logger.info("Recovering collection $collectionName from: ${request.location}")
        return qdrantClient.recoverSnapshot(collectionName, request.location, request.priority, request.apiKey)
    }

    // Shard snapshot operations
    fun listShardSnapshots(collectionName: String, shardId: Int): List<Snapshot> {
        return qdrantClient.listShardSnapshots(collectionName, shardId)
    }

    fun createShardSnapshot(collectionName: String, shardId: Int, wait: Boolean = true): Snapshot {
        logger.info("Creating shard snapshot for collection: $collectionName, shard: $shardId")

        val snapshot = qdrantClient.createShardSnapshot(collectionName, shardId, wait)

        // Store metadata
        metadataRepository.create(
            SnapshotMetadata(
                id = "",
                collectionName = collectionName,
                snapshotName = snapshot.name,
                shardId = shardId,
                size = snapshot.size,
                checksum = snapshot.checksum,
                createdAt = snapshot.creationTime
            )
        )

        return snapshot
    }
}
