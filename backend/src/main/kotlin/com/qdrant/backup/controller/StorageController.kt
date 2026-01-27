package com.qdrant.backup.controller

import com.qdrant.backup.model.*
import com.qdrant.backup.service.StorageService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/storage")
@Tag(name = "Storage", description = "Backup storage configuration")
class StorageController(
    private val storageService: StorageService
) {

    @GetMapping("/config")
    @Operation(summary = "Get storage configurations", description = "Returns all configured storage backends")
    fun getStorageConfigs(): ResponseEntity<ApiResponse<List<StorageConfig>>> {
        val startTime = System.nanoTime()
        val configs = storageService.getAllConfigs()
        val elapsed = (System.nanoTime() - startTime) / 1_000_000_000.0
        return ResponseEntity.ok(successResponse(configs, elapsed))
    }

    @PostMapping("/config")
    @Operation(summary = "Create storage configuration", description = "Creates a new storage backend configuration")
    fun createStorageConfig(@RequestBody config: StorageConfigCreate): ResponseEntity<ApiResponse<StorageConfig>> {
        val startTime = System.nanoTime()

        return try {
            val created = storageService.createConfig(config)
            val elapsed = (System.nanoTime() - startTime) / 1_000_000_000.0
            ResponseEntity.ok(successResponse(created, elapsed))
        } catch (e: Exception) {
            ResponseEntity.badRequest()
                .body(ApiResponse(status = ErrorStatus("Invalid configuration: ${e.message}")))
        }
    }

    @PutMapping("/config/{id}")
    @Operation(summary = "Update storage configuration", description = "Updates an existing storage backend configuration")
    fun updateStorageConfig(
        @PathVariable id: String,
        @RequestBody update: StorageConfigUpdate
    ): ResponseEntity<ApiResponse<StorageConfig>> {
        val startTime = System.nanoTime()

        return try {
            val updated = storageService.updateConfig(id, update)
            if (updated != null) {
                val elapsed = (System.nanoTime() - startTime) / 1_000_000_000.0
                ResponseEntity.ok(successResponse(updated, elapsed))
            } else {
                ResponseEntity.status(404)
                    .body(ApiResponse(status = ErrorStatus("Configuration not found")))
            }
        } catch (e: Exception) {
            ResponseEntity.badRequest()
                .body(ApiResponse(status = ErrorStatus("Update failed: ${e.message}")))
        }
    }

    @DeleteMapping("/config/{id}")
    @Operation(summary = "Delete storage configuration", description = "Deletes a storage backend configuration")
    fun deleteStorageConfig(@PathVariable id: String): ResponseEntity<ApiResponse<Boolean>> {
        val startTime = System.nanoTime()

        return try {
            val result = storageService.deleteConfig(id)
            val elapsed = (System.nanoTime() - startTime) / 1_000_000_000.0
            ResponseEntity.ok(successResponse(result, elapsed))
        } catch (e: IllegalArgumentException) {
            ResponseEntity.badRequest()
                .body(ApiResponse(status = ErrorStatus(e.message ?: "Cannot delete configuration")))
        }
    }

    @PostMapping("/test")
    @Operation(summary = "Test storage connectivity", description = "Tests connectivity to a storage backend without saving")
    fun testStorageConnectivity(@RequestBody config: StorageConfigCreate): ResponseEntity<ApiResponse<StorageTestResult>> {
        val startTime = System.nanoTime()
        val result = storageService.testConnectivity(config)
        val elapsed = (System.nanoTime() - startTime) / 1_000_000_000.0
        return ResponseEntity.ok(successResponse(result, elapsed))
    }
}
