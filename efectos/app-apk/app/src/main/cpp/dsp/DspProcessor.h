#pragma once
#include "Effects.h"
#include "NamProcessor.h"
#include "Oversampler.h"
#include <atomic>
#include <cmath>
#include <memory>
#include <mutex>

// Effect IDs — must match AudioEffect.ordinal() in Kotlin
enum EffectId { FX_REVERB = 0, FX_DELAY = 1, FX_OVERDRIVE = 2, FX_WAH = 3, FX_NAM = 4 };

// Full DSP pipeline for one audio sample (float, -1..1).
// All state is owned here; the Oboe callback is the only caller.
class DspProcessor {
public:
    explicit DspProcessor(float sampleRate);

    // Called from the realtime audio thread — must be lock-free.
    float process(float input, float gain) noexcept;

    // Called from the main thread — atomic flags, no locks needed.
    void setEffectEnabled(int id, bool on) noexcept;

    enum DelayParam    { DELAY_TIME_MS = 0, DELAY_FEEDBACK = 1, DELAY_WET  = 2 };
    enum ReverbParam   { REVERB_ROOM   = 0, REVERB_MIX     = 1 };
    enum OverdriveParam{ OD_DRIVE      = 0, OD_TONE        = 1 };
    enum WahParam      { WAH_SPEED     = 0, WAH_RES        = 1 };

    void setDelayParam    (int param, float value) noexcept;
    void setReverbParam   (int param, float value) noexcept;
    void setOverdriveParam(int param, float value) noexcept;
    void setWahParam      (int param, float value) noexcept;

    // NAM model management — called from the JNI / UI thread.
    // Constructs outside the lock, then swaps under a brief mutex.
    bool loadNamLstm(int numLayers, int inputSize, int hiddenSize,
                     const float* weights, int weightCount);
    bool loadNamWaveNet(int channels,
                        const int* kernelSizes, const int* dilations, int numLayers,
                        int headKernelSize,
                        const float* weights, int weightCount);
    bool loadNamWaveNetGroups(int numGroups,
                              const int* groupChannels,
                              const int* groupKernelSizes,
                              const int* groupHeadSizes,
                              const int* groupHeadBias,
                              const int* dilationCounts,
                              const int* flatDilations,
                              float headScale,
                              const float* weights, int weightCount);
    void unloadNam();

private:
    // DC blocker state (~20 Hz HP)
    float dcX1_ = 0.0f, dcY1_ = 0.0f;

    // Post-clip anti-alias LP (~10 kHz)
    float lpPrev_ = 0.0f;
    static constexpr float kLpAlpha = 0.27f;

    // Noise gate — kills mic/USB noise floor below -50 dBFS
    NoiseGate gate_;

    // Effects (signal chain order: NAM|OD → Wah → Reverb → Delay)
    OverdriveEffect overdrive_;
    WahWahEffect    wah_;
    ReverbEffect    reverb_;
    DelayEffect     delay_;

    // Enable flags — written by main thread, read by audio thread
    std::atomic<bool> reverbOn_   {false};
    std::atomic<bool> delayOn_    {false};
    std::atomic<bool> overdriveOn_{false};
    std::atomic<bool> wahOn_      {false};
    std::atomic<bool> namOn_      {false};

    // NAM processor — guarded by namMutex_.
    // Audio thread uses try_lock so it never blocks; load thread blocks briefly.
    std::mutex                    namMutex_;
    std::unique_ptr<NamProcessor> nam_;
};
