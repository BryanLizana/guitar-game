package com.guitareffects.domain.repository

import com.guitareffects.domain.model.AudioState
import kotlinx.coroutines.flow.Flow

interface IAudioRepository {
    val audioState: Flow<AudioState>
    suspend fun startPassthrough(): Result<Unit>
    suspend fun stopPassthrough(): Result<Unit>
    fun isRunning(): Boolean
    fun setGain(gain: Float)
}
