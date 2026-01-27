package com.qdrant.backup.repository

import com.qdrant.backup.model.StorageConfig
import com.qdrant.backup.model.StorageConfigCreate
import com.qdrant.backup.model.StorageConfigUpdate
import com.qdrant.backup.model.StorageType
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.javatime.timestamp
import org.jetbrains.exposed.sql.transactions.transaction
import org.springframework.stereotype.Repository
import java.time.Instant
import java.util.*

object StorageConfigTable : Table("storage_configs") {
    val id = varchar("id", 50)
    val name = varchar("name", 255)
    val type = varchar("type", 20)
    val path = varchar("path", 1024).nullable()
    val s3Endpoint = varchar("s3_endpoint", 1024).nullable()
    val s3Bucket = varchar("s3_bucket", 255).nullable()
    val s3Region = varchar("s3_region", 50).nullable()
    val s3AccessKey = varchar("s3_access_key", 255).nullable()
    val s3SecretKey = varchar("s3_secret_key", 255).nullable()
    val isDefault = bool("is_default").default(false)
    val createdAt = timestamp("created_at").default(Instant.now())
    val updatedAt = timestamp("updated_at").default(Instant.now())

    override val primaryKey = PrimaryKey(id)
}

@Repository
class StorageConfigRepository {

    fun findAll(): List<StorageConfig> = transaction {
        StorageConfigTable.selectAll()
            .map { it.toStorageConfig() }
    }

    fun findById(id: String): StorageConfig? = transaction {
        StorageConfigTable.selectAll()
            .where { StorageConfigTable.id eq id }
            .singleOrNull()
            ?.toStorageConfig()
    }

    fun findDefault(): StorageConfig? = transaction {
        StorageConfigTable.selectAll()
            .where { StorageConfigTable.isDefault eq true }
            .singleOrNull()
            ?.toStorageConfig()
    }

    fun create(config: StorageConfigCreate): StorageConfig = transaction {
        val newId = UUID.randomUUID().toString()
        val now = Instant.now()

        // If this is set as default, unset all others
        if (config.isDefault) {
            StorageConfigTable.update({ StorageConfigTable.isDefault eq true }) {
                it[isDefault] = false
                it[updatedAt] = now
            }
        }

        StorageConfigTable.insert {
            it[id] = newId
            it[name] = config.name
            it[type] = config.type.name.lowercase()
            it[path] = config.path
            it[s3Endpoint] = config.s3Endpoint
            it[s3Bucket] = config.s3Bucket
            it[s3Region] = config.s3Region
            it[s3AccessKey] = config.s3AccessKey
            it[s3SecretKey] = config.s3SecretKey
            it[isDefault] = config.isDefault
            it[createdAt] = now
            it[updatedAt] = now
        }

        findById(newId)!!
    }

    fun update(id: String, update: StorageConfigUpdate): StorageConfig? = transaction {
        val now = Instant.now()

        // If this is set as default, unset all others
        if (update.isDefault == true) {
            StorageConfigTable.update({ StorageConfigTable.isDefault eq true }) {
                it[isDefault] = false
                it[updatedAt] = now
            }
        }

        val updatedCount = StorageConfigTable.update({ StorageConfigTable.id eq id }) {
            update.name?.let { name -> it[StorageConfigTable.name] = name }
            update.path?.let { path -> it[StorageConfigTable.path] = path }
            update.s3Endpoint?.let { endpoint -> it[s3Endpoint] = endpoint }
            update.s3Bucket?.let { bucket -> it[s3Bucket] = bucket }
            update.s3Region?.let { region -> it[s3Region] = region }
            update.s3AccessKey?.let { key -> it[s3AccessKey] = key }
            update.s3SecretKey?.let { key -> it[s3SecretKey] = key }
            update.isDefault?.let { default -> it[isDefault] = default }
            it[updatedAt] = now
        }

        if (updatedCount > 0) findById(id) else null
    }

    fun delete(id: String): Boolean = transaction {
        StorageConfigTable.deleteWhere { StorageConfigTable.id eq id } > 0
    }

    private fun ResultRow.toStorageConfig() = StorageConfig(
        id = this[StorageConfigTable.id],
        name = this[StorageConfigTable.name],
        type = StorageType.valueOf(this[StorageConfigTable.type].uppercase()),
        path = this[StorageConfigTable.path],
        s3Endpoint = this[StorageConfigTable.s3Endpoint],
        s3Bucket = this[StorageConfigTable.s3Bucket],
        s3Region = this[StorageConfigTable.s3Region],
        s3AccessKey = this[StorageConfigTable.s3AccessKey]?.let { "***********" },
        s3SecretKey = null, // Never return secret key
        isDefault = this[StorageConfigTable.isDefault],
        createdAt = this[StorageConfigTable.createdAt],
        updatedAt = this[StorageConfigTable.updatedAt]
    )
}
