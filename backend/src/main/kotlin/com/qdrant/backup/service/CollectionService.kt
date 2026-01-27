package com.qdrant.backup.service

import com.qdrant.backup.client.QdrantClientWrapper
import com.qdrant.backup.model.*
import org.springframework.stereotype.Service

@Service
class CollectionService(
    private val qdrantClient: QdrantClientWrapper
) {

    fun listCollections(): CollectionsList {
        return qdrantClient.listCollections()
    }

    fun getCollection(name: String): CollectionDetail {
        return qdrantClient.getCollection(name)
    }

    fun getCollectionClusterInfo(name: String): CollectionClusterInfo {
        return qdrantClient.getCollectionClusterInfo(name)
    }
}
