package com.qdrant.backup.repository

import com.qdrant.backup.model.SnapshotMetadata
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.javatime.timestamp
import org.jetbrains.exposed.sql.transactions.transaction
import org.springframework.stereotype.Repository
import java.time.Instant
import java.util.*

object SnapshotMetadataTable : Table("snapshot_metadata") {
    val id = varchar("id", 50)
    val collectionName = varchar("collection_name", 255)
    val snapshotName = varchar("snapshot_name", 255)
    val shardId = integer("shard_id").nullable()
    val size = long("size")
    val checksum = varchar("checksum", 255).nullable()
    val storageConfigId = varchar("storage_config_id", 50).nullable()
    val storagePath = varchar("storage_path", 1024).nullable()
    val createdAt = timestamp("created_at").default(Instant.now())

    override val primaryKey = PrimaryKey(id)
}

@Repository
class SnapshotMetadataRepository {

    fun findByCollection(collectionName: String): List<SnapshotMetadata> = transaction {
        SnapshotMetadataTable.selectAll()
            .where { SnapshotMetadataTable.collectionName eq collectionName }
            .orderBy(SnapshotMetadataTable.createdAt, SortOrder.DESC)
            .map { it.toSnapshotMetadata() }
    }

    fun findByCollectionAndShard(collectionName: String, shardId: Int): List<SnapshotMetadata> = transaction {
        SnapshotMetadataTable.selectAll()
            .where {
                (SnapshotMetadataTable.collectionName eq collectionName) and
                        (SnapshotMetadataTable.shardId eq shardId)
            }
            .orderBy(SnapshotMetadataTable.createdAt, SortOrder.DESC)
            .map { it.toSnapshotMetadata() }
    }

    fun findByName(collectionName: String, snapshotName: String): SnapshotMetadata? = transaction {
        SnapshotMetadataTable.selectAll()
            .where {
                (SnapshotMetadataTable.collectionName eq collectionName) and
                        (SnapshotMetadataTable.snapshotName eq snapshotName)
            }
            .singleOrNull()
            ?.toSnapshotMetadata()
    }

    fun create(metadata: SnapshotMetadata): SnapshotMetadata = transaction {
        val newId = metadata.id.ifBlank { UUID.randomUUID().toString() }

        SnapshotMetadataTable.insert {
            it[id] = newId
            it[collectionName] = metadata.collectionName
            it[snapshotName] = metadata.snapshotName
            it[shardId] = metadata.shardId
            it[size] = metadata.size
            it[checksum] = metadata.checksum
            it[storageConfigId] = metadata.storageConfigId
            it[storagePath] = metadata.storagePath
            it[createdAt] = metadata.createdAt
        }

        metadata.copy(id = newId)
    }

    fun delete(collectionName: String, snapshotName: String): Boolean = transaction {
        SnapshotMetadataTable.deleteWhere {
            (SnapshotMetadataTable.collectionName eq collectionName) and
                    (SnapshotMetadataTable.snapshotName eq snapshotName)
        } > 0
    }

    private fun ResultRow.toSnapshotMetadata() = SnapshotMetadata(
        id = this[SnapshotMetadataTable.id],
        collectionName = this[SnapshotMetadataTable.collectionName],
        snapshotName = this[SnapshotMetadataTable.snapshotName],
        shardId = this[SnapshotMetadataTable.shardId],
        size = this[SnapshotMetadataTable.size],
        checksum = this[SnapshotMetadataTable.checksum],
        storageConfigId = this[SnapshotMetadataTable.storageConfigId],
        storagePath = this[SnapshotMetadataTable.storagePath],
        createdAt = this[SnapshotMetadataTable.createdAt]
    )
}
