package com.qdrant.backup.config

import com.qdrant.backup.repository.BackupJobsTable
import com.qdrant.backup.repository.SnapshotMetadataTable
import com.qdrant.backup.repository.StorageConfigTable
import jakarta.annotation.PostConstruct
import org.jetbrains.exposed.v1.jdbc.Database
import org.jetbrains.exposed.v1.jdbc.SchemaUtils
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.springframework.context.annotation.Configuration
import javax.sql.DataSource

@Configuration
class DatabaseConfig(
    private val dataSource: DataSource
) {
    @PostConstruct
    fun initializeDatabase() {
        Database.connect(dataSource)
        transaction {
            SchemaUtils.createMissingTablesAndColumns(
                StorageConfigTable,
                SnapshotMetadataTable,
                BackupJobsTable
            )
        }
    }
}
