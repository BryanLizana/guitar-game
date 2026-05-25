#include "AudioEngineRaw.h"
#include <android/log.h>

#define TAG  "GuitarRaw"
#define LOGI(...) __android_log_print(ANDROID_LOG_INFO,  TAG, __VA_ARGS__)
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, TAG, __VA_ARGS__)

bool AudioEngineRaw::start(int32_t sampleRate, int32_t framesPerBurst, int32_t inputDeviceId) {
    outputCb_.engine = this;

    // Output: same as the full engine (low-latency exclusive AAudio).
    oboe::AudioStreamBuilder outB;
    outB.setDirection(oboe::Direction::Output);
    outB.setPerformanceMode(oboe::PerformanceMode::LowLatency);
    outB.setSharingMode(oboe::SharingMode::Exclusive);
    outB.setFormat(oboe::AudioFormat::Float);
    outB.setChannelCount(oboe::ChannelCount::Mono);
    outB.setSampleRate(sampleRate);
    outB.setFramesPerDataCallback(framesPerBurst);
    outB.setAudioApi(oboe::AudioApi::AAudio);
    outB.setDataCallback(&outputCb_);
    outB.setErrorCallback(this);

    auto r = outB.openStream(outputStream_);
    if (r != oboe::Result::OK) {
        outB.setSharingMode(oboe::SharingMode::Shared);
        r = outB.openStream(outputStream_);
    }
    if (r != oboe::Result::OK) { LOGE("RAW: output open failed"); return false; }

    int32_t outSR    = outputStream_->getSampleRate();
    int32_t outBurst = outputStream_->getFramesPerBurst();
    LOGI("RAW output: sr=%d burst=%d", outSR, outBurst);

    // Input: mimic AudioRecord — PerformanceMode::None goes through the standard
    // AudioFlinger path (no MMAP), AudioApi::Unspecified lets Oboe pick the best
    // available API, InputPreset::Generic applies no voice processing.
    // Try native rate first (44100 Hz for most USB interfaces), then output rate.
    static constexpr int32_t kRates[] = { 44100, 48000, 0 };  // 0 = same as output
    r = oboe::Result::ErrorUnimplemented;

    for (int32_t rate : kRates) {
        int32_t tryRate = (rate == 0) ? outSR : rate;
        oboe::AudioStreamBuilder inB;
        inB.setDirection(oboe::Direction::Input);
        inB.setPerformanceMode(oboe::PerformanceMode::None);   // standard AudioFlinger path
        inB.setSharingMode(oboe::SharingMode::Shared);
        inB.setFormat(oboe::AudioFormat::Float);
        inB.setChannelCount(oboe::ChannelCount::Mono);
        inB.setSampleRate(tryRate);
        inB.setInputPreset(oboe::InputPreset::Generic);        // no voice processing
        inB.setAudioApi(oboe::AudioApi::Unspecified);          // let Oboe/Android choose
        // No data callback → pull mode via blocking read()
        if (inputDeviceId > 0) inB.setDeviceId(inputDeviceId);

        r = inB.openStream(inputStream_);
        if (r == oboe::Result::OK) {
            LOGI("RAW input: sr=%d (requested %d) burst=%d devId=%d api=%s",
                 inputStream_->getSampleRate(), tryRate,
                 inputStream_->getFramesPerBurst(),
                 inputStream_->getDeviceId(),
                 oboe::convertToText(inputStream_->getAudioApi()));
            break;
        }
        LOGI("RAW input at %d Hz failed: %s", tryRate, oboe::convertToText(r));
    }
    if (r != oboe::Result::OK) {
        outputStream_->close(); outputStream_.reset();
        LOGE("RAW: input open failed"); return false;
    }

    // Large buffer to absorb the jitter inherent in the mixed AudioFlinger path.
    inputStream_->setBufferSizeInFrames(inputStream_->getFramesPerBurst() * 8);
    scratch_.assign(static_cast<size_t>(outBurst) * 2, 0.0f);

    inputStream_->requestStart();
    outputStream_->requestStart();
    running_.store(true);
    LOGI("RAW engine running — inSR=%d outSR=%d inAPI=%s",
         inputStream_->getSampleRate(), outSR,
         oboe::convertToText(inputStream_->getAudioApi()));
    return true;
}

void AudioEngineRaw::stop() {
    running_.store(false);
    if (inputStream_)  { inputStream_->requestStop();  inputStream_->close();  inputStream_.reset(); }
    if (outputStream_) { outputStream_->requestStop(); outputStream_->close(); outputStream_.reset(); }
}

oboe::DataCallbackResult AudioEngineRaw::onOutputReady(void* data, int32_t frames) {
    auto* out = static_cast<float*>(data);

    // Blocking read with a 2-callback-period timeout (allows for scheduler jitter
    // without hanging the output callback indefinitely).
    // At 48000/192 Hz one callback = ~4ms, so 8ms covers normal jitter.
    constexpr int64_t kTimeoutNs = 8 * 1000 * 1000LL; // 8 ms
    auto result = inputStream_->read(scratch_.data(), frames, kTimeoutNs);
    int32_t got = (result) ? result.value() : 0;

    for (int32_t i = 0; i < frames; ++i)
        out[i] = (i < got) ? scratch_[i] : 0.0f;

    return oboe::DataCallbackResult::Continue;
}

void AudioEngineRaw::onErrorAfterClose(oboe::AudioStream*, oboe::Result error) {
    LOGE("RAW stream error: %s", oboe::convertToText(error));
    running_.store(false);
}
