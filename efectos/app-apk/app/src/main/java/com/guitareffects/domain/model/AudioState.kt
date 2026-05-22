package com.guitareffects.domain.model

sealed class AudioState {
    object Idle : AudioState()
    object Starting : AudioState()
    object Running : AudioState()
    object Stopping : AudioState()
    data class Error(val message: String, val code: Int = -1) : AudioState()
}
