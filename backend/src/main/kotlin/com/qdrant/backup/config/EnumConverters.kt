package com.qdrant.backup.config

import com.qdrant.backup.model.JobStatus
import com.qdrant.backup.model.JobType
import org.springframework.core.convert.converter.Converter
import org.springframework.stereotype.Component

@Component
class StringToJobStatusConverter : Converter<String, JobStatus> {
    override fun convert(source: String): JobStatus {
        return JobStatus.entries.find { it.value == source || it.name.equals(source, ignoreCase = true) }
            ?: throw IllegalArgumentException("Unknown job status: $source")
    }
}

@Component
class StringToJobTypeConverter : Converter<String, JobType> {
    override fun convert(source: String): JobType {
        return JobType.entries.find { it.value == source || it.name.equals(source, ignoreCase = true) }
            ?: throw IllegalArgumentException("Unknown job type: $source")
    }
}
