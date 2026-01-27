package com.qdrant.backup.service

import com.qdrant.backup.model.*
import com.qdrant.backup.repository.StorageConfigRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider
import software.amazon.awssdk.regions.Region
import software.amazon.awssdk.services.s3.S3Client
import software.amazon.awssdk.services.s3.model.HeadBucketRequest
import java.io.File
import java.net.URI

@Service
class StorageService(
    private val repository: StorageConfigRepository
) {
    private val logger = LoggerFactory.getLogger(StorageService::class.java)

    fun getAllConfigs(): List<StorageConfig> {
        return repository.findAll()
    }

    fun getConfig(id: String): StorageConfig? {
        return repository.findById(id)
    }

    fun getDefaultConfig(): StorageConfig? {
        return repository.findDefault()
    }

    fun createConfig(config: StorageConfigCreate): StorageConfig {
        logger.info("Creating storage config: ${config.name} (type: ${config.type})")
        return repository.create(config)
    }

    fun updateConfig(id: String, update: StorageConfigUpdate): StorageConfig? {
        val existing = repository.findById(id) ?: return null

        if (existing.isDefault && update.isDefault == false) {
            throw IllegalArgumentException("Cannot unset default storage without setting another as default")
        }

        return repository.update(id, update)
    }

    fun deleteConfig(id: String): Boolean {
        val config = repository.findById(id)
            ?: throw IllegalArgumentException("Storage config not found")

        if (config.isDefault) {
            throw IllegalArgumentException("Cannot delete default storage config")
        }

        return repository.delete(id)
    }

    fun testConnectivity(config: StorageConfigCreate): StorageTestResult {
        logger.info("Testing connectivity for storage: ${config.name} (type: ${config.type})")

        return try {
            when (config.type) {
                StorageType.LOCAL -> testLocalStorage(config.path!!)
                StorageType.S3 -> testS3Storage(config)
            }
        } catch (e: Exception) {
            logger.error("Storage connectivity test failed", e)
            StorageTestResult(false, "Failed: ${e.message}")
        }
    }

    private fun testLocalStorage(path: String): StorageTestResult {
        val dir = File(path)

        return when {
            !dir.exists() -> {
                // Try to create directory
                if (dir.mkdirs()) {
                    StorageTestResult(true, "Directory created successfully")
                } else {
                    StorageTestResult(false, "Cannot create directory: $path")
                }
            }
            !dir.isDirectory -> StorageTestResult(false, "Path is not a directory: $path")
            !dir.canWrite() -> StorageTestResult(false, "Directory is not writable: $path")
            else -> StorageTestResult(true, "Local storage path is accessible")
        }
    }

    private fun testS3Storage(config: StorageConfigCreate): StorageTestResult {
        requireNotNull(config.s3Endpoint) { "S3 endpoint is required" }
        requireNotNull(config.s3Bucket) { "S3 bucket is required" }
        requireNotNull(config.s3Region) { "S3 region is required" }
        requireNotNull(config.s3AccessKey) { "S3 access key is required" }
        requireNotNull(config.s3SecretKey) { "S3 secret key is required" }

        val credentials = AwsBasicCredentials.create(config.s3AccessKey, config.s3SecretKey)

        val s3Client = S3Client.builder()
            .endpointOverride(URI.create(config.s3Endpoint))
            .region(Region.of(config.s3Region))
            .credentialsProvider(StaticCredentialsProvider.create(credentials))
            .forcePathStyle(true)
            .build()

        return try {
            s3Client.headBucket(HeadBucketRequest.builder().bucket(config.s3Bucket).build())
            StorageTestResult(true, "Successfully connected to S3 bucket")
        } catch (e: Exception) {
            StorageTestResult(false, "Failed to connect: ${e.message}")
        } finally {
            s3Client.close()
        }
    }
}
