package com.guitareffects.infrastructure.permission

interface IPermissionManager {
    fun hasMicrophonePermission(): Boolean
    fun requestMicrophonePermission()
}
