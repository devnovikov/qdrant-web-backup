package com.qdrant.backup

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.scheduling.annotation.EnableScheduling

@SpringBootApplication
@EnableScheduling
class QdrantBackupApplication

fun main(args: Array<String>) {
    runApplication<QdrantBackupApplication>(*args)
}
