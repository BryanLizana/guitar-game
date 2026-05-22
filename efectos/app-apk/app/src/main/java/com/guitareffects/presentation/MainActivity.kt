package com.guitareffects.presentation

import android.content.pm.PackageManager
import android.os.Bundle
import android.widget.SeekBar
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import com.guitareffects.GuitarEffectsApp
import com.guitareffects.databinding.ActivityMainBinding
import com.guitareffects.domain.model.AudioState
import com.guitareffects.infrastructure.permission.REQUEST_RECORD_AUDIO
import com.guitareffects.infrastructure.permission.PermissionManager
import com.guitareffects.presentation.diagnostic.DiagnosticDialogFragment
import kotlinx.coroutines.launch
import kotlin.math.pow

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var viewModel: MainViewModel
    private lateinit var permissionManager: PermissionManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        permissionManager = PermissionManager(this)

        val app = application as GuitarEffectsApp
        viewModel = ViewModelProvider(this, app.viewModelFactory)[MainViewModel::class.java]

        viewModel.updatePermissionState(permissionManager.hasMicrophonePermission())

        binding.btnToggle.setOnClickListener {
            if (permissionManager.hasMicrophonePermission()) {
                viewModel.togglePassthrough()
            } else {
                permissionManager.requestMicrophonePermission()
            }
        }

        binding.btnDiagnostics.setOnClickListener {
            DiagnosticDialogFragment.newInstance()
                .show(supportFragmentManager, DiagnosticDialogFragment.TAG)
        }

        // Apply initial gain from SeekBar default (progress=60 → +12 dB)
        applyGain(binding.seekGain.progress)
        binding.seekGain.setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(bar: SeekBar, progress: Int, fromUser: Boolean) {
                applyGain(progress)
            }
            override fun onStartTrackingTouch(bar: SeekBar) = Unit
            override fun onStopTrackingTouch(bar: SeekBar) = Unit
        })

        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.audioState.collect { state ->
                    renderState(state)
                }
            }
        }
    }

    private fun renderState(state: AudioState) {
        when (state) {
            is AudioState.Idle -> {
                binding.btnToggle.text = "START"
                binding.viewStatusLed.setBackgroundResource(android.R.drawable.presence_offline)
                binding.tvStatus.text = "Ready — connect headphones and press START"
            }
            is AudioState.Starting -> {
                binding.btnToggle.text = "…"
                binding.btnToggle.isEnabled = false
                binding.tvStatus.text = "Starting audio engine…"
            }
            is AudioState.Running -> {
                binding.btnToggle.text = "STOP"
                binding.btnToggle.isEnabled = true
                binding.viewStatusLed.setBackgroundResource(android.R.drawable.presence_online)
                binding.tvStatus.text = "MIC → HEADPHONES active"
            }
            is AudioState.Stopping -> {
                binding.btnToggle.text = "…"
                binding.btnToggle.isEnabled = false
                binding.tvStatus.text = "Stopping…"
            }
            is AudioState.Error -> {
                binding.btnToggle.text = "RETRY"
                binding.btnToggle.isEnabled = true
                binding.viewStatusLed.setBackgroundResource(android.R.drawable.presence_busy)
                binding.tvStatus.text = "Error: ${state.message}"
            }
        }
    }

    // SeekBar 0→100 maps to −6 dB→+24 dB (30 dB range)
    private fun applyGain(progress: Int) {
        val db = -6f + (progress / 100f) * 30f
        val gain = 10f.pow(db / 20f)
        viewModel.setGain(gain)
        val sign = if (db >= 0f) "+" else ""
        binding.tvGainLabel.text = "GAIN: $sign${"%.1f".format(db)} dB"
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == REQUEST_RECORD_AUDIO) {
            val granted = grantResults.firstOrNull() == PackageManager.PERMISSION_GRANTED
            viewModel.updatePermissionState(granted)
            if (granted) {
                viewModel.togglePassthrough()
            } else {
                binding.tvStatus.text = "Microphone permission required"
            }
        }
    }

    override fun onStop() {
        super.onStop()
        if (viewModel.audioState.value is AudioState.Running) {
            viewModel.togglePassthrough()
        }
    }
}
