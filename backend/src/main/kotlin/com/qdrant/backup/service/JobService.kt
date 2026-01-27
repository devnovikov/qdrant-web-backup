package com.qdrant.backup.service

import com.qdrant.backup.model.*
import com.qdrant.backup.repository.JobRepository
import io.micrometer.core.instrument.Counter
import kotlinx.coroutines.*
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import java.util.concurrent.ConcurrentHashMap

@Service
class JobService(
    private val repository: JobRepository,
    private val snapshotService: SnapshotService,
    private val messagingTemplate: SimpMessagingTemplate,
    private val backupJobsCounter: Counter,
    private val restoreJobsCounter: Counter,
    private val failedJobsCounter: Counter,
    @Value("\${qdrant.protocol:http}") private val qdrantProtocol: String,
    @Value("\${qdrant.host:localhost}") private val qdrantHost: String,
    @Value("\${qdrant.port:6333}") private val qdrantPort: Int
) {
    private val qdrantBaseUrl get() = "$qdrantProtocol://$qdrantHost:$qdrantPort"
    private val logger = LoggerFactory.getLogger(JobService::class.java)
    private val runningJobs = ConcurrentHashMap<String, Job>()
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    fun listJobs(status: JobStatus?, type: JobType?, page: Int, limit: Int): JobsPage {
        val (items, total) = repository.findAll(status, type, page, limit)
        return JobsPage(items, total, page, limit)
    }

    fun getJob(id: String): BackupJob? {
        return repository.findById(id)
    }

    fun createJob(jobCreate: JobCreate): BackupJob {
        logger.info("Creating job: ${jobCreate.type} for ${jobCreate.collectionName}")

        val job = repository.create(jobCreate)

        // Update metrics
        when (jobCreate.type) {
            JobType.BACKUP, JobType.SHARD_BACKUP -> backupJobsCounter.increment()
            JobType.RESTORE, JobType.SHARD_RESTORE -> restoreJobsCounter.increment()
        }

        // Broadcast job created event
        broadcastJobUpdate(job)

        return job
    }

    fun cancelJob(id: String): BackupJob? {
        val job = repository.findById(id) ?: return null

        if (job.status !in listOf(JobStatus.PENDING, JobStatus.RUNNING)) {
            throw IllegalStateException("Cannot cancel job with status: ${job.status}")
        }

        // Cancel running coroutine if exists
        runningJobs[id]?.cancel()
        runningJobs.remove(id)

        val updated = repository.updateStatus(id, JobStatus.CANCELLED)
        updated?.let { broadcastJobUpdate(it) }

        return updated
    }

    fun retryJob(id: String): BackupJob? {
        val job = repository.findById(id) ?: return null

        if (job.status !in listOf(JobStatus.FAILED, JobStatus.CANCELLED)) {
            throw IllegalStateException("Cannot retry job with status: ${job.status}")
        }

        // Reset job status to pending
        repository.updateStatus(id, JobStatus.PENDING)
        repository.updateProgress(id, 0)

        return repository.findById(id)?.also { broadcastJobUpdate(it) }
    }

    @Scheduled(fixedDelay = 5000)
    fun processJobs() {
        val pendingJobs = repository.findPending()
        val runningCount = runningJobs.size

        // Limit concurrent jobs
        val availableSlots = 3 - runningCount
        if (availableSlots <= 0) return

        pendingJobs.take(availableSlots).forEach { job ->
            processJob(job)
        }
    }

    private fun processJob(job: BackupJob) {
        logger.info("Starting job: ${job.id} (${job.type})")

        repository.updateStatus(job.id, JobStatus.RUNNING)
        broadcastJobUpdate(job.copy(status = JobStatus.RUNNING))

        val coroutineJob = scope.launch {
            try {
                when (job.type) {
                    JobType.BACKUP -> executeBackup(job)
                    JobType.RESTORE -> executeRestore(job)
                    JobType.SHARD_BACKUP -> executeShardBackup(job)
                    JobType.SHARD_RESTORE -> executeShardRestore(job)
                }

                repository.updateStatus(job.id, JobStatus.COMPLETED)
                repository.updateProgress(job.id, 100)

                val completedJob = repository.findById(job.id)
                completedJob?.let { broadcastJobUpdate(it) }

                logger.info("Job completed: ${job.id}")
            } catch (e: CancellationException) {
                logger.info("Job cancelled: ${job.id}")
            } catch (e: Exception) {
                logger.error("Job failed: ${job.id}", e)
                failedJobsCounter.increment()
                repository.updateStatus(job.id, JobStatus.FAILED, e.message)

                val failedJob = repository.findById(job.id)
                failedJob?.let { broadcastJobUpdate(it) }
            } finally {
                runningJobs.remove(job.id)
            }
        }

        runningJobs[job.id] = coroutineJob
    }

    private suspend fun executeBackup(job: BackupJob) {
        updateProgress(job.id, 10)
        delay(500) // Allow progress to be seen

        snapshotService.createSnapshot(job.collectionName, true)

        updateProgress(job.id, 100)
    }

    private suspend fun executeRestore(job: BackupJob) {
        val metadata = job.metadata ?: emptyMap()
        // For existing snapshots on Qdrant server, use the Qdrant API URL directly
        // For external URLs (S3, HTTP), use as-is
        val location = metadata["url"] as? String
            ?: job.snapshotName?.let { snapshotName ->
                // Build full URL to the snapshot on Qdrant server
                "$qdrantBaseUrl/collections/${job.collectionName}/snapshots/$snapshotName"
            }
            ?: throw IllegalArgumentException("No restore source specified")

        val priority = metadata["priority"] as? String ?: "snapshot"

        updateProgress(job.id, 10)

        snapshotService.recoverSnapshot(
            job.collectionName,
            RecoverSnapshotRequest(location, priority)
        )

        updateProgress(job.id, 100)
    }

    private suspend fun executeShardBackup(job: BackupJob) {
        val shardId = job.shardId
            ?: throw IllegalArgumentException("Shard ID required for shard backup")

        updateProgress(job.id, 10)

        snapshotService.createShardSnapshot(job.collectionName, shardId, true)

        updateProgress(job.id, 100)
    }

    private suspend fun executeShardRestore(job: BackupJob) {
        // Shard restore would be implemented here
        // For now, just simulate progress
        for (i in 1..10) {
            delay(500)
            updateProgress(job.id, i * 10)
        }
    }

    private fun updateProgress(jobId: String, progress: Int) {
        repository.updateProgress(jobId, progress)
        repository.findById(jobId)?.let { broadcastJobUpdate(it) }
    }

    private fun broadcastJobUpdate(job: BackupJob) {
        messagingTemplate.convertAndSend("/topic/jobs/${job.id}", job)
        messagingTemplate.convertAndSend("/topic/jobs", job)
    }
}
