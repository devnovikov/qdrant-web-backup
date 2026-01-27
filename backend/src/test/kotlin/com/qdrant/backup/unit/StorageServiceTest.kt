package com.qdrant.backup.unit

import com.qdrant.backup.model.*
import com.qdrant.backup.repository.StorageConfigRepository
import com.qdrant.backup.service.StorageService
import io.mockk.*
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Tag
import org.junit.jupiter.api.Test
import java.time.Instant

@Tag("unit")
class StorageServiceTest {

    private lateinit var repository: StorageConfigRepository
    private lateinit var storageService: StorageService

    @BeforeEach
    fun setup() {
        repository = mockk()
        storageService = StorageService(repository)
    }

    @Test
    fun `getAllConfigs returns all storage configurations`() {
        val configs = listOf(
            StorageConfig(
                id = "1",
                name = "Local",
                type = StorageType.LOCAL,
                path = "/data",
                isDefault = true,
                createdAt = Instant.now(),
                updatedAt = Instant.now()
            ),
            StorageConfig(
                id = "2",
                name = "S3",
                type = StorageType.S3,
                s3Bucket = "test-bucket",
                isDefault = false,
                createdAt = Instant.now(),
                updatedAt = Instant.now()
            )
        )

        every { repository.findAll() } returns configs

        val result = storageService.getAllConfigs()

        assertEquals(2, result.size)
        assertEquals("Local", result[0].name)
        assertEquals("S3", result[1].name)
    }

    @Test
    fun `createConfig creates new storage configuration`() {
        val create = StorageConfigCreate(
            name = "New Storage",
            type = StorageType.LOCAL,
            path = "/new/path",
            isDefault = false
        )

        val created = StorageConfig(
            id = "new-id",
            name = "New Storage",
            type = StorageType.LOCAL,
            path = "/new/path",
            isDefault = false,
            createdAt = Instant.now(),
            updatedAt = Instant.now()
        )

        every { repository.create(create) } returns created

        val result = storageService.createConfig(create)

        assertEquals("new-id", result.id)
        assertEquals("New Storage", result.name)
        verify { repository.create(create) }
    }

    @Test
    fun `deleteConfig throws when trying to delete default config`() {
        val config = StorageConfig(
            id = "1",
            name = "Default",
            type = StorageType.LOCAL,
            path = "/data",
            isDefault = true,
            createdAt = Instant.now(),
            updatedAt = Instant.now()
        )

        every { repository.findById("1") } returns config

        assertThrows(IllegalArgumentException::class.java) {
            storageService.deleteConfig("1")
        }
    }

    @Test
    fun `deleteConfig succeeds for non-default config`() {
        val config = StorageConfig(
            id = "2",
            name = "Non-Default",
            type = StorageType.LOCAL,
            path = "/data",
            isDefault = false,
            createdAt = Instant.now(),
            updatedAt = Instant.now()
        )

        every { repository.findById("2") } returns config
        every { repository.delete("2") } returns true

        val result = storageService.deleteConfig("2")

        assertTrue(result)
        verify { repository.delete("2") }
    }

    @Test
    fun `testConnectivity returns success for valid local path`() {
        val config = StorageConfigCreate(
            name = "Test",
            type = StorageType.LOCAL,
            path = System.getProperty("java.io.tmpdir")
        )

        val result = storageService.testConnectivity(config)

        assertTrue(result.success)
    }
}
