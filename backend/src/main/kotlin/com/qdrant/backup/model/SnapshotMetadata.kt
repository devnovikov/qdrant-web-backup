package com.qdrant.backup.model

import com.fasterxml.jackson.annotation.JsonProperty
import java.time.Instant

data class SnapshotMetadata(
    val id: String,
    val collectionName: String,
    val snapshotName: String,
    val shardId: Int? = null,
    val size: Long,
    val checksum: String? = null,
    val storageConfigId: String? = null,
    val storagePath: String? = null,
    val createdAt: Instant = Instant.now()
)

data class Snapshot(
    val name: String,
    @JsonProperty("creation_time")
    val creationTime: Instant,
    val size: Long,
    val checksum: String? = null
)
