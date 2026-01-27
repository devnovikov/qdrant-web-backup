package com.qdrant.backup.config

import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.client.SimpleClientHttpRequestFactory
import org.springframework.web.client.RestTemplate
import java.time.Duration

@ConfigurationProperties(prefix = "qdrant")
data class QdrantProperties(
    val host: String = "localhost",
    val port: Int = 6333,
    val apiKey: String? = null,
    val useTls: Boolean = false,
    val connectTimeout: Duration = Duration.ofSeconds(10),
    val readTimeout: Duration = Duration.ofMinutes(5)
)

@Configuration
@EnableConfigurationProperties(QdrantProperties::class)
class QdrantClientConfig(
    private val properties: QdrantProperties
) {
    @Bean
    fun restTemplate(): RestTemplate {
        val requestFactory = SimpleClientHttpRequestFactory().apply {
            setConnectTimeout(properties.connectTimeout)
            setReadTimeout(properties.readTimeout)
        }

        return RestTemplate(requestFactory).apply {
            interceptors.add { request, body, execution ->
                request.headers.set("Content-Type", "application/json")
                properties.apiKey?.takeIf { it.isNotBlank() }?.let {
                    request.headers.set("api-key", it)
                }
                execution.execute(request, body)
            }
        }
    }
}
