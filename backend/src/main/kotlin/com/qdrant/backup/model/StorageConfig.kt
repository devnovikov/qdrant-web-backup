package com.qdrant.backup.model

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonIgnore
import com.fasterxml.jackson.annotation.JsonProperty
import com.fasterxml.jackson.annotation.JsonValue
import java.time.Instant

enum class StorageType(@JsonValue val value: String) {
    LOCAL("local"),
    S3("s3");

    companion object {
        @JvmStatic
        @JsonCreator
        fun fromValue(value: String): StorageType =
            entries.find { it.value == value }
                ?: throw IllegalArgumentException("Unknown storage type: $value")
    }
}

data class StorageConfig(
    val id: String,
    val name: String,
    val type: StorageType,
    val path: String? = null,
    @JsonProperty("s3_endpoint")
    val s3Endpoint: String? = null,
    @JsonProperty("s3_bucket")
    val s3Bucket: String? = null,
    @JsonProperty("s3_region")
    val s3Region: String? = null,
    @JsonProperty("s3_access_key")
    val s3AccessKey: String? = null,
    @JsonProperty("s3_secret_key")
    val s3SecretKey: String? = null,
    @field:JsonProperty("is_default")
    @param:JsonProperty("is_default")
    @get:JsonIgnore
    val isDefault: Boolean = false,
    @JsonProperty("created_at")
    val createdAt: Instant = Instant.now(),
    @JsonProperty("updated_at")
    val updatedAt: Instant = Instant.now()
)

data class StorageConfigCreate(
    val name: String,
    val type: StorageType,
    val path: String? = null,
    @JsonProperty("s3_endpoint")
    val s3Endpoint: String? = null,
    @JsonProperty("s3_bucket")
    val s3Bucket: String? = null,
    @JsonProperty("s3_region")
    val s3Region: String? = null,
    @JsonProperty("s3_access_key")
    val s3AccessKey: String? = null,
    @JsonProperty("s3_secret_key")
    val s3SecretKey: String? = null,
    @field:JsonProperty("is_default")
    @param:JsonProperty("is_default")
    val isDefault: Boolean = false
)

data class StorageConfigUpdate(
    val name: String? = null,
    val path: String? = null,
    @JsonProperty("s3_endpoint")
    val s3Endpoint: String? = null,
    @JsonProperty("s3_bucket")
    val s3Bucket: String? = null,
    @JsonProperty("s3_region")
    val s3Region: String? = null,
    @JsonProperty("s3_access_key")
    val s3AccessKey: String? = null,
    @JsonProperty("s3_secret_key")
    val s3SecretKey: String? = null,
    @field:JsonProperty("is_default")
    @param:JsonProperty("is_default")
    val isDefault: Boolean? = null
)

data class StorageTestResult(
    val success: Boolean,
    val message: String?
)
