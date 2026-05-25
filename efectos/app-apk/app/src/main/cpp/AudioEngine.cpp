#include "AudioEngine.h"
#include "dsp/DspProcessor.cpp"
#include <android/log.h>
#include <algorithm>

#define TAG  "GuitarEngine"
#define LOGI(...) __android_log_print(ANDROID_LOG_INFO,  TAG, __VA_ARGS__)
#define LOGW(...) __android_log_print(ANDROID_LOG_WARN,  TAG, __VA_ARGS__)
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, TAG, __VA_ARGS__)

// Maximum deviation of the adaptive resampler from baseStep_. 2 % is enough
// for residual crystal drift after baseStep_ has been auto-calibrated from the
// measured physical input rate; keeps pitch artifacts inaudible.
static constexpr double kMaxDrift = 0.02;
// PI gains for the ring-fill controller. Sized so a normalised fill error of
// 1.0 (ring fully empty or full vs target) produces ~1 % step shift — fast
// enough to converge in well under a second, slow enough to be inaudible.
static constexpr double kP = 8.0e-4;
static constexpr double kI = 2.0e-5;  // 10× faster integral — corrects systematic baseStep_ bias in ~15s

AudioEngine::AudioEngine()
    : dsp_(std::make_unique<DspProcessor>(48000.0f)) {}
AudioEngine::~AudioEngine() { stop(); }

bool AudioEngine::start(int32_t preferredSampleRate,
                        int32_t preferredFramesPerBurst,
                        int32_t inputDeviceId) {
    inputDeviceId_ = inputDeviceId;
    return openStreams(preferredSampleRate, preferredFramesPerBurst, inputDeviceId);
}

void AudioEngine::stop() {
    running_.store(false);
    closeStreams();
    // dsp_ kept alive so any loaded NAM model survives stop/start cycles.
}

void AudioEngine::setEffectEnabled(int id, bool on) {
    if (dsp_) dsp_->setEffectEnabled(id, on);
}

AudioEngine::DiagSnapshot AudioEngine::getDiagSnapshot() const {
    auto xIn  = inputStream_  ? inputStream_ ->getXRunCount() : oboe::ResultWithValue<int32_t>(0);
    auto xOut = outputStream_ ? outputStream_->getXRunCount() : oboe::ResultWithValue<int32_t>(0);
    return {
        diagPeak_             .load(std::memory_order_relaxed),
        diagMissed_           .load(std::memory_order_relaxed),
        xIn  ? xIn .value() : 0,
        xOut ? xOut.value() : 0,
        sampleRate_,
        framesPerBurst_,
        inputDeviceId_,
        diagRingFill_         .load(std::memory_order_relaxed),
        diagDrift_            .load(std::memory_order_relaxed),
        diagResyncs_          .load(std::memory_order_relaxed),
        diagInputDrops_       .load(std::memory_order_relaxed),
        diagMeasuredInputRate_.load(std::memory_order_relaxed),
    };
}

// ── Stream management ─────────────────────────────────────────────────────────

