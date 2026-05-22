package com.guitareffects.infrastructure.permission

import android.Manifest
import android.app.Activity
import android.content.pm.PackageManager
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

const val REQUEST_RECORD_AUDIO = 1001

class PermissionManager(private val activity: Activity) : IPermissionManager {

    override fun hasMicrophonePermission(): Boolean =
        ContextCompat.checkSelfPermission(
            activity,
            Manifest.permission.RECORD_AUDIO
        ) == PackageManager.PERMISSION_GRANTED

    override fun requestMicrophonePermission() {
        ActivityCompat.requestPermissions(
            activity,
            arrayOf(Manifest.permission.RECORD_AUDIO),
            REQUEST_RECORD_AUDIO
        )
    }
}
