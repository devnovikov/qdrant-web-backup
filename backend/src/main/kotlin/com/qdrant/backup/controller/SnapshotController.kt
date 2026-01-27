package com.qdrant.backup.controller

import com.qdrant.backup.model.*
import com.qdrant.backup.service.SnapshotService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.core.io.InputStreamResource
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/collections/{collectionName}/snapshots")
@Tag(name = "Snapshots", description = "Collection snapshot operations")
class SnapshotController(
    private val snapshotService: SnapshotService
) {

    @GetMapping
    @Operation(summary = "List collection snapshots", description = "Returns all snapshots for a specific collection")
    fun listSnapshots(@PathVariable collectionName: String): ResponseEntity<ApiResponse<List<Snapshot>>> {
        val startTime = System.nanoTime()

        return try {
            val snapshots = snapshotService.listSnapshots(collectionName)
            val elapsed = (System.nanoTime() - startTime) / 1_000_000_000.0
            ResponseEntity.ok(successResponse(snapshots, elapsed))
        } catch (e: Exception) {
            ResponseEntity.status(404)
                .body(ApiResponse(status = ErrorStatus("Collection not found: ${e.message}")))
        }
    }

    @PostMapping
    @Operation(summary = "Create collection snapshot", description = "Creates a new snapshot for the specified collection")
    fun createSnapshot(
        @PathVariable collectionName: String,
        @RequestParam(defaultValue = "true") wait: Boolean
    ): ResponseEntity<ApiResponse<Snapshot>> {
        val startTime = System.nanoTime()

        return try {
            val snapshot = snapshotService.createSnapshot(collectionName, wait)
            val elapsed = (System.nanoTime() - startTime) / 1_000_000_000.0
            ResponseEntity.ok(successResponse(snapshot, elapsed))
        } catch (e: Exception) {
            ResponseEntity.status(500)
                .body(ApiResponse(status = ErrorStatus("Failed to create snapshot: ${e.message}")))
        }
    }

    @GetMapping("/{snapshotName}")
    @Operation(summary = "Download snapshot", description = "Downloads a snapshot file")
    fun downloadSnapshot(
        @PathVariable collectionName: String,
        @PathVariable snapshotName: String
    ): ResponseEntity<Any> {
        return try {
            val (inputStream, size) = snapshotService.downloadSnapshot(collectionName, snapshotName)
                ?: return ResponseEntity.status(404)
                    .body(ApiResponse<Nothing>(status = ErrorStatus("Snapshot not found")))

            ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"$snapshotName\"")
                .header(HttpHeaders.CONTENT_LENGTH, size.toString())
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(InputStreamResource(inputStream))
        } catch (e: Exception) {
            ResponseEntity.status(500)
                .body(ApiResponse<Nothing>(status = ErrorStatus("Failed to download snapshot: ${e.message}")))
        }
    }

    @DeleteMapping("/{snapshotName}")
    @Operation(summary = "Delete snapshot", description = "Deletes a snapshot from the collection")
    fun deleteSnapshot(
        @PathVariable collectionName: String,
        @PathVariable snapshotName: String,
        @RequestParam(defaultValue = "true") wait: Boolean
    ): ResponseEntity<ApiResponse<Boolean>> {
        val startTime = System.nanoTime()

        return try {
            val result = snapshotService.deleteSnapshot(collectionName, snapshotName, wait)
            val elapsed = (System.nanoTime() - startTime) / 1_000_000_000.0
            ResponseEntity.ok(successResponse(result, elapsed))
        } catch (e: Exception) {
            ResponseEntity.status(404)
                .body(ApiResponse(status = ErrorStatus("Snapshot not found: ${e.message}")))
        }
    }

    @PostMapping("/recover")
    @Operation(summary = "Recover collection from snapshot", description = "Restores a collection from a snapshot URL or local file")
    fun recoverSnapshot(
        @PathVariable collectionName: String,
        @RequestBody request: RecoverSnapshotRequest
    ): ResponseEntity<ApiResponse<Boolean>> {
        val startTime = System.nanoTime()

        return try {
            val result = snapshotService.recoverSnapshot(collectionName, request)
            val elapsed = (System.nanoTime() - startTime) / 1_000_000_000.0
            ResponseEntity.ok(successResponse(result, elapsed))
        } catch (e: Exception) {
            ResponseEntity.status(400)
                .body(ApiResponse(status = ErrorStatus("Recovery failed: ${e.message}")))
        }
    }
}