bool AudioEngine::openStreams(int32_t preferredSampleRate,
                              int32_t preferredFramesPerBurst,
                              int32_t inputDeviceId) {
    closeStreams();

    // 1. Open the INPUT using the standard AudioFlinger path (PerformanceMode::None),
    //    same as AudioRecord. LowLatency/MMAP is unreliable with USB class-compliant
    //    interfaces on Android. We request the output rate first so AudioFlinger does
    //    the USB→48kHz SRC at its quality, eliminating baseStep_ drift entirely.
    //    InputPreset::Generic = AudioRecord default: keeps Android noise suppression.
    oboe::Result r = oboe::Result::ErrorUnimplemented;
    const int32_t kRateCascade[] = { preferredSampleRate, 44100, 48000, 96000, 0 };

    for (int32_t rate : kRateCascade) {
        oboe::AudioStreamBuilder inBuilder;
        inBuilder.setDirection(oboe::Direction::Input);
        inBuilder.setPerformanceMode(oboe::PerformanceMode::None);
        inBuilder.setSharingMode(oboe::SharingMode::Shared);
        inBuilder.setFormat(oboe::AudioFormat::Float);
        inBuilder.setChannelCount(oboe::ChannelCount::Mono);
        inBuilder.setInputPreset(oboe::InputPreset::Generic);
        inBuilder.setAudioApi(oboe::AudioApi::Unspecified);
        inBuilder.setDataCallback(this);
        inBuilder.setErrorCallback(this);
        if (inputDeviceId > 0) inBuilder.setDeviceId(inputDeviceId);
        if (rate > 0) inBuilder.setSampleRate(rate);

        r = inBuilder.openStream(inputStream_);
        if (r == oboe::Result::OK) {
            LOGI("Input opened at requested rate=%d → actual rate=%d api=%s",
                 rate, inputStream_->getSampleRate(),
                 oboe::convertToText(inputStream_->getAudioApi()));
            break;
        }
        LOGW("Input open at rate=%d failed: %s", rate, oboe::convertToText(r));
    }

    // Last resort: Generic preset, no device constraint.
    if (r != oboe::Result::OK) {
        oboe::AudioStreamBuilder inBuilder;
        inBuilder.setDirection(oboe::Direction::Input);
        inBuilder.setPerformanceMode(oboe::PerformanceMode::None);
        inBuilder.setSharingMode(oboe::SharingMode::Shared);
        inBuilder.setFormat(oboe::AudioFormat::Float);
        inBuilder.setChannelCount(oboe::ChannelCount::Mono);
        inBuilder.setInputPreset(oboe::InputPreset::Generic);
        inBuilder.setAudioApi(oboe::AudioApi::Unspecified);
        inBuilder.setDataCallback(this);
        inBuilder.setErrorCallback(this);
        r = inBuilder.openStream(inputStream_);
    }
    if (r != oboe::Result::OK) {
        LOGE("Input open failed (all rates exhausted): %s", oboe::convertToText(r));
        return false;
    }

    int32_t inSampleRate  = inputStream_->getSampleRate();
    int32_t inFramesPerCb = inputStream_->getFramesPerBurst();
    int32_t inChannels    = inputStream_->getChannelCount();
    int32_t inDeviceId    = inputStream_->getDeviceId();
    LOGI("Input : sr=%d burst=%d ch=%d devId=%d api=%s sharing=%s fmt=%s preset=%d",
         inSampleRate, inFramesPerCb, inChannels, inDeviceId,
         oboe::convertToText(inputStream_->getAudioApi()),
         oboe::convertToText(inputStream_->getSharingMode()),
         oboe::convertToText(inputStream_->getFormat()),
         static_cast<int>(inputStream_->getInputPreset()));

    // 2. Open the OUTPUT at the Android-preferred rate. The DAC mixer
    //    handles SRC for any media stream — that path is well tested.
    oboe::AudioStreamBuilder outBuilder;
    outBuilder.setDirection(oboe::Direction::Output);
    outBuilder.setPerformanceMode(oboe::PerformanceMode::LowLatency);
    outBuilder.setSharingMode(oboe::SharingMode::Exclusive);
    outBuilder.setFormat(oboe::AudioFormat::Float);
    outBuilder.setChannelCount(oboe::ChannelCount::Mono);
    outBuilder.setSampleRate(preferredSampleRate);
    outBuilder.setSampleRateConversionQuality(oboe::SampleRateConversionQuality::Medium);
    outBuilder.setFramesPerDataCallback(preferredFramesPerBurst);
    outBuilder.setAudioApi(oboe::AudioApi::AAudio);
    outBuilder.setUsage(oboe::Usage::Media);
    outBuilder.setContentType(oboe::ContentType::Music);
    outBuilder.setDataCallback(this);
    outBuilder.setErrorCallback(this);

    r = outBuilder.openStream(outputStream_);
    if (r != oboe::Result::OK) {
        outBuilder.setSharingMode(oboe::SharingMode::Shared);
        r = outBuilder.openStream(outputStream_);
    }
    if (r != oboe::Result::OK) {
        outBuilder.setAudioApi(oboe::AudioApi::Unspecified);
        r = outBuilder.openStream(outputStream_);
    }
    if (r != oboe::Result::OK) {
        LOGE("Output open failed: %s", oboe::convertToText(r));
        inputStream_->close();
        inputStream_.reset();
        return false;
    }

    int32_t outSampleRate  = outputStream_->getSampleRate();
    int32_t outFramesPerCb = outputStream_->getFramesPerBurst();
    int32_t outChannels    = outputStream_->getChannelCount();
    int32_t outDeviceId    = outputStream_->getDeviceId();
    LOGI("Output: sr=%d burst=%d ch=%d devId=%d api=%s sharing=%s fmt=%s",
         outSampleRate, outFramesPerCb, outChannels, outDeviceId,
         oboe::convertToText(outputStream_->getAudioApi()),
         oboe::convertToText(outputStream_->getSharingMode()),
         oboe::convertToText(outputStream_->getFormat()));

    if (inSampleRate != outSampleRate) {
        LOGI("Cross-rate operation: input=%d Hz, output=%d Hz — explicit resampling enabled (ratio=%.4f)",
             inSampleRate, outSampleRate,
             (double)inSampleRate / (double)outSampleRate);
    }

    // 3. Allocate DSP, ring buffer, scratch — target ~4 bursts of latency.
    sampleRate_       = outSampleRate;
    framesPerBurst_   = outFramesPerCb;
    inputChannels_    = inChannels;
    inputDeviceId_    = inDeviceId;
    // Target ≈ 8 bursts of latency — leaves room for scheduling jitter
    // between the input and output callback threads without the resampler
    // having to fight it. At 256 frames/48 kHz that is ~43 ms.
    ringTargetFrames_ = outFramesPerCb * 12;  // 48ms @ 192/48kHz — more headroom for USB jitter

    if (!dsp_) dsp_ = std::make_unique<DspProcessor>(static_cast<float>(outSampleRate));
    // Ring capacity = 32× burst — ample headroom above target so the
    // producer never wraps into the consumer on a bursty input device.
    size_t ringCap = static_cast<size_t>(outFramesPerCb) * 32 + 1;
    ring_.resize(ringCap);
    inputScratch_.assign(static_cast<size_t>(inFramesPerCb) *
                         static_cast<size_t>(std::max(1, inChannels)), 0.0f);
    outputScratch_.assign(static_cast<size_t>(outFramesPerCb), 0.0f);

    // Base resampling ratio: read `baseStep_` input frames per output frame.
    // PI controller adds at most ±kMaxDrift on top of this (residual ppm drift).
    baseStep_   = static_cast<double>(inSampleRate) /
                  static_cast<double>(outSampleRate);
    readPos_    = 0.0;
    resampStep_ = baseStep_;
    driftAccum_ = 0.0;
    lastSample_ = 0.0f;
    diagPeak_   .store(0.0f, std::memory_order_relaxed);
    diagMissed_ .store(0,    std::memory_order_relaxed);
    diagRingFill_.store(0,   std::memory_order_relaxed);
    diagDrift_  .store(0.0f, std::memory_order_relaxed);

    // 4. Pre-fill ring with silence so the output never sees an empty ring
    //    on the first callback (the source of the initial miss=400).
    ring_.writeSilence(static_cast<size_t>(ringTargetFrames_));

    // Input runs Shared mode → bigger buffer needed to absorb scheduling
    // jitter from AudioFlinger without losing frames during scene loads etc.
    outputStream_->setBufferSizeInFrames(outFramesPerCb * 2);
    inputStream_ ->setBufferSizeInFrames(inFramesPerCb * 4);

    diagResyncs_   .store(0, std::memory_order_relaxed);
    diagInputDrops_.store(0, std::memory_order_relaxed);
    lowFillStreak_     = 0;
    crossfadeLen_      = outFramesPerCb * 2;   // ~ 2 bursts (~11 ms @ 256/48k)
    crossfadeRemaining_= 0;
    crossfadeFrom_     = 0.0f;

    // Reset rate calibration — fresh measurement on every start().
    rateCalibStartNs_    .store(0,     std::memory_order_relaxed);
    rateCalibFrames_     .store(0,     std::memory_order_relaxed);
    diagMeasuredInputRate_.store(0.0f, std::memory_order_relaxed);
    rateCalibDone_       .store(false, std::memory_order_relaxed);
    baseStepCorrected_   = false;

    // 5. Start INPUT first so it begins producing immediately, then OUTPUT.
    if (inputStream_->requestStart() != oboe::Result::OK) {
        LOGE("Input requestStart failed");
        closeStreams();
        return false;
    }
    if (outputStream_->requestStart() != oboe::Result::OK) {
        LOGE("Output requestStart failed");
        closeStreams();
        return false;
    }

    running_.store(true);
    LOGI("Engine running: %dHz / %d frames | ring target=%d cap=%zu",
         sampleRate_, framesPerBurst_, ringTargetFrames_, ringCap);
    return true;
}

