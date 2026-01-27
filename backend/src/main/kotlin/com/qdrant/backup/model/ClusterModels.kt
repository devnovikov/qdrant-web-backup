package com.qdrant.backup.model

import com.fasterxml.jackson.annotation.JsonProperty

data class ClusterStatus(
    val status: String,
    @JsonProperty("peer_id")
    val peerId: Long,
    val peers: Map<Long, PeerInfo>,
    @JsonProperty("raft_info")
    val raftInfo: RaftInfo
)

data class PeerInfo(
    val uri: String
)

data class RaftInfo(
    val term: Long,
    val commit: Long,
    @JsonProperty("pending_operations")
    val pendingOperations: Int,
    val leader: Long,
    val role: String,
    @field:JsonProperty("is_voter")
    @param:JsonProperty("is_voter")
    val isVoter: Boolean
)

data class ClusterNode(
    @JsonProperty("peer_id")
    val peerId: Long,
    val uri: String,
    @field:JsonProperty("is_leader")
    @param:JsonProperty("is_leader")
    val isLeader: Boolean,
    @JsonProperty("shards_count")
    val shardsCount: Int
)
