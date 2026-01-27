package com.qdrant.backup.unit

import com.qdrant.backup.controller.ClusterController
import com.qdrant.backup.model.*
import com.qdrant.backup.service.ClusterService
import io.mockk.every
import io.mockk.mockk
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Tag
import org.junit.jupiter.api.Test
import org.springframework.http.HttpStatus

@Tag("unit")
class ClusterControllerTest {

    private lateinit var clusterService: ClusterService
    private lateinit var controller: ClusterController

    @BeforeEach
    fun setup() {
        clusterService = mockk()
        controller = ClusterController(clusterService)
    }

    @Test
    fun `getClusterStatus returns OK with cluster status`() {
        val status = ClusterStatus(
            status = "green",
            peerId = 1L,
            peers = mapOf(1L to PeerInfo("http://localhost:6333")),
            raftInfo = RaftInfo(
                term = 1,
                commit = 100,
                pendingOperations = 0,
                leader = 1L,
                role = "Leader",
                isVoter = true
            )
        )

        every { clusterService.getClusterStatus() } returns status

        val response = controller.getClusterStatus()

        assertEquals(HttpStatus.OK, response.statusCode)
        assertEquals("green", response.body?.result?.status)
        assertEquals(1L, response.body?.result?.peerId)
    }

    @Test
    fun `getClusterStatus returns 503 on error`() {
        every { clusterService.getClusterStatus() } throws RuntimeException("Connection refused")

        val response = controller.getClusterStatus()

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, response.statusCode)
    }

    @Test
    fun `getClusterNodes returns OK with node list`() {
        val nodes = listOf(
            ClusterNode(peerId = 1L, uri = "http://node1:6333", isLeader = true, shardsCount = 5),
            ClusterNode(peerId = 2L, uri = "http://node2:6333", isLeader = false, shardsCount = 3)
        )

        every { clusterService.getClusterNodes() } returns nodes

        val response = controller.getClusterNodes()

        assertEquals(HttpStatus.OK, response.statusCode)
        assertEquals(2, response.body?.result?.size)
        assertTrue(response.body?.result?.get(0)?.isLeader == true)
    }
}