void AudioEngine::closeStreams() {
    if (inputStream_) {
        inputStream_->requestStop();
        inputStream_->close();
        inputStream_.reset();
    }
    if (outputStream_) {
        outputStream_->requestStop();
        outputStream_->close();
        outputStream_.reset();
    }
}

// ── Realtime callbacks ────────────────────────────────────────────────────────

oboe::DataCallbackResult AudioEngine::onAudioReady(
    oboe::AudioStream* stream, void* audioData, int32_t numFrames) {

    // ── INPUT: capture → mono → ring ─────────────────────────────────────────
    if (stream == inputStream_.get()) {
        auto* in = static_cast<const float*>(audioData);
        int32_t ch = inputChannels_;
        const float* mono = in;

        if (ch > 1) {
            if (inputScratch_.size() < static_cast<size_t>(numFrames))
                return oboe::DataCallbackResult::Continue;
            const float inv = 1.0f / static_cast<float>(ch);
            for (int32_t i = 0; i < numFrames; ++i) {
                float sum = 0.0f;
                for (int32_t c = 0; c < ch; ++c) sum += in[i * ch + c];
                inputScratch_[i] = sum * inv;
            }
            mono = inputScratch_.data();
        }

        // Track input peak (pre-DSP) for the UI VU meter.
        float localPeak = diagPeak_.load(std::memory_order_relaxed);
        for (int32_t i = 0; i < numFrames; ++i) {
            float a = fabsf(mono[i]);
            if (a > localPeak) localPeak = a;
        }
        diagPeak_.store(localPeak, std::memory_order_relaxed);

        // Physical rate measurement: count frames delivered over a 5-second
        // wall-clock window. The measured value may differ from getSampleRate()
        // when AAudio silently resamples the USB stream (common with iD4 on Android).
        if (!rateCalibDone_.load(std::memory_order_relaxed)) {
            using ns = std::chrono::nanoseconds;
            int64_t nowNs = std::chrono::duration_cast<ns>(
                std::chrono::steady_clock::now().time_since_epoch()).count();
            int64_t expected = 0;
            if (rateCalibStartNs_.compare_exchange_strong(
                    expected, nowNs,
                    std::memory_order_relaxed, std::memory_order_relaxed)) {
                // First callback: record start time, don't count frames yet
                // (first burst timing can be irregular at stream startup).
            } else {
                int64_t elapsed = nowNs - expected;
                int64_t total = rateCalibFrames_.fetch_add(
                    numFrames, std::memory_order_relaxed) + numFrames;
                constexpr int64_t kWindowNs = 5LL * 1'000'000'000LL;
                if (elapsed >= kWindowNs) {
                    float measured = static_cast<float>(total) /
                                     (static_cast<float>(elapsed) * 1.0e-9f);
                    diagMeasuredInputRate_.store(measured, std::memory_order_relaxed);
                    rateCalibDone_.store(true, std::memory_order_release);
                    int32_t reportedSr = inputStream_->getSampleRate();
                    LOGI("=== PHYSICAL RATE CALIBRATION ===");
                    LOGI("  Oboe/AAudio reports : %d Hz", reportedSr);
                    LOGI("  Measured (5s window): %.2f Hz", measured);
                    LOGI("  Delta               : %+.2f Hz (%+.0f ppm)",
                         measured - reportedSr,
                         (static_cast<double>(measured) / reportedSr - 1.0) * 1e6);
                    LOGI("  Current baseStep_   : %.6f", baseStep_);
                    LOGI("  Correct baseStep_   : %.6f",
                         static_cast<double>(measured) / sampleRate_);
                }
            }
        }

        size_t written = ring_.write(mono, static_cast<size_t>(numFrames));
        int32_t dropped = numFrames - static_cast<int32_t>(written);
        if (dropped > 0) {
            diagInputDrops_.fetch_add(dropped, std::memory_order_relaxed);
        }
        return oboe::DataCallbackResult::Continue;
    }

    // ── OUTPUT: adaptive resample → DSP → device ─────────────────────────────
    auto* out = static_cast<float*>(audioData);
    if (outputScratch_.size() < static_cast<size_t>(numFrames))
        outputScratch_.assign(static_cast<size_t>(numFrames), 0.0f);

    // 1. Update the adaptive step from current ring fill.
    //    fill > target → step > baseStep_ (read faster, drain the ring)
    //    fill < target → step < baseStep_ (read slower, let it grow)
    int32_t fill   = static_cast<int32_t>(ring_.size());

    // ── Auto-resync: if the ring sits critically low for several callbacks
    //    in a row (PI is saturated or the input lost frames), drop everything
    //    and pre-fill with silence. ~target/outSR seconds of "skip" instead
    //    of indefinitely garbled audio.
    if (fill < ringTargetFrames_ / 4) {
        lowFillStreak_++;
    } else if (fill > ringTargetFrames_ / 2) {
        lowFillStreak_ = 0;
    }

    // Overflow: ring too full → soft drain (discard oldest frames, no silence gap).
    // Causes a tiny skip (~same as a crossfade) but avoids the hard mute of a full resync.
    bool didResync = false;
    if (fill > static_cast<int32_t>(ring_.capacity() * 3 / 4)) {
        size_t excess = static_cast<size_t>(fill - ringTargetFrames_);
        ring_.advance(excess);
        readPos_    = 0.0;
        driftAccum_ = 0.0;
        lowFillStreak_ = 0;
        diagResyncs_.fetch_add(1, std::memory_order_relaxed);
        fill = ringTargetFrames_;
        crossfadeFrom_      = lastSample_;
        crossfadeRemaining_ = crossfadeLen_;
        LOGI("Soft drain: discarded %zu frames (ring overflow)", excess);
        didResync = true;
    }

    // Underflow: ring critically empty for many consecutive callbacks → hard resync.
    // Threshold 20 callbacks (~80ms at 192/48kHz) avoids false triggers from USB jitter.
    if (!didResync && lowFillStreak_ > 20) {
        ring_.clear();
        ring_.writeSilence(static_cast<size_t>(ringTargetFrames_));
        readPos_       = 0.0;
        driftAccum_    = 0.0;
        resampStep_    = baseStep_;
        lowFillStreak_ = 0;
        diagResyncs_.fetch_add(1, std::memory_order_relaxed);
        fill = ringTargetFrames_;
        crossfadeFrom_      = lastSample_;
        crossfadeRemaining_ = crossfadeLen_;
        didResync = true;
    }
    (void)didResync;

    // Once the 5-second rate measurement is ready, update baseStep_ from the
    // measured physical rate instead of getSampleRate() (which can be wrong for
    // USB devices like the Audient iD4 when AAudio does silent SRC).
    // Safe here: this is the only thread that reads/writes baseStep_.
    if (!baseStepCorrected_ && rateCalibDone_.load(std::memory_order_acquire)) {
        float measured = diagMeasuredInputRate_.load(std::memory_order_relaxed);
        double newBase = static_cast<double>(measured) / static_cast<double>(sampleRate_);
        double oldBase = baseStep_;
        double deltaPpm = (newBase - oldBase) * 1.0e6;
        if (std::abs(deltaPpm) > 100.0) {  // >100 ppm → worth correcting
            baseStep_    = newBase;
            resampStep_  = newBase;  // snap immediately — avoids slow exponential convergence
            driftAccum_  = 0.0;      // reset integral: old wind-up based on wrong ratio
            LOGI("baseStep_ corrected: %.6f → %.6f (%+.0f ppm) — step snapped, PI reset",
                 oldBase, newBase, deltaPpm);
        } else {
            LOGI("baseStep_ OK (delta=%.0f ppm < 100 ppm, no correction needed)", deltaPpm);
        }
        baseStepCorrected_ = true;
    }

    double  error  = (static_cast<double>(fill) - ringTargetFrames_) /
                     static_cast<double>(ringTargetFrames_);
    driftAccum_   += error;
    if (driftAccum_ >  1e5) driftAccum_ =  1e5;
    if (driftAccum_ < -1e5) driftAccum_ = -1e5;
    // ppm correction on top of the fixed physical-rate ratio.
    double ppm     = kP * error + kI * driftAccum_;
    if (ppm >  kMaxDrift) ppm =  kMaxDrift;
    if (ppm < -kMaxDrift) ppm = -kMaxDrift;
    // Emergency: ring critically low → force the slowest step until it recovers.
    if (fill < ringTargetFrames_ / 2) ppm = -kMaxDrift;
    double target  = baseStep_ * (1.0 + ppm);
    // Smooth the step itself to avoid sudden changes (low-pass on the control).
    resampStep_ = 0.8 * resampStep_ + 0.2 * target;

    // 2. Fractional linear-interp read from the ring, with crossfade if
    //    we just resynced (masks the discontinuity).
    int32_t underflow = 0;
    for (int32_t i = 0; i < numFrames; ++i) {
        size_t idx = static_cast<size_t>(readPos_);
        float  s0, s1;
        bool   ok0 = ring_.peekAt(idx,     s0);
        bool   ok1 = ring_.peekAt(idx + 1, s1);
        if (!ok0) { s0 = lastSample_; underflow++; }
        if (!ok1) { s1 = s0; }
        float frac = static_cast<float>(readPos_ - static_cast<double>(idx));
        float val  = s0 + (s1 - s0) * frac;
        if (crossfadeRemaining_ > 0 && crossfadeLen_ > 0) {
            float t = static_cast<float>(crossfadeRemaining_) /
                      static_cast<float>(crossfadeLen_);
            // t = 1.0 at the start of fade, 0.0 at the end → mostly old at
            // start, mostly new at end.
            val = crossfadeFrom_ * t + val * (1.0f - t);
            crossfadeRemaining_--;
        }
        outputScratch_[i] = val;
        lastSample_ = val;
        readPos_ += resampStep_;
    }

    // 3. Advance the ring tail by the integer part of readPos_; keep the fraction.
    size_t consumed = static_cast<size_t>(readPos_);
    ring_.advance(consumed);
    readPos_ -= static_cast<double>(consumed);

    if (underflow > 0) {
        diagMissed_.fetch_add(underflow, std::memory_order_relaxed);
    }
    diagRingFill_.store(fill, std::memory_order_relaxed);
    // Report drift as ppm deviation from the *physical* rate ratio so it
    // measures only the residual clock drift the PI is correcting for.
    float ppmReport = static_cast<float>(
        (resampStep_ / baseStep_ - 1.0) * 1.0e6);
    diagDrift_.store(ppmReport, std::memory_order_relaxed);

    // 4. DSP pass (skipped in bypass mode — raw resampled signal for diagnostics).
    if (bypass_.load(std::memory_order_relaxed)) {
        for (int32_t i = 0; i < numFrames; ++i) out[i] = outputScratch_[i];
    } else {
        float g    = gain_.load(std::memory_order_relaxed);
        auto* proc = dsp_.get();
        for (int32_t i = 0; i < numFrames; ++i) {
            out[i] = proc ? proc->process(outputScratch_[i], g) : 0.0f;
        }
    }
    return oboe::DataCallbackResult::Continue;
}

void AudioEngine::onErrorAfterClose(oboe::AudioStream* stream, oboe::Result error) {
    LOGE("Stream error on %s: %s",
         (stream && stream->getDirection() == oboe::Direction::Input) ? "input" : "output",
         oboe::convertToText(error));

    std::lock_guard<std::mutex> lock(restartMutex_);
    if (!running_.load()) return;

    int32_t sr    = sampleRate_;
    int32_t burst = framesPerBurst_;
    int32_t devId = inputDeviceId_;
    running_.store(false);
    closeStreams();
    openStreams(sr, burst, devId);
}
