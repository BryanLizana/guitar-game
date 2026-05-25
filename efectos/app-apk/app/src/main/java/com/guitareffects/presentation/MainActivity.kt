package com.guitareffects.presentation

import android.content.pm.PackageManager
import android.content.res.ColorStateList
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.SeekBar
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import com.guitareffects.BuildConfig
import com.guitareffects.GuitarEffectsApp
import com.guitareffects.R
import com.guitareffects.audio.JniAudioEngine
import com.guitareffects.databinding.ActivityMainBinding
import com.guitareffects.domain.model.AudioEffect
import com.guitareffects.domain.model.AudioState
import com.guitareffects.infrastructure.permission.REQUEST_RECORD_AUDIO
import com.guitareffects.infrastructure.permission.PermissionManager
import com.guitareffects.presentation.diagnostic.DiagnosticDialogFragment
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject
import kotlin.math.pow

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var viewModel: MainViewModel
    private lateinit var permissionManager: PermissionManager

    private val effectState = mutableMapOf(
        AudioEffect.REVERB    to false,
        AudioEffect.DELAY     to false,
        AudioEffect.OVERDRIVE to false,
        AudioEffect.WAH       to false,
        AudioEffect.NAM       to false,
    )

    // File picker for .nam model files (no extra permissions needed on API 29+)
    private val pickNamFile = registerForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        uri ?: return@registerForActivityResult
        lifecycleScope.launch {
            loadNamFromUri(uri)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.tvTitle.text = "Guitar Effects  [${BuildConfig.BUILD_TIME}]"

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

        setupDelayControls()
        setupReverbControls()
        setupOverdriveControls()
        setupWahControls()

        // Gain SeekBar (0 → −6 dB, 100 → +24 dB)
        applyGain(binding.seekGain.progress)
        binding.seekGain.setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(bar: SeekBar, progress: Int, fromUser: Boolean) {
                applyGain(progress)
            }
            override fun onStartTrackingTouch(bar: SeekBar) = Unit
            override fun onStopTrackingTouch(bar: SeekBar) = Unit
        })

        // Pedal buttons — each shows/hides its controls panel on toggle
        setupPedal(binding.btnReverb, AudioEffect.REVERB,
            R.color.pedal_reverb_off, R.color.pedal_reverb_on, "REVERB",
            onToggle = { on ->
                binding.layoutReverbControls.visibility = if (on) View.VISIBLE else View.GONE
            })
        setupPedal(binding.btnOverdrive, AudioEffect.OVERDRIVE,
            R.color.pedal_overdrive_off, R.color.pedal_overdrive_on, "OVERDRIVE",
            onToggle = { on ->
                binding.layoutOverdriveControls.visibility = if (on) View.VISIBLE else View.GONE
            })
        setupPedal(binding.btnWah, AudioEffect.WAH,
            R.color.pedal_wah_off, R.color.pedal_wah_on, "WAH-WAH",
            onToggle = { on ->
                binding.layoutWahControls.visibility = if (on) View.VISIBLE else View.GONE
            })

        // DELAY has extra controls panel
        setupPedal(binding.btnDelay, AudioEffect.DELAY,
            R.color.pedal_delay_off, R.color.pedal_delay_on, "DELAY",
            onToggle = { on ->
                binding.layoutDelayControls.visibility =
                    if (on) View.VISIBLE else View.GONE
            })

        // NAM pedal — enabled only after a model is loaded
        setupPedal(binding.btnNam, AudioEffect.NAM,
            R.color.pedal_reverb_off, R.color.pedal_reverb_on, "NAM")

        binding.btnLoadNam.setOnClickListener {
            pickNamFile.launch("*/*")
        }

        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.audioState.collect { renderState(it) }
            }
        }

        // Poll native diagnostic info every second while running
        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                while (true) {
                    if (viewModel.audioState.value is AudioState.Running) {
                        binding.tvDiagLine.text = JniAudioEngine.nativeGetDiagInfo()
                    }
                    kotlinx.coroutines.delay(1000L)
                }
            }
        }
    }

    private fun setupReverbControls() {
        // ROOM: progress 0-100 → 0.30-0.95
        binding.seekReverbRoom.setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(bar: SeekBar, p: Int, fromUser: Boolean) {
                val room = 0.30f + p / 100f * 0.65f
                binding.tvReverbRoom.text = "ROOM: ${"%.2f".format(room)}"
                JniAudioEngine.nativeSetReverbParam(JniAudioEngine.REVERB_ROOM, room)
            }
            override fun onStartTrackingTouch(bar: SeekBar) = Unit
            override fun onStopTrackingTouch(bar: SeekBar) = Unit
        })
        // MIX: progress 0-100 → 0%-60%
        binding.seekReverbMix.setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(bar: SeekBar, p: Int, fromUser: Boolean) {
                val wet = p / 100f * 0.60f
                binding.tvReverbMix.text = "MIX: ${(wet * 100).toInt()}%"
                JniAudioEngine.nativeSetReverbParam(JniAudioEngine.REVERB_MIX, wet)
            }
            override fun onStartTrackingTouch(bar: SeekBar) = Unit
            override fun onStopTrackingTouch(bar: SeekBar) = Unit
        })
    }

    private fun setupOverdriveControls() {
        // DRIVE: progress 0-100 → 1×-15×
        binding.seekOdDrive.setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(bar: SeekBar, p: Int, fromUser: Boolean) {
                val drive = 1f + p / 100f * 14f
                binding.tvOdDrive.text = "DRIVE: ${"%.1f".format(drive)}×"
                JniAudioEngine.nativeSetOverdriveParam(JniAudioEngine.OD_DRIVE, drive)
            }
            override fun onStartTrackingTouch(bar: SeekBar) = Unit
            override fun onStopTrackingTouch(bar: SeekBar) = Unit
        })
        // TONE: progress 0-100 → 0.0-1.0 (dark→bright)
        binding.seekOdTone.setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(bar: SeekBar, p: Int, fromUser: Boolean) {
                val tone = p / 100f
                binding.tvOdTone.text = "TONE: ${p}%"
                JniAudioEngine.nativeSetOverdriveParam(JniAudioEngine.OD_TONE, tone)
            }
            override fun onStartTrackingTouch(bar: SeekBar) = Unit
            override fun onStopTrackingTouch(bar: SeekBar) = Unit
        })
    }

    private fun setupWahControls() {
        // SPEED: progress 0-100 → 0.3-5.0 Hz
        binding.seekWahSpeed.setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(bar: SeekBar, p: Int, fromUser: Boolean) {
                val hz = 0.3f + p / 100f * 4.7f
                binding.tvWahSpeed.text = "SPEED: ${"%.1f".format(hz)} Hz"
                JniAudioEngine.nativeSetWahParam(JniAudioEngine.WAH_SPEED, hz)
            }
            override fun onStartTrackingTouch(bar: SeekBar) = Unit
            override fun onStopTrackingTouch(bar: SeekBar) = Unit
        })
        // RESONANCE: progress 0-100 → Q 1.0-6.0
        binding.seekWahRes.setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(bar: SeekBar, p: Int, fromUser: Boolean) {
                val q = 1f + p / 100f * 5f
                binding.tvWahRes.text = "RESONANCE: ${"%.1f".format(q)}"
                JniAudioEngine.nativeSetWahParam(JniAudioEngine.WAH_RES, q)
            }
            override fun onStartTrackingTouch(bar: SeekBar) = Unit
            override fun onStopTrackingTouch(bar: SeekBar) = Unit
        })
    }

    private fun setupDelayControls() {
        // TIME: progress 0-100 → 50-750 ms
        binding.seekDelayTime.setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(bar: SeekBar, p: Int, fromUser: Boolean) {
                val ms = 50f + p * 7.0f   // 0→50ms, 100→750ms
                binding.tvDelayTime.text = "TIME: ${ms.toInt()} ms"
                JniAudioEngine.nativeSetDelayParam(JniAudioEngine.DELAY_TIME_MS, ms)
            }
            override fun onStartTrackingTouch(bar: SeekBar) = Unit
            override fun onStopTrackingTouch(bar: SeekBar) = Unit
        })
        // FEEDBACK: progress 0-100 → 0%-90%
        binding.seekDelayFeedback.setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(bar: SeekBar, p: Int, fromUser: Boolean) {
                val fb = p / 100f * 0.90f
                binding.tvDelayFeedback.text = "FEEDBACK: ${(fb * 100).toInt()}%"
                JniAudioEngine.nativeSetDelayParam(JniAudioEngine.DELAY_FEEDBACK, fb)
            }
            override fun onStartTrackingTouch(bar: SeekBar) = Unit
            override fun onStopTrackingTouch(bar: SeekBar) = Unit
        })
        // WET/MIX: progress 0-100 → 0%-70%
        binding.seekDelayWet.setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(bar: SeekBar, p: Int, fromUser: Boolean) {
                val wet = p / 100f * 0.70f
                binding.tvDelayWet.text = "MIX: ${(wet * 100).toInt()}%"
                JniAudioEngine.nativeSetDelayParam(JniAudioEngine.DELAY_WET, wet)
            }
            override fun onStartTrackingTouch(bar: SeekBar) = Unit
            override fun onStopTrackingTouch(bar: SeekBar) = Unit
        })
    }

    private fun setupPedal(
        btn: Button,
        effect: AudioEffect,
        colorOff: Int,
        colorOn: Int,
        label: String,
        onToggle: ((Boolean) -> Unit)? = null
    ) {
        updatePedalButton(btn, false, colorOff, colorOn, label)
        btn.setOnClickListener {
            val newState = !(effectState[effect] ?: false)
            effectState[effect] = newState
            viewModel.setEffectEnabled(effect, newState)
            updatePedalButton(btn, newState, colorOff, colorOn, label)
            onToggle?.invoke(newState)
        }
    }

    private fun updatePedalButton(
        btn: Button,
        active: Boolean,
        colorOff: Int,
        colorOn: Int,
        label: String
    ) {
        val color = ContextCompat.getColor(this, if (active) colorOn else colorOff)
        btn.backgroundTintList = ColorStateList.valueOf(color)
        btn.setTextColor(ContextCompat.getColor(this,
            if (active) R.color.text_primary else R.color.text_secondary))
        btn.text = if (active) "$label\n● ON" else "$label\n○ OFF"
    }

    private fun renderState(state: AudioState) {
        when (state) {
            is AudioState.Idle -> {
                binding.btnToggle.text = "START"
                binding.btnToggle.isEnabled = true
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

    private fun applyGain(progress: Int) {
        // Range: -6 dB (slider 0) to +12 dB (slider 100)
        // Default progress=60 → +4.8 dB → gain ≈1.7×  (safe for all pickup types)
        val db = -6f + (progress / 100f) * 18f
        viewModel.setGain(10f.pow(db / 20f))
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
            if (granted) viewModel.togglePassthrough()
            else binding.tvStatus.text = "Microphone permission required"
        }
    }

    // Standard NeuralAmpModelerCore WaveNet: config.layers[] is an array of layer groups,
    // each with channels/kernel_size/dilations[]/head_size/head_bias.
    private fun loadWaveNetModel(config: JSONObject, weights: FloatArray): Pair<Boolean, String> {
        val layersArr = config.getJSONArray("layers")
        val numGroups = layersArr.length()
        val first = layersArr.getJSONObject(0)

        if (!first.has("head_size")) {
            error("Unsupported WaveNet config (no head_size in layer groups). Keys: ${first.keys().asSequence().joinToString()}")
        }

        val headScale = config.optDouble("head_scale", 1.0).toFloat()
        val groupChannels    = IntArray(numGroups)
        val groupKernelSizes = IntArray(numGroups)
        val groupHeadSizes   = IntArray(numGroups)
        val groupHeadBias    = IntArray(numGroups)
        val dilationCounts   = IntArray(numGroups)
        val allDilations     = mutableListOf<Int>()

        for (i in 0 until numGroups) {
            val g = layersArr.getJSONObject(i)
            groupChannels[i]    = g.getInt("channels")
            groupKernelSizes[i] = g.getInt("kernel_size")
            groupHeadSizes[i]   = g.getInt("head_size")
            groupHeadBias[i]    = if (g.optBoolean("head_bias", false)) 1 else 0
            val dilArr = g.getJSONArray("dilations")
            dilationCounts[i] = dilArr.length()
            repeat(dilArr.length()) { j -> allDilations += dilArr.getInt(j) }
        }

        val loaded = JniAudioEngine.nativeLoadNamWaveNetGroups(
            numGroups,
            groupChannels, groupKernelSizes, groupHeadSizes, groupHeadBias,
            dilationCounts, allDilations.toIntArray(),
            headScale, weights
        )
        val totalLayers = dilationCounts.sum()
        return Pair(loaded, "WaveNet G=$numGroups L=$totalLayers C=${groupChannels.last()}")
    }

    private suspend fun loadNamFromUri(uri: Uri) {
        val result = withContext(Dispatchers.IO) {
            runCatching {
                val text = contentResolver.openInputStream(uri)!!.use { it.bufferedReader().readText() }
                val json       = JSONObject(text)
                val arch       = json.getString("architecture")
                val weightsArr = json.getJSONArray("weights")
                val weights    = FloatArray(weightsArr.length()) { weightsArr.getDouble(it).toFloat() }
                val sampleRate = if (json.has("sample_rate")) json.getDouble("sample_rate").toInt() else -1

                val (ok, info) = when (arch) {
                    "LSTM" -> {
                        val config     = json.getJSONObject("config")
                        val hiddenSize = config.getInt("hidden_size")
                        val numLayers  = config.getInt("num_layers")
                        val inputSize  = config.optInt("input_size", 1)
                        val loaded = JniAudioEngine.nativeLoadNamLstm(numLayers, inputSize, hiddenSize, weights)
                        Pair(loaded, "LSTM h=$hiddenSize layers=$numLayers")
                    }
                    "WaveNet" -> loadWaveNetModel(json.getJSONObject("config"), weights)
                    else -> error("Unsupported architecture: $arch")
                }
                Triple(ok, "$info${if (sampleRate > 0) " @${sampleRate}Hz" else ""}", sampleRate)
            }
        }
        result.onSuccess { (ok, info, sr) ->
            if (ok) {
                binding.btnNam.isEnabled = true
                binding.tvNamInfo.text = info
                binding.tvNamInfo.visibility = View.VISIBLE
                if (sr > 0 && sr != JniAudioEngine.nativeGetActualSampleRate()) {
                    Toast.makeText(this,
                        "Model @${sr}Hz, engine @${JniAudioEngine.nativeGetActualSampleRate()}Hz — tone may vary",
                        Toast.LENGTH_LONG).show()
                }
            } else {
                Toast.makeText(this, "Failed to load model (weight mismatch?)", Toast.LENGTH_LONG).show()
            }
        }.onFailure { e ->
            Toast.makeText(this, "Error: ${e.message}", Toast.LENGTH_LONG).show()
        }
    }

    override fun onStop() {
        super.onStop()
        if (viewModel.audioState.value is AudioState.Running) viewModel.togglePassthrough()
    }
}
