package com.qdrant.backup.model

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonProperty
import com.fasterxml.jackson.annotation.JsonValue
import java.time.Instant

enum class JobType(@JsonValue val value: String) {
    BACKUP("backup"),
    RESTORE("restore"),
    SHARD_BACKUP("shard_backup"),
    SHARD_RESTORE("shard_restore");

    companion object {
        @JvmStatic
        @JsonCreator
        fun fromValue(value: String): JobType =
            entries.find { it.value == value }
                ?: throw IllegalArgumentException("Unknown job type: $value")
    }
}

enum class JobStatus(@JsonValue val value: String) {
    PENDING("pending"),
    RUNNING("running"),
    COMPLETED("completed"),
    FAILED("failed"),
    CANCELLED("cancelled");

    companion object {
        @JvmStatic
        @JsonCreator
        fun fromValue(value: String): JobStatus =
            entries.find { it.value == value }
                ?: throw IllegalArgumentException("Unknown job status: $value")
    }
}

data class BackupJob(
    val id: String,
    val type: JobType,
    val status: JobStatus,
    @JsonProperty("collection_name")
    val collectionName: String,
    @JsonProperty("shard_id")
    val shardId: Int? = null,
    @JsonProperty("snapshot_name")
    val snapshotName: String? = null,
    val progress: Int = 0,
    val error: String? = null,
    val metadata: Map<String, Any>? = null,
    @JsonProperty("created_at")
    val createdAt: Instant = Instant.now(),
    @JsonProperty("started_at")
    val startedAt: Instant? = null,
    @JsonProperty("completed_at")
    val completedAt: Instant? = null
)

data class JobCreate(
    val type: JobType,
    @JsonProperty("collection_name")
    val collectionName: String,
    @JsonProperty("shard_id")
    val shardId: Int? = null,
    @JsonProperty("snapshot_name")
    val snapshotName: String? = null,
    val metadata: Map<String, Any>? = null
)

data class JobsPage(
    val items: List<BackupJob>,
    val total: Int,
    val page: Int,
    val limit: Int
)

data class RecoverSnapshotRequest(
    val location: String,
    val priority: String = "snapshot",
    @JsonProperty("api_key")
    val apiKey: String? = null
)
