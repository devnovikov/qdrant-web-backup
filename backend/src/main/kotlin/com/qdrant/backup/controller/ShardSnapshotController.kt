package com.qdrant.backup.controller

import com.qdrant.backup.model.*
import com.qdrant.backup.service.SnapshotService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/collections/{collectionName}/shards/{shardId}/snapshots")
@Tag(name = "Shard Snapshots", description = "Per-shard snapshot operations for distributed mode")
class ShardSnapshotController(
    private val snapshotService: SnapshotService
) {

    @GetMapping
    @Operation(summary = "List shard snapshots", description = "Returns all snapshots for a specific shard")
    fun listShardSnapshots(
        @PathVariable collectionName: String,
        @PathVariable shardId: Int
    ): ResponseEntity<ApiResponse<List<Snapshot>>> {
        val startTime = System.nanoTime()

        return try {
            val snapshots = snapshotService.listShardSnapshots(collectionName, shardId)
            val elapsed = (System.nanoTime() - startTime) / 1_000_000_000.0
            ResponseEntity.ok(successResponse(snapshots, elapsed))
        } catch (e: Exception) {
            ResponseEntity.status(404)
                .body(ApiResponse(status = ErrorStatus("Collection or shard not found: ${e.message}")))
        }
    }

    @PostMapping
    @Operation(summary = "Create shard snapshot", description = "Creates a snapshot for a specific shard")
    fun createShardSnapshot(
        @PathVariable collectionName: String,
        @PathVariable shardId: Int,
        @RequestParam(defaultValue = "true") wait: Boolean
    ): ResponseEntity<ApiResponse<Snapshot>> {
        val startTime = System.nanoTime()

        return try {
            val snapshot = snapshotService.createShardSnapshot(collectionName, shardId, wait)
            val elapsed = (System.nanoTime() - startTime) / 1_000_000_000.0
            ResponseEntity.ok(successResponse(snapshot, elapsed))
        } catch (e: Exception) {
            ResponseEntity.status(500)
                .body(ApiResponse(status = ErrorStatus("Failed to create shard snapshot: ${e.message}")))
        }
    }
}
