package com.qdrant.backup.integration

import com.qdrant.backup.model.StorageConfigCreate
import com.qdrant.backup.model.StorageConfigUpdate
import com.qdrant.backup.model.StorageType
import com.qdrant.backup.repository.StorageConfigRepository
import com.qdrant.backup.repository.StorageConfigTable
import org.jetbrains.exposed.sql.Database
import org.jetbrains.exposed.sql.SchemaUtils
import org.jetbrains.exposed.sql.deleteAll
import org.jetbrains.exposed.sql.transactions.transaction
import org.junit.jupiter.api.*
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.testcontainers.containers.PostgreSQLContainer
import org.testcontainers.junit.jupiter.Container
import org.testcontainers.junit.jupiter.Testcontainers
import kotlin.test.assertNotNull
import kotlin.test.assertNull

@Tag("integration")
@Testcontainers
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class StorageConfigRepositoryTest {

    companion object {
        @Container
        @JvmStatic
        val postgres = PostgreSQLContainer("postgres:16-alpine")
            .withDatabaseName("test")
            .withUsername("test")
            .withPassword("test")
    }

    private lateinit var repository: StorageConfigRepository

    @BeforeAll
    fun setupDatabase() {
        postgres.start()
        Database.connect(
            url = postgres.jdbcUrl,
            driver = "org.postgresql.Driver",
            user = postgres.username,
            password = postgres.password
        )
        transaction {
            SchemaUtils.create(StorageConfigTable)
        }
        repository = StorageConfigRepository()
    }

    @AfterEach
    fun cleanup() {
        transaction {
            StorageConfigTable.deleteAll()
        }
    }

    @AfterAll
    fun teardown() {
        postgres.stop()
    }

    @Test
    fun `create and find storage config`() {
        val create = StorageConfigCreate(
            name = "Test Storage",
            type = StorageType.LOCAL,
            path = "/data/snapshots",
            isDefault = true
        )

        val created = repository.create(create)

        assertNotNull(created.id)
        assertEquals("Test Storage", created.name)
        assertEquals(StorageType.LOCAL, created.type)
        assertEquals("/data/snapshots", created.path)
        assertTrue(created.isDefault)

        val found = repository.findById(created.id)
        assertNotNull(found)
        assertEquals(created.id, found?.id)
    }

    @Test
    fun `findAll returns all configs`() {
        repository.create(StorageConfigCreate("Storage 1", StorageType.LOCAL, "/path1"))
        repository.create(StorageConfigCreate("Storage 2", StorageType.S3, s3Bucket = "bucket"))

        val all = repository.findAll()

        assertEquals(2, all.size)
    }

    @Test
    fun `update storage config`() {
        val created = repository.create(
            StorageConfigCreate("Original", StorageType.LOCAL, "/original/path")
        )

        val updated = repository.update(created.id, StorageConfigUpdate(name = "Updated", path = "/new/path"))

        assertNotNull(updated)
        assertEquals("Updated", updated?.name)
        assertEquals("/new/path", updated?.path)
    }

    @Test
    fun `setting new default unsets previous default`() {
        val first = repository.create(
            StorageConfigCreate("First", StorageType.LOCAL, "/first", isDefault = true)
        )
        assertTrue(first.isDefault)

        val second = repository.create(
            StorageConfigCreate("Second", StorageType.LOCAL, "/second", isDefault = true)
        )
        assertTrue(second.isDefault)

        val updatedFirst = repository.findById(first.id)
        assertFalse(updatedFirst?.isDefault ?: true)
    }

    @Test
    fun `delete storage config`() {
        val created = repository.create(
            StorageConfigCreate("To Delete", StorageType.LOCAL, "/delete")
        )

        val result = repository.delete(created.id)
        assertTrue(result)

        val found = repository.findById(created.id)
        assertNull(found)
    }

    @Test
    fun `s3 access key is masked in response`() {
        val created = repository.create(
            StorageConfigCreate(
                name = "S3 Storage",
                type = StorageType.S3,
                s3Endpoint = "https://s3.amazonaws.com",
                s3Bucket = "test-bucket",
                s3Region = "us-east-1",
                s3AccessKey = "AKIAIOSFODNN7EXAMPLE",
                s3SecretKey = "wJalrXUtnFEMI/K7MDENG"
            )
        )

        assertEquals("***********", created.s3AccessKey)
        assertNull(created.s3SecretKey)
    }
}
