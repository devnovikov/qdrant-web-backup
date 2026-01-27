package com.qdrant.backup.controller

import com.qdrant.backup.model.*
import com.qdrant.backup.service.ClusterService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/cluster")
@Tag(name = "Cluster", description = "Cluster health and node management")
class ClusterController(
    private val clusterService: ClusterService
) {

    @GetMapping
    @Operation(summary = "Get cluster status", description = "Returns current cluster health, Raft consensus info, and peer details")
    fun getClusterStatus(): ResponseEntity<ApiResponse<ClusterStatus>> {
        val startTime = System.nanoTime()

        return try {
            val status = clusterService.getClusterStatus()
            val elapsed = (System.nanoTime() - startTime) / 1_000_000_000.0
            ResponseEntity.ok(successResponse(status, elapsed))
        } catch (e: Exception) {
            ResponseEntity.status(503)
                .body(ApiResponse(status = ErrorStatus("Qdrant cluster unavailable: ${e.message}")))
        }
    }

    @GetMapping("/nodes")
    @Operation(summary = "Get cluster nodes", description = "Returns list of all nodes in the Qdrant cluster with their status")
    fun getClusterNodes(): ResponseEntity<ApiResponse<List<ClusterNode>>> {
        val startTime = System.nanoTime()

        return try {
            val nodes = clusterService.getClusterNodes()
            val elapsed = (System.nanoTime() - startTime) / 1_000_000_000.0
            ResponseEntity.ok(successResponse(nodes, elapsed))
        } catch (e: Exception) {
            ResponseEntity.status(503)
                .body(ApiResponse(status = ErrorStatus("Qdrant cluster unavailable: ${e.message}")))
        }
    }
}
