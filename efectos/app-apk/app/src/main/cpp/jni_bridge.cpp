#include <jni.h>
#include "AudioEngine.h"
#include "AudioEngineRaw.h"

static AudioEngine*    gEngine    = nullptr;
static AudioEngineRaw* gEngineRaw = nullptr;

extern "C" {

JNIEXPORT jboolean JNICALL
Java_com_guitareffects_audio_JniAudioEngine_nativeInit(
    JNIEnv*, jobject, jint sampleRate, jint framesPerBurst, jint inputDeviceId) {
    // Reuse existing engine (preserves any loaded NAM model); create if first call.
    if (!gEngine) gEngine = new AudioEngine();
    else gEngine->stop();
    return gEngine->start(sampleRate, framesPerBurst, inputDeviceId) ? JNI_TRUE : JNI_FALSE;
}

JNIEXPORT void JNICALL
Java_com_guitareffects_audio_JniAudioEngine_nativeStop(JNIEnv*, jobject) {
    if (gEngine) gEngine->stop();
}

JNIEXPORT void JNICALL
Java_com_guitareffects_audio_JniAudioEngine_nativeDestroy(JNIEnv*, jobject) {
    delete gEngine;
    gEngine = nullptr;
}

JNIEXPORT jboolean JNICALL
Java_com_guitareffects_audio_JniAudioEngine_nativeIsRunning(JNIEnv*, jobject) {
    return (gEngine && gEngine->isRunning()) ? JNI_TRUE : JNI_FALSE;
}

JNIEXPORT void JNICALL
Java_com_guitareffects_audio_JniAudioEngine_nativeSetGain(JNIEnv*, jobject, jfloat gain) {
    if (gEngine) gEngine->setGain(gain);
}

JNIEXPORT void JNICALL
Java_com_guitareffects_audio_JniAudioEngine_nativeSetEffectEnabled(
    JNIEnv*, jobject, jint effectId, jboolean enabled) {
    if (gEngine) gEngine->setEffectEnabled(effectId, enabled == JNI_TRUE);
}

JNIEXPORT void JNICALL
Java_com_guitareffects_audio_JniAudioEngine_nativeSetBypass(
    JNIEnv*, jobject, jboolean on) {
    if (gEngine) gEngine->setBypass(on == JNI_TRUE);
}

JNIEXPORT void JNICALL
Java_com_guitareffects_audio_JniAudioEngine_nativeSetDelayParam(
    JNIEnv*, jobject, jint param, jfloat value) {
    if (gEngine) gEngine->setDelayParam(param, value);
}

JNIEXPORT void JNICALL
Java_com_guitareffects_audio_JniAudioEngine_nativeSetReverbParam(
    JNIEnv*, jobject, jint param, jfloat value) {
    if (gEngine) gEngine->setReverbParam(param, value);
}

JNIEXPORT void JNICALL
Java_com_guitareffects_audio_JniAudioEngine_nativeSetOverdriveParam(
    JNIEnv*, jobject, jint param, jfloat value) {
    if (gEngine) gEngine->setOverdriveParam(param, value);
}

JNIEXPORT void JNICALL
Java_com_guitareffects_audio_JniAudioEngine_nativeSetWahParam(
    JNIEnv*, jobject, jint param, jfloat value) {
    if (gEngine) gEngine->setWahParam(param, value);
}

JNIEXPORT jstring JNICALL
Java_com_guitareffects_audio_JniAudioEngine_nativeGetDiagInfo(JNIEnv* env, jobject) {
    if (!gEngine) return env->NewStringUTF("—");
    auto d = gEngine->getDiagSnapshot();
    gEngine->resetDiag();
    char buf[256];
    // measuredInputRate = 0 while the 5-second calibration window is running.
    if (d.measuredInputRate > 0.0f) {
        snprintf(buf, sizeof(buf),
                 "%dHz/%d inHz=%.0f peak=%.2f miss=%d drops=%d resyncs=%d ring=%d drift=%+.0fppm xrun i=%d o=%d",
                 d.sampleRate, d.framesPerBurst, d.measuredInputRate,
                 d.peak, d.missed, d.inputDrops, d.resyncs,
                 d.ringFill, d.driftPpm,
                 d.xrunIn, d.xrunOut);
    } else {
        snprintf(buf, sizeof(buf),
                 "%dHz/%d inHz=--- peak=%.2f miss=%d drops=%d resyncs=%d ring=%d drift=%+.0fppm xrun i=%d o=%d",
                 d.sampleRate, d.framesPerBurst,
                 d.peak, d.missed, d.inputDrops, d.resyncs,
                 d.ringFill, d.driftPpm,
                 d.xrunIn, d.xrunOut);
    }
    return env->NewStringUTF(buf);
}

JNIEXPORT jint JNICALL
Java_com_guitareffects_audio_JniAudioEngine_nativeGetActualSampleRate(JNIEnv*, jobject) {
    if (!gEngine) return 0;
    return gEngine->getDiagSnapshot().sampleRate;
}

// ── NAM (Neural Amp Modeler) ───────────────────────────────────────────────────

JNIEXPORT jboolean JNICALL
Java_com_guitareffects_audio_JniAudioEngine_nativeLoadNamLstm(
    JNIEnv* env, jobject,
    jint numLayers, jint inputSize, jint hiddenSize, jfloatArray weightsArray) {
    if (!gEngine) gEngine = new AudioEngine();
    jsize len   = env->GetArrayLength(weightsArray);
    jfloat* raw = env->GetFloatArrayElements(weightsArray, nullptr);
    bool ok = gEngine->loadNamLstm((int)numLayers, (int)inputSize, (int)hiddenSize, raw, (int)len);
    env->ReleaseFloatArrayElements(weightsArray, raw, JNI_ABORT);
    return ok ? JNI_TRUE : JNI_FALSE;
}

JNIEXPORT jboolean JNICALL
Java_com_guitareffects_audio_JniAudioEngine_nativeLoadNamWaveNet(
    JNIEnv* env, jobject,
    jint channels,
    jintArray kernelSizesArray, jintArray dilationsArray,
    jint headKernelSize,
    jfloatArray weightsArray) {
    if (!gEngine) gEngine = new AudioEngine();
    jsize numLayers = env->GetArrayLength(kernelSizesArray);
    jint*  ks  = env->GetIntArrayElements(kernelSizesArray, nullptr);
    jint*  ds  = env->GetIntArrayElements(dilationsArray,   nullptr);
    jsize  wLen = env->GetArrayLength(weightsArray);
    jfloat* raw = env->GetFloatArrayElements(weightsArray, nullptr);
    bool ok = gEngine->loadNamWaveNet((int)channels,
                                      ks, ds, (int)numLayers, (int)headKernelSize,
                                      raw, (int)wLen);
    env->ReleaseIntArrayElements(kernelSizesArray, ks, JNI_ABORT);
    env->ReleaseIntArrayElements(dilationsArray,   ds, JNI_ABORT);
    env->ReleaseFloatArrayElements(weightsArray,   raw, JNI_ABORT);
    return ok ? JNI_TRUE : JNI_FALSE;
}

JNIEXPORT jboolean JNICALL
Java_com_guitareffects_audio_JniAudioEngine_nativeLoadNamWaveNetGroups(
    JNIEnv* env, jobject,
    jint numGroups,
    jintArray groupChannelsArr, jintArray groupKernelSizesArr,
    jintArray groupHeadSizesArr, jintArray groupHeadBiasArr,
    jintArray dilationCountsArr, jintArray flatDilationsArr,
    jfloat headScale, jfloatArray weightsArr) {
    if (!gEngine) gEngine = new AudioEngine();
    jint* gC  = env->GetIntArrayElements(groupChannelsArr,     nullptr);
    jint* gK  = env->GetIntArrayElements(groupKernelSizesArr,  nullptr);
    jint* gHS = env->GetIntArrayElements(groupHeadSizesArr,    nullptr);
    jint* gHB = env->GetIntArrayElements(groupHeadBiasArr,     nullptr);
    jint* dC  = env->GetIntArrayElements(dilationCountsArr,    nullptr);
    jint* dF  = env->GetIntArrayElements(flatDilationsArr,     nullptr);
    jsize wLen = env->GetArrayLength(weightsArr);
    jfloat* raw = env->GetFloatArrayElements(weightsArr, nullptr);

    bool ok = gEngine->loadNamWaveNetGroups(
        (int)numGroups, gC, gK, gHS, gHB, dC, dF, headScale, raw, (int)wLen);

    env->ReleaseIntArrayElements(groupChannelsArr,    gC,  JNI_ABORT);
    env->ReleaseIntArrayElements(groupKernelSizesArr, gK,  JNI_ABORT);
    env->ReleaseIntArrayElements(groupHeadSizesArr,   gHS, JNI_ABORT);
    env->ReleaseIntArrayElements(groupHeadBiasArr,    gHB, JNI_ABORT);
    env->ReleaseIntArrayElements(dilationCountsArr,   dC,  JNI_ABORT);
    env->ReleaseIntArrayElements(flatDilationsArr,    dF,  JNI_ABORT);
    env->ReleaseFloatArrayElements(weightsArr,        raw, JNI_ABORT);
    return ok ? JNI_TRUE : JNI_FALSE;
}

JNIEXPORT void JNICALL
Java_com_guitareffects_audio_JniAudioEngine_nativeUnloadNam(JNIEnv*, jobject) {
    if (gEngine) gEngine->unloadNam();
}

// ── Raw diagnostic engine ──────────────────────────────────────────────────────

JNIEXPORT jboolean JNICALL
Java_com_guitareffects_audio_JniAudioEngine_nativeInitRaw(
    JNIEnv*, jobject, jint sampleRate, jint framesPerBurst, jint inputDeviceId) {
    delete gEngineRaw;
    gEngineRaw = new AudioEngineRaw();
    return gEngineRaw->start(sampleRate, framesPerBurst, inputDeviceId) ? JNI_TRUE : JNI_FALSE;
}

JNIEXPORT void JNICALL
Java_com_guitareffects_audio_JniAudioEngine_nativeStopRaw(JNIEnv*, jobject) {
    if (gEngineRaw) { gEngineRaw->stop(); delete gEngineRaw; gEngineRaw = nullptr; }
}

JNIEXPORT jboolean JNICALL
Java_com_guitareffects_audio_JniAudioEngine_nativeIsRawRunning(JNIEnv*, jobject) {
    return (gEngineRaw && gEngineRaw->isRunning()) ? JNI_TRUE : JNI_FALSE;
}

} // extern "C"
