package com.guitareffects.domain.model

data class DiagnosticInfo(
    val sampleRate: Int = 0,
    val bufferSizeFrames: Int = 0,
    val isUnprocessedSourceSupported: Boolean = false,
    val audioSourceInUse: String = "NONE",
    val recordState: String = "IDLE",
    val trackState: String = "IDLE",
    val estimatedLatencyMs: Float = 0f,
    val underrunCount: Int = 0,
    val totalFramesProcessed: Long = 0L,
    val micPermissionGranted: Boolean = false,
    val errorLog: List<String> = emptyList()
)
