package com.qdrant.backup.service

import com.qdrant.backup.client.QdrantClientWrapper
import com.qdrant.backup.model.*
import org.springframework.cache.annotation.Cacheable
import org.springframework.stereotype.Service

@Service
class ClusterService(
    private val qdrantClient: QdrantClientWrapper
) {

    fun getClusterStatus(): ClusterStatus {
        return qdrantClient.getClusterStatus()
    }

    fun getClusterNodes(): List<ClusterNode> {
        return qdrantClient.getClusterNodes()
    }
}
