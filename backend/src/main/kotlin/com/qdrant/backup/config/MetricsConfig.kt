package com.qdrant.backup.config

import io.micrometer.core.instrument.Counter
import io.micrometer.core.instrument.MeterRegistry
import io.micrometer.core.instrument.Timer
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class MetricsConfig(
    private val meterRegistry: MeterRegistry
) {
    @Bean
    fun backupJobsCounter(): Counter = Counter.builder("qdrant_backup_jobs_total")
        .description("Total number of backup jobs created")
        .register(meterRegistry)

    @Bean
    fun restoreJobsCounter(): Counter = Counter.builder("qdrant_restore_jobs_total")
        .description("Total number of restore jobs created")
        .register(meterRegistry)

    @Bean
    fun failedJobsCounter(): Counter = Counter.builder("qdrant_jobs_failed_total")
        .description("Total number of failed jobs")
        .register(meterRegistry)

    @Bean
    fun snapshotCreationTimer(): Timer = Timer.builder("qdrant_snapshot_creation_duration")
        .description("Time taken to create snapshots")
        .register(meterRegistry)

    @Bean
    fun snapshotSizeGauge() = meterRegistry.gauge("qdrant_snapshot_size_bytes", 0.0)
}
