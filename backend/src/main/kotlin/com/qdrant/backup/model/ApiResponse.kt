package com.qdrant.backup.model

import com.fasterxml.jackson.annotation.JsonInclude

@JsonInclude(JsonInclude.Include.NON_NULL)
data class ApiResponse<T>(
    val result: T? = null,
    val status: Any = "ok",
    val time: Double = 0.001
)

data class ErrorStatus(
    val error: String
)

fun <T> successResponse(result: T, time: Double = 0.001): ApiResponse<T> =
    ApiResponse(result = result, status = "ok", time = time)

fun errorResponse(message: String, time: Double = 0.001): ApiResponse<Nothing> =
    ApiResponse(status = ErrorStatus(message), time = time)
