package com.guitareffects.data.engine

import android.media.AudioAttributes
import android.media.AudioDeviceInfo
import android.media.AudioFormat
import android.media.AudioManager
import android.media.AudioRecord
import android.media.AudioTrack
import android.media.MediaRecorder
import com.guitareffects.infrastructure.diagnostic.IDiagnosticTracer
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.concurrent.atomic.AtomicInteger
import kotlin.math.tanh

class AudioEngine(
    private val audioManager: AudioManager,
    private val tracer: IDiagnosticTracer
) {
    companion object {
        private const val PREFERRED_SAMPLE_RATE = 48000
        private const val CHANNEL_IN = AudioFormat.CHANNEL_IN_MONO
        private const val CHANNEL_OUT = AudioFormat.CHANNEL_OUT_MONO
        private const val ENCODING = AudioFormat.ENCODING_PCM_16BIT
    }

    @Volatile private var isRunning = false
    @Volatile var gain = 4.0f  // default +12 dB — compensates USB interface line-level signal
    private var audioRecord: AudioRecord? = null
    private var audioTrack: AudioTrack? = null
    private var processingThread: Thread? = null
    private var totalFramesProcessed = 0L
    private val sessionId = AtomicInteger(0)

    fun isRunning() = isRunning

    suspend fun start(): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching {
            val session = sessionId.incrementAndGet()

            val usbInput = findUsbInputDevice()
            val usbOutput = findUsbOutputDevice()
            val sampleRate = resolveSampleRate(usbInput)

            // Maximize hardware output volume — software gain alone isn't enough if Android attenuates
            audioManager.setStreamVolume(
                AudioManager.STREAM_MUSIC,
                audioManager.getStreamMaxVolume(AudioManager.STREAM_MUSIC),
                0
            )

            // UNPROCESSED source only makes sense for the built-in mic
            val isUnprocessedSupported = usbInput == null && checkUnprocessedSupport()
            val audioSource = if (isUnprocessedSupported) {
                MediaRecorder.AudioSource.UNPROCESSED
            } else {
                MediaRecorder.AudioSource.MIC
            }

            val minRecordBuf = AudioRecord.getMinBufferSize(sampleRate, CHANNEL_IN, ENCODING)
            val minTrackBuf = AudioTrack.getMinBufferSize(sampleRate, CHANNEL_OUT, ENCODING)

            if (minRecordBuf == AudioRecord.ERROR_BAD_VALUE ||
                minTrackBuf == AudioTrack.ERROR_BAD_VALUE) {
                error("Device does not support audio format (${sampleRate}Hz PCM16)")
            }

            // Align track buffer to hardware native frame count so AudioFlinger uses the fast-track path
            val nativeFrames = audioManager.getProperty(AudioManager.PROPERTY_OUTPUT_FRAMES_PER_BUFFER)
                ?.toIntOrNull() ?: 0
            val recordBufSize = maxOf(minRecordBuf, 2048)
            val trackBufSize = if (nativeFrames > 0) {
                maxOf(nativeFrames * 2, minTrackBuf) // PCM16 mono = 2 bytes/frame
            } else {
                minTrackBuf
            }

            tracer.updateAudioParams(
                sampleRate = sampleRate,
                bufferSizeFrames = recordBufSize / 2,
                audioSource = if (isUnprocessedSupported) "UNPROCESSED" else "MIC",
                isUnprocessed = isUnprocessedSupported
            )

            val inputLabel = usbInput?.let { "USB(${it.productName})" } ?: "built-in mic"
            val outputLabel = usbOutput?.let { "USB(${it.productName})" } ?: "default out"
            tracer.log("Engine: $inputLabel → $outputLabel @ ${sampleRate}Hz | rec=${recordBufSize}B trk=${trackBufSize}B nativeFrames=$nativeFrames")

            val record = buildAudioRecord(audioSource, sampleRate, recordBufSize)
            usbInput?.let {
                record.setPreferredDevice(it)
                tracer.log("Engine: preferred input → ${it.productName} type=${it.type}")
            }
            if (record.state != AudioRecord.STATE_INITIALIZED) {
                record.release()
                error("AudioRecord failed to initialize (state=${record.state})")
            }

            val track = buildAudioTrack(sampleRate, trackBufSize)
            usbOutput?.let {
                track.setPreferredDevice(it)
                tracer.log("Engine: preferred output → ${it.productName} type=${it.type}")
            }
            if (track.state != AudioTrack.STATE_INITIALIZED) {
                record.release()
                track.release()
                error("AudioTrack failed to initialize (state=${track.state})")
            }

            audioRecord = record
            audioTrack = track

            val estimatedLatencyMs = estimateLatency(recordBufSize, trackBufSize, sampleRate)

            isRunning = true
            totalFramesProcessed = 0L

            record.startRecording()
            tracer.updateRecordState("RECORDING")
            track.play()
            tracer.updateTrackState("PLAYING")
            tracer.log("Engine: streams started — estimated latency ${estimatedLatencyMs}ms")

            launchProcessingThread(record, track, recordBufSize, estimatedLatencyMs, sampleRate, session)
        }
    }

    suspend fun stop(): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching {
            isRunning = false

            // Stop AudioRecord FIRST so the blocked read() in the thread returns,
            // then join the thread, then release resources.
            audioRecord?.let {
                runCatching { it.stop() }
                tracer.updateRecordState("IDLE")
            }

            processingThread?.let { t ->
                t.interrupt()
                t.join(3000)
                if (t.isAlive) tracer.logError("Engine: processing thread still alive after 3s")
            }
            processingThread = null

            audioRecord?.let { it.release() }
            audioRecord = null

            audioTrack?.let {
                runCatching { it.stop() }
                it.release()
                tracer.updateTrackState("IDLE")
            }
            audioTrack = null
            tracer.log("Engine: stopped cleanly")
        }
    }

    private fun buildAudioRecord(audioSource: Int, sampleRate: Int, bufferSize: Int): AudioRecord {
        return AudioRecord.Builder()
            .setAudioSource(audioSource)
            .setAudioFormat(
                AudioFormat.Builder()
                    .setEncoding(ENCODING)
                    .setSampleRate(sampleRate)
                    .setChannelMask(CHANNEL_IN)
                    .build()
            )
            .setBufferSizeInBytes(bufferSize)
            .build()
    }

    private fun buildAudioTrack(sampleRate: Int, bufferSize: Int): AudioTrack {
        return AudioTrack.Builder()
            .setAudioAttributes(
                AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_MEDIA)
                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                    .build()
            )
            .setAudioFormat(
                AudioFormat.Builder()
                    .setEncoding(ENCODING)
                    .setSampleRate(sampleRate)
                    .setChannelMask(CHANNEL_OUT)
                    .build()
            )
            .setBufferSizeInBytes(bufferSize)
            .setTransferMode(AudioTrack.MODE_STREAM)
            .setPerformanceMode(AudioTrack.PERFORMANCE_MODE_LOW_LATENCY)
            .build()
    }

    private fun launchProcessingThread(
        record: AudioRecord,
        track: AudioTrack,
        bufferSize: Int,
        latencyMs: Float,
        sampleRate: Int,
        session: Int
    ) {
        val buffer = ShortArray(bufferSize / 2)
        var underruns = 0

        processingThread = Thread({
            android.os.Process.setThreadPriority(android.os.Process.THREAD_PRIORITY_URGENT_AUDIO)
            var dcPrevIn = 0f
            var dcPrevOut = 0f
            while (isRunning && session == sessionId.get() && !Thread.currentThread().isInterrupted) {
                val read = record.read(buffer, 0, buffer.size)
                when {
                    read > 0 -> {
                        val g = gain
                        for (i in 0 until read) {
                            // DC blocker (IIR ~20 Hz cutoff): eliminates DC offset so the
                            // soft clipper doesn't saturate asymmetrically
                            val x = buffer[i].toFloat()
                            val dcOut = x - dcPrevIn + 0.9975f * dcPrevOut
                            dcPrevIn = x
                            dcPrevOut = dcOut

                            // tanh soft clip: transparent at low levels, smooth saturation
                            // at peaks — no harsh digital hard-clip buzz
                            val normalized = dcOut * g / 32768f
                            buffer[i] = (tanh(normalized.toDouble()).toFloat() * 32767f)
                                .toInt().toShort()
                        }
                        val written = track.write(buffer, 0, read)
                        if (written < 0) {
                            underruns++
                            tracer.logError("Engine: track write error $written (underrun #$underruns)")
                        }
                        totalFramesProcessed += read

                        if (totalFramesProcessed % (sampleRate * 2L) == 0L) {
                            tracer.updateRunningStats(totalFramesProcessed, underruns, latencyMs)
                        }
                    }
                    read == AudioRecord.ERROR_INVALID_OPERATION -> {
                        tracer.logError("Engine: read ERROR_INVALID_OPERATION")
                        isRunning = false
                    }
                    read == AudioRecord.ERROR_BAD_VALUE -> {
                        tracer.logError("Engine: read ERROR_BAD_VALUE")
                        isRunning = false
                    }
                }
            }
        }, "audio-passthrough-thread")

        processingThread!!.start()
    }

    private fun estimateLatency(recordBufBytes: Int, trackBufBytes: Int, sampleRate: Int): Float {
        val totalFrames = (recordBufBytes + trackBufBytes) / 2
        return (totalFrames.toFloat() / sampleRate) * 1000f
    }

    private fun checkUnprocessedSupport(): Boolean {
        return audioManager.getProperty(AudioManager.PROPERTY_SUPPORT_AUDIO_SOURCE_UNPROCESSED) == "true"
    }

    private fun findUsbInputDevice(): AudioDeviceInfo? =
        audioManager.getDevices(AudioManager.GET_DEVICES_INPUTS).firstOrNull {
            it.type == AudioDeviceInfo.TYPE_USB_DEVICE || it.type == AudioDeviceInfo.TYPE_USB_HEADSET
        }

    private fun findUsbOutputDevice(): AudioDeviceInfo? =
        audioManager.getDevices(AudioManager.GET_DEVICES_OUTPUTS).firstOrNull {
            it.type == AudioDeviceInfo.TYPE_USB_DEVICE || it.type == AudioDeviceInfo.TYPE_USB_HEADSET
        }

    // Returns the best sample rate supported by the USB device, or the preferred default.
    // getSampleRates() returns an empty array when the device accepts any rate.
    private fun resolveSampleRate(usbDevice: AudioDeviceInfo?): Int {
        val rates = usbDevice?.sampleRates ?: intArrayOf()
        if (rates.isEmpty()) return PREFERRED_SAMPLE_RATE
        return when {
            PREFERRED_SAMPLE_RATE in rates -> PREFERRED_SAMPLE_RATE
            44100 in rates -> 44100
            else -> rates.max()
        }
    }
}
