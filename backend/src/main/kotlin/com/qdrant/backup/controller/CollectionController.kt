package com.qdrant.backup.controller

import com.qdrant.backup.model.*
import com.qdrant.backup.service.CollectionService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/collections")
@Tag(name = "Collections", description = "Collection listing and details")
class CollectionController(
    private val collectionService: CollectionService
) {

    @GetMapping
    @Operation(summary = "List all collections", description = "Returns list of all collections in the Qdrant cluster")
    fun listCollections(): ResponseEntity<ApiResponse<CollectionsList>> {
        val startTime = System.nanoTime()

        return try {
            val collections = collectionService.listCollections()
            val elapsed = (System.nanoTime() - startTime) / 1_000_000_000.0
            ResponseEntity.ok(successResponse(collections, elapsed))
        } catch (e: Exception) {
            ResponseEntity.status(503)
                .body(ApiResponse(status = ErrorStatus("Failed to list collections: ${e.message}")))
        }
    }

    @GetMapping("/{name}")
    @Operation(summary = "Get collection details", description = "Returns detailed information about a specific collection")
    fun getCollection(@PathVariable name: String): ResponseEntity<ApiResponse<CollectionDetail>> {
        val startTime = System.nanoTime()

        return try {
            val collection = collectionService.getCollection(name)
            val elapsed = (System.nanoTime() - startTime) / 1_000_000_000.0
            ResponseEntity.ok(successResponse(collection, elapsed))
        } catch (e: Exception) {
            ResponseEntity.status(404)
                .body(ApiResponse(status = ErrorStatus("Collection not found: ${e.message}")))
        }
    }

    @GetMapping("/{name}/cluster")
    @Operation(summary = "Get collection cluster info", description = "Returns shard distribution and cluster info for a collection")
    fun getCollectionClusterInfo(@PathVariable name: String): ResponseEntity<ApiResponse<CollectionClusterInfo>> {
        val startTime = System.nanoTime()

        return try {
            val clusterInfo = collectionService.getCollectionClusterInfo(name)
            val elapsed = (System.nanoTime() - startTime) / 1_000_000_000.0
            ResponseEntity.ok(successResponse(clusterInfo, elapsed))
        } catch (e: Exception) {
            ResponseEntity.status(404)
                .body(ApiResponse(status = ErrorStatus("Collection not found: ${e.message}")))
        }
    }
}
