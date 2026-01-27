package com.qdrant.backup.repository

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import com.qdrant.backup.model.BackupJob
import com.qdrant.backup.model.JobCreate
import com.qdrant.backup.model.JobStatus
import com.qdrant.backup.model.JobType
import org.jetbrains.exposed.v1.core.*
import org.jetbrains.exposed.v1.jdbc.*
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.jetbrains.exposed.v1.javatime.timestamp
import org.springframework.stereotype.Repository
import java.time.Instant
import java.util.*

object BackupJobsTable : Table("backup_jobs") {
    val id = varchar("id", 50)
    val type = varchar("type", 20)
    val status = varchar("status", 20)
    val collectionName = varchar("collection_name", 255)
    val shardId = integer("shard_id").nullable()
    val snapshotName = varchar("snapshot_name", 255).nullable()
    val progress = integer("progress").default(0)
    val error = text("error").nullable()
    val metadata = text("metadata").nullable()
    val createdAt = timestamp("created_at").default(Instant.now())
    val startedAt = timestamp("started_at").nullable()
    val completedAt = timestamp("completed_at").nullable()

    override val primaryKey = PrimaryKey(id)
}

@Repository
class JobRepository(
    private val objectMapper: ObjectMapper
) {

    fun findAll(
        status: JobStatus? = null,
        type: JobType? = null,
        page: Int = 1,
        limit: Int = 20
    ): Pair<List<BackupJob>, Int> = transaction {
        val query = BackupJobsTable.selectAll()

        status?.let { query.andWhere { BackupJobsTable.status eq it.name.lowercase() } }
        type?.let { query.andWhere { BackupJobsTable.type eq it.name.lowercase() } }

        val total = query.count().toInt()

        val items = query
            .orderBy(BackupJobsTable.createdAt, SortOrder.DESC)
            .limit(limit).offset(((page - 1) * limit).toLong())
            .map { it.toBackupJob() }

        items to total
    }

    fun findById(id: String): BackupJob? = transaction {
        BackupJobsTable.selectAll()
            .where { BackupJobsTable.id eq id }
            .singleOrNull()
            ?.toBackupJob()
    }

    fun findPending(): List<BackupJob> = transaction {
        BackupJobsTable.selectAll()
            .where { BackupJobsTable.status eq JobStatus.PENDING.name.lowercase() }
            .orderBy(BackupJobsTable.createdAt, SortOrder.ASC)
            .map { it.toBackupJob() }
    }

    fun findRunning(): List<BackupJob> = transaction {
        BackupJobsTable.selectAll()
            .where { BackupJobsTable.status eq JobStatus.RUNNING.name.lowercase() }
            .map { it.toBackupJob() }
    }

    fun create(jobCreate: JobCreate): BackupJob = transaction {
        val newId = UUID.randomUUID().toString()
        val now = Instant.now()

        BackupJobsTable.insert {
            it[id] = newId
            it[type] = jobCreate.type.name.lowercase()
            it[status] = JobStatus.PENDING.name.lowercase()
            it[collectionName] = jobCreate.collectionName
            it[shardId] = jobCreate.shardId
            it[snapshotName] = jobCreate.snapshotName
            it[progress] = 0
            it[metadata] = jobCreate.metadata?.let { meta -> objectMapper.writeValueAsString(meta) }
            it[createdAt] = now
        }

        findById(newId)!!
    }

    fun updateStatus(id: String, newStatus: JobStatus, errorMessage: String? = null): BackupJob? = transaction {
        val now = Instant.now()

        BackupJobsTable.update({ BackupJobsTable.id eq id }) {
            it[status] = newStatus.name.lowercase()
            if (newStatus == JobStatus.RUNNING) {
                it[startedAt] = now
            }
            if (newStatus in listOf(JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.CANCELLED)) {
                it[completedAt] = now
            }
            errorMessage?.let { msg -> it[error] = msg }
        }

        findById(id)
    }

    fun updateProgress(id: String, newProgress: Int): BackupJob? = transaction {
        BackupJobsTable.update({ BackupJobsTable.id eq id }) {
            it[progress] = newProgress
        }
        findById(id)
    }

    private fun ResultRow.toBackupJob(): BackupJob {
        val metadataJson = this[BackupJobsTable.metadata]
        val metadataMap: Map<String, Any>? = metadataJson?.let {
            objectMapper.readValue(it)
        }

        return BackupJob(
            id = this[BackupJobsTable.id],
            type = JobType.valueOf(this[BackupJobsTable.type].uppercase()),
            status = JobStatus.valueOf(this[BackupJobsTable.status].uppercase()),
            collectionName = this[BackupJobsTable.collectionName],
            shardId = this[BackupJobsTable.shardId],
            snapshotName = this[BackupJobsTable.snapshotName],
            progress = this[BackupJobsTable.progress],
            error = this[BackupJobsTable.error],
            metadata = metadataMap,
            createdAt = this[BackupJobsTable.createdAt],
            startedAt = this[BackupJobsTable.startedAt],
            completedAt = this[BackupJobsTable.completedAt]
        )
    }
}
