package com.qdrant.backup.unit

import com.qdrant.backup.model.*
import com.qdrant.backup.repository.JobRepository
import com.qdrant.backup.service.JobService
import com.qdrant.backup.service.SnapshotService
import io.micrometer.core.instrument.Counter
import io.mockk.*
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Tag
import org.junit.jupiter.api.Test
import org.springframework.messaging.simp.SimpMessagingTemplate
import java.time.Instant

@Tag("unit")
class JobServiceTest {

    private lateinit var repository: JobRepository
    private lateinit var snapshotService: SnapshotService
    private lateinit var messagingTemplate: SimpMessagingTemplate
    private lateinit var backupJobsCounter: Counter
    private lateinit var restoreJobsCounter: Counter
    private lateinit var failedJobsCounter: Counter
    private lateinit var jobService: JobService

    @BeforeEach
    fun setup() {
        repository = mockk()
        snapshotService = mockk()
        messagingTemplate = mockk(relaxed = true)
        backupJobsCounter = mockk(relaxed = true)
        restoreJobsCounter = mockk(relaxed = true)
        failedJobsCounter = mockk(relaxed = true)

        jobService = JobService(
            repository,
            snapshotService,
            messagingTemplate,
            backupJobsCounter,
            restoreJobsCounter,
            failedJobsCounter,
            qdrantProtocol = "http",
            qdrantHost = "localhost",
            qdrantPort = 6333
        )
    }

    @Test
    fun `listJobs returns paginated results`() {
        val jobs = listOf(
            createJob("1", JobType.BACKUP, JobStatus.COMPLETED),
            createJob("2", JobType.RESTORE, JobStatus.RUNNING)
        )

        every { repository.findAll(null, null, 1, 20) } returns (jobs to 2)

        val result = jobService.listJobs(null, null, 1, 20)

        assertEquals(2, result.items.size)
        assertEquals(2, result.total)
        assertEquals(1, result.page)
        assertEquals(20, result.limit)
    }

    @Test
    fun `listJobs filters by status`() {
        val jobs = listOf(
            createJob("1", JobType.BACKUP, JobStatus.COMPLETED)
        )

        every { repository.findAll(JobStatus.COMPLETED, null, 1, 20) } returns (jobs to 1)

        val result = jobService.listJobs(JobStatus.COMPLETED, null, 1, 20)

        assertEquals(1, result.items.size)
        assertEquals(JobStatus.COMPLETED, result.items[0].status)
    }

    @Test
    fun `createJob creates new backup job and increments counter`() {
        val jobCreate = JobCreate(
            type = JobType.BACKUP,
            collectionName = "test-collection"
        )

        val created = createJob("new-id", JobType.BACKUP, JobStatus.PENDING, "test-collection")

        every { repository.create(jobCreate) } returns created

        val result = jobService.createJob(jobCreate)

        assertEquals("new-id", result.id)
        assertEquals(JobType.BACKUP, result.type)
        assertEquals(JobStatus.PENDING, result.status)
        verify { backupJobsCounter.increment() }
        verify { messagingTemplate.convertAndSend("/topic/jobs/new-id", any<BackupJob>()) }
    }

    @Test
    fun `createJob creates restore job and increments correct counter`() {
        val jobCreate = JobCreate(
            type = JobType.RESTORE,
            collectionName = "test-collection"
        )

        val created = createJob("new-id", JobType.RESTORE, JobStatus.PENDING, "test-collection")

        every { repository.create(jobCreate) } returns created

        jobService.createJob(jobCreate)

        verify { restoreJobsCounter.increment() }
    }

    @Test
    fun `cancelJob succeeds for pending job`() {
        val job = createJob("1", JobType.BACKUP, JobStatus.PENDING)

        every { repository.findById("1") } returns job
        every { repository.updateStatus("1", JobStatus.CANCELLED) } returns job.copy(status = JobStatus.CANCELLED)

        val result = jobService.cancelJob("1")

        assertNotNull(result)
        verify { repository.updateStatus("1", JobStatus.CANCELLED) }
    }

    @Test
    fun `cancelJob throws for completed job`() {
        val job = createJob("1", JobType.BACKUP, JobStatus.COMPLETED)

        every { repository.findById("1") } returns job

        assertThrows(IllegalStateException::class.java) {
            jobService.cancelJob("1")
        }
    }

    @Test
    fun `retryJob succeeds for failed job`() {
        val job = createJob("1", JobType.BACKUP, JobStatus.FAILED)

        every { repository.findById("1") } returns job
        every { repository.updateStatus("1", JobStatus.PENDING) } returns job.copy(status = JobStatus.PENDING)
        every { repository.updateProgress("1", 0) } returns job.copy(status = JobStatus.PENDING, progress = 0)

        val result = jobService.retryJob("1")

        assertNotNull(result)
        verify { repository.updateStatus("1", JobStatus.PENDING) }
        verify { repository.updateProgress("1", 0) }
    }

    @Test
    fun `retryJob throws for running job`() {
        val job = createJob("1", JobType.BACKUP, JobStatus.RUNNING)

        every { repository.findById("1") } returns job

        assertThrows(IllegalStateException::class.java) {
            jobService.retryJob("1")
        }
    }

    private fun createJob(
        id: String,
        type: JobType,
        status: JobStatus,
        collectionName: String = "test-collection"
    ) = BackupJob(
        id = id,
        type = type,
        status = status,
        collectionName = collectionName,
        progress = if (status == JobStatus.COMPLETED) 100 else 0,
        createdAt = Instant.now()
    )
}
