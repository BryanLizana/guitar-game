package com.guitareffects.audio

import android.content.Context
import android.media.AudioDeviceInfo
import android.media.AudioManager
import androidx.core.content.getSystemService
import com.guitareffects.domain.model.AudioEffect

object JniAudioEngine {

    init { System.loadLibrary("guitar-engine") }

    data class DeviceParams(
        val sampleRate: Int,
        val framesPerBurst: Int,
        val inputDeviceId: Int,
        val inputProductName: String?,
        val inputNativeRates: IntArray,
    )

    fun queryDeviceParams(context: Context): DeviceParams {
        val am = context.getSystemService<AudioManager>()!!

        val outputSampleRate = am
            .getProperty(AudioManager.PROPERTY_OUTPUT_SAMPLE_RATE)
            ?.toIntOrNull() ?: 48000
        val framesPerBurst = am
            .getProperty(AudioManager.PROPERTY_OUTPUT_FRAMES_PER_BUFFER)
            ?.toIntOrNull() ?: 256

        // Prefer USB interfaces (guitar audio devices). Fall back to built-in mic.
        val usbInput = am.getDevices(AudioManager.GET_DEVICES_INPUTS).firstOrNull {
            it.type == AudioDeviceInfo.TYPE_USB_DEVICE ||
            it.type == AudioDeviceInfo.TYPE_USB_HEADSET
        }

        val nativeRates = usbInput?.sampleRates ?: intArrayOf()

        // If the USB device only supports rates that differ from the Android
        // mixer rate, prefer one the device exposes natively — avoids cascaded
        // resampling inside the input path.
        val chosenSampleRate = when {
            nativeRates.isEmpty() -> outputSampleRate
            outputSampleRate in nativeRates.toList() -> outputSampleRate
            48000 in nativeRates.toList() -> 48000
            44100 in nativeRates.toList() -> 44100
            else -> nativeRates.max()
        }

        return DeviceParams(
            sampleRate       = chosenSampleRate,
            framesPerBurst   = framesPerBurst,
            inputDeviceId    = usbInput?.id ?: 0,
            inputProductName = usbInput?.productName?.toString(),
            inputNativeRates = nativeRates,
        )
    }

    fun setEffectEnabled(effect: AudioEffect, enabled: Boolean) =
        nativeSetEffectEnabled(effect.ordinal, enabled)

    // ── JNI entry points ──────────────────────────────────────────────────────

    external fun nativeInit(sampleRate: Int, framesPerBurst: Int, inputDeviceId: Int): Boolean
    external fun nativeStop()
    external fun nativeDestroy()
    external fun nativeIsRunning(): Boolean
    external fun nativeSetGain(gain: Float)
    external fun nativeSetEffectEnabled(effectId: Int, enabled: Boolean)
    external fun nativeGetDiagInfo(): String
    external fun nativeGetActualSampleRate(): Int
    external fun nativeSetBypass(on: Boolean)
    external fun nativeSetDelayParam    (param: Int, value: Float)
    external fun nativeSetReverbParam   (param: Int, value: Float)
    external fun nativeSetOverdriveParam(param: Int, value: Float)
    external fun nativeSetWahParam      (param: Int, value: Float)

    // Parameter IDs — must match DspProcessor enums
    const val DELAY_TIME_MS  = 0
    const val DELAY_FEEDBACK = 1
    const val DELAY_WET      = 2

    const val REVERB_ROOM    = 0
    const val REVERB_MIX     = 1

    const val OD_DRIVE       = 0
    const val OD_TONE        = 1

    const val WAH_SPEED      = 0
    const val WAH_RES        = 1

    // NAM — LSTM architecture
    external fun nativeLoadNamLstm(numLayers: Int, inputSize: Int, hiddenSize: Int,
                                   weights: FloatArray): Boolean
    // NAM — WaveNet A2 compact format
    external fun nativeLoadNamWaveNet(channels: Int,
                                      kernelSizes: IntArray, dilations: IntArray,
                                      headKernelSize: Int,
                                      weights: FloatArray): Boolean
    // NAM — WaveNet standard multi-group format (NeuralAmpModelerCore)
    external fun nativeLoadNamWaveNetGroups(
        numGroups: Int,
        groupChannels: IntArray,
        groupKernelSizes: IntArray,
        groupHeadSizes: IntArray,
        groupHeadBias: IntArray,     // 0/1 per group
        dilationCounts: IntArray,    // number of layers per group
        flatDilations: IntArray,     // all dilations concatenated
        headScale: Float,
        weights: FloatArray
    ): Boolean
    external fun nativeUnloadNam()

    // Raw diagnostic engine (keep for debugging, not shown in production UI)
    external fun nativeInitRaw(sampleRate: Int, framesPerBurst: Int, inputDeviceId: Int): Boolean
    external fun nativeStopRaw()
    external fun nativeIsRawRunning(): Boolean
}
