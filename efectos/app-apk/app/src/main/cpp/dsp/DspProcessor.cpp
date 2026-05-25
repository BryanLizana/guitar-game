#include "DspProcessor.h"
#include <cmath>

DspProcessor::DspProcessor(float sampleRate)
    : gate_     (sampleRate)
    , overdrive_(sampleRate)
    , wah_      (sampleRate)
    , reverb_   (sampleRate)
    , delay_    (sampleRate)
{}

float DspProcessor::process(float input, float gain) noexcept {
    // 1. DC blocker — IIR HP ~20 Hz, removes interface DC offset
    float dcOut = input - dcX1_ + 0.9975f * dcY1_;
    dcX1_ = input;
    dcY1_ = dcOut;

    // 2. Noise gate — silences signal below threshold, kills USB/mic noise floor
    float gated = gate_.process(dcOut);

    // 3. Linear gain
    float s = gated * gain;

    // 4. Amp stage — NAM model (if loaded+enabled) or classic tanh+overdrive
    if (namOn_.load(std::memory_order_relaxed)) {
        // try_lock: if load is in progress we skip NAM for this frame (inaudible)
        if (namMutex_.try_lock()) {
            if (nam_ && nam_->isLoaded()) s = nam_->process(s);
            namMutex_.unlock();
        }
    } else if (overdriveOn_.load(std::memory_order_relaxed)) {
        s = overdrive_.process(s);
    }

    // 5. Modulation / time effects
    if (wahOn_  .load(std::memory_order_relaxed)) s = wah_  .process(s);
    if (reverbOn_.load(std::memory_order_relaxed)) s = reverb_.process(s);
    if (delayOn_ .load(std::memory_order_relaxed)) s = delay_ .process(s);

    // 6. Output safety limiter
    s = tanhf(s);

    // 7. Post anti-alias LP ~10 kHz
    float smooth = s * (1.0f - kLpAlpha) + lpPrev_ * kLpAlpha;
    lpPrev_ = smooth;

    return smooth;
}

void DspProcessor::setDelayParam(int param, float value) noexcept {
    switch (param) {
        case DELAY_TIME_MS:  delay_.setTimeMs(value);   break;
        case DELAY_FEEDBACK: delay_.setFeedback(value); break;
        case DELAY_WET:      delay_.setWet(value);      break;
    }
}

void DspProcessor::setReverbParam(int param, float value) noexcept {
    switch (param) {
        case REVERB_ROOM: reverb_.setRoomSize(value); break;
        case REVERB_MIX:  reverb_.setWet(value);      break;
    }
}

void DspProcessor::setOverdriveParam(int param, float value) noexcept {
    switch (param) {
        case OD_DRIVE: overdrive_.setDrive(value); break;
        case OD_TONE:  overdrive_.setTone(value);  break;
    }
}

void DspProcessor::setWahParam(int param, float value) noexcept {
    switch (param) {
        case WAH_SPEED: wah_.setSpeed(value);     break;
        case WAH_RES:   wah_.setResonance(value); break;
    }
}

void DspProcessor::setEffectEnabled(int id, bool on) noexcept {
    switch (id) {
        case FX_REVERB:    reverbOn_   .store(on, std::memory_order_relaxed); break;
        case FX_DELAY:     delayOn_    .store(on, std::memory_order_relaxed); break;
        case FX_OVERDRIVE: overdriveOn_.store(on, std::memory_order_relaxed); break;
        case FX_WAH:       wahOn_      .store(on, std::memory_order_relaxed); break;
        case FX_NAM:       namOn_      .store(on, std::memory_order_relaxed); break;
    }
}

bool DspProcessor::loadNamLstm(int numLayers, int inputSize, int hiddenSize,
                               const float* weights, int weightCount) {
    auto p = std::make_unique<NamProcessor>();
    if (!p->loadLstm(numLayers, inputSize, hiddenSize, weights, weightCount)) return false;
    std::lock_guard<std::mutex> lk(namMutex_);
    nam_ = std::move(p);
    return true;
}

bool DspProcessor::loadNamWaveNet(int channels,
                                  const int* kernelSizes, const int* dilations, int numLayers,
                                  int headKernelSize,
                                  const float* weights, int weightCount) {
    auto p = std::make_unique<NamProcessor>();
    if (!p->loadWaveNet(channels, kernelSizes, dilations, numLayers, headKernelSize,
                        weights, weightCount)) return false;
    std::lock_guard<std::mutex> lk(namMutex_);
    nam_ = std::move(p);
    return true;
}

bool DspProcessor::loadNamWaveNetGroups(int numGroups,
                                        const int* groupChannels,
                                        const int* groupKernelSizes,
                                        const int* groupHeadSizes,
                                        const int* groupHeadBias,
                                        const int* dilationCounts,
                                        const int* flatDilations,
                                        float headScale,
                                        const float* weights, int weightCount) {
    auto p = std::make_unique<NamProcessor>();
    if (!p->loadWaveNetGroups(numGroups, groupChannels, groupKernelSizes, groupHeadSizes,
                              groupHeadBias, dilationCounts, flatDilations,
                              headScale, weights, weightCount)) return false;
    std::lock_guard<std::mutex> lk(namMutex_);
    nam_ = std::move(p);
    return true;
}

void DspProcessor::unloadNam() {
    std::lock_guard<std::mutex> lk(namMutex_);
    nam_.reset();
}
