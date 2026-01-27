package com.qdrant.backup.controller

import com.qdrant.backup.model.*
import com.qdrant.backup.service.JobService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/jobs")
@Tag(name = "Jobs", description = "Backup and restore job management")
class JobController(
    private val jobService: JobService
) {

    @GetMapping
    @Operation(summary = "List jobs", description = "Returns paginated list of backup and restore jobs")
    fun listJobs(
        @RequestParam(required = false) status: JobStatus?,
        @RequestParam(required = false) type: JobType?,
        @RequestParam(defaultValue = "1") page: Int,
        @RequestParam(defaultValue = "20") limit: Int
    ): ResponseEntity<JobsPage> {
        val jobs = jobService.listJobs(status, type, page, limit)
        return ResponseEntity.ok(jobs)
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get job details", description = "Returns detailed information about a specific job")
    fun getJob(@PathVariable id: String): ResponseEntity<ApiResponse<BackupJob>> {
        val startTime = System.nanoTime()

        val job = jobService.getJob(id)
        return if (job != null) {
            val elapsed = (System.nanoTime() - startTime) / 1_000_000_000.0
            ResponseEntity.ok(successResponse(job, elapsed))
        } else {
            ResponseEntity.status(404)
                .body(ApiResponse(status = ErrorStatus("Job not found")))
        }
    }

    @PostMapping
    @Operation(summary = "Create job", description = "Creates a new backup or restore job")
    fun createJob(@RequestBody jobCreate: JobCreate): ResponseEntity<ApiResponse<BackupJob>> {
        val startTime = System.nanoTime()

        return try {
            val job = jobService.createJob(jobCreate)
            val elapsed = (System.nanoTime() - startTime) / 1_000_000_000.0
            ResponseEntity.ok(successResponse(job, elapsed))
        } catch (e: Exception) {
            ResponseEntity.badRequest()
                .body(ApiResponse(status = ErrorStatus("Failed to create job: ${e.message}")))
        }
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Cancel job", description = "Cancels a pending or running job")
    fun cancelJob(@PathVariable id: String): ResponseEntity<ApiResponse<BackupJob>> {
        val startTime = System.nanoTime()

        return try {
            val job = jobService.cancelJob(id)
            if (job != null) {
                val elapsed = (System.nanoTime() - startTime) / 1_000_000_000.0
                ResponseEntity.ok(successResponse(job, elapsed))
            } else {
                ResponseEntity.status(404)
                    .body(ApiResponse(status = ErrorStatus("Job not found")))
            }
        } catch (e: IllegalStateException) {
            ResponseEntity.badRequest()
                .body(ApiResponse(status = ErrorStatus(e.message ?: "Cannot cancel job")))
        }
    }

    @PostMapping("/{id}/retry")
    @Operation(summary = "Retry job", description = "Retries a failed or cancelled job")
    fun retryJob(@PathVariable id: String): ResponseEntity<ApiResponse<BackupJob>> {
        val startTime = System.nanoTime()

        return try {
            val job = jobService.retryJob(id)
            if (job != null) {
                val elapsed = (System.nanoTime() - startTime) / 1_000_000_000.0
                ResponseEntity.ok(successResponse(job, elapsed))
            } else {
                ResponseEntity.status(404)
                    .body(ApiResponse(status = ErrorStatus("Job not found")))
            }
        } catch (e: IllegalStateException) {
            ResponseEntity.badRequest()
                .body(ApiResponse(status = ErrorStatus(e.message ?: "Cannot retry job")))
        }
    }
}
