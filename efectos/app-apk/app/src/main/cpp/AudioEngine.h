#pragma once
#include <oboe/Oboe.h>
#include <atomic>
#include <chrono>
#include <memory>
#include <mutex>
#include <vector>
#include "dsp/DspProcessor.h"

// Full-duplex guitar-pedal engine.
//
// Architecture:
//   • The OUTPUT stream is the master and drives the realtime DSP callback.
//   • The INPUT stream is opened second, configured to match the output's
//     actual hardware sample rate and burst size (queried *after* open).
//   • A lock-free SPSC ring buffer absorbs jitter / small drift between
//     the two streams. The input callback writes into it; the output
//     callback reads through an adaptive fractional resampler that
//     stretches or compresses the stream by ≤ 0.5 % to track the
//     target ring fill level — eliminating drift-induced underruns
//     without audible pitch artifacts.
class AudioEngine : public oboe::AudioStreamDataCallback,
                    public oboe::AudioStreamErrorCallback {
public:
    AudioEngine();
    ~AudioEngine() override;

    bool start(int32_t preferredSampleRate,
               int32_t preferredFramesPerBurst,
               int32_t inputDeviceId);
    void stop();
    bool isRunning() const { return running_.load(); }

    void setGain(float g)    { gain_   .store(g,  std::memory_order_relaxed); }
    void setBypass(bool on)  { bypass_ .store(on, std::memory_order_relaxed); }
    void setEffectEnabled(int id, bool on);
    void setDelayParam    (int param, float value) { if (dsp_) dsp_->setDelayParam(param, value); }
    void setReverbParam   (int param, float value) { if (dsp_) dsp_->setReverbParam(param, value); }
    void setOverdriveParam(int param, float value) { if (dsp_) dsp_->setOverdriveParam(param, value); }
    void setWahParam      (int param, float value) { if (dsp_) dsp_->setWahParam(param, value); }
    bool loadNamLstm(int numLayers, int inputSize, int hiddenSize,
                     const float* weights, int weightCount) {
        return dsp_ && dsp_->loadNamLstm(numLayers, inputSize, hiddenSize, weights, weightCount);
    }
    bool loadNamWaveNet(int channels,
                        const int* kernelSizes, const int* dilations, int numLayers,
                        int headKernelSize,
                        const float* weights, int weightCount) {
        return dsp_ && dsp_->loadNamWaveNet(channels, kernelSizes, dilations,
                                             numLayers, headKernelSize, weights, weightCount);
    }
    bool loadNamWaveNetGroups(int numGroups,
                              const int* groupChannels,
                              const int* groupKernelSizes,
                              const int* groupHeadSizes,
                              const int* groupHeadBias,
                              const int* dilationCounts,
                              const int* flatDilations,
                              float headScale,
                              const float* weights, int weightCount) {
        return dsp_ && dsp_->loadNamWaveNetGroups(numGroups, groupChannels, groupKernelSizes,
                                                   groupHeadSizes, groupHeadBias,
                                                   dilationCounts, flatDilations,
                                                   headScale, weights, weightCount);
    }
    void unloadNam() { if (dsp_) dsp_->unloadNam(); }

    // Diagnostic snapshot — written by audio threads, read by UI thread.
    struct DiagSnapshot {
        float   peak;
        int32_t missed;
        int32_t xrunIn;
        int32_t xrunOut;
        int32_t sampleRate;
        int32_t framesPerBurst;
        int32_t inputDeviceId;
        int32_t ringFill;
        float   driftPpm;         // resampler deviation from 1:1 (positive = stretching output)
        int32_t resyncs;          // number of in-place ring resyncs since last reset
        int32_t inputDrops;       // input frames dropped because the ring was full
        float   measuredInputRate; // 0 = still calibrating, >0 = measured Hz after 5s window
    };
    DiagSnapshot getDiagSnapshot() const;
    void resetDiag() {
        diagPeak_  .store(0.0f, std::memory_order_relaxed);
        diagMissed_.store(0,    std::memory_order_relaxed);
    }

    // Oboe callbacks (the engine acts as data + error callback for both streams).
    oboe::DataCallbackResult onAudioReady(
        oboe::AudioStream* stream, void* data, int32_t frames) override;
    void onErrorAfterClose(oboe::AudioStream* stream, oboe::Result error) override;

private:
    bool openStreams(int32_t sampleRate,
                     int32_t framesPerBurst,
                     int32_t inputDeviceId);
    void closeStreams();

    // Lock-free SPSC ring buffer of mono floats.
    // Input callback = producer (write), output callback = consumer (read).
    // Random read access via peekAt() supports the fractional resampler.
    class FloatRing {
    public:
        void resize(size_t capacity) {
            buf_.assign(capacity, 0.0f);
            head_.store(0, std::memory_order_relaxed);
            tail_.store(0, std::memory_order_relaxed);
        }
        size_t capacity() const { return buf_.size(); }
        size_t size() const {
            size_t h = head_.load(std::memory_order_acquire);
            size_t t = tail_.load(std::memory_order_acquire);
            return (h >= t) ? (h - t) : (buf_.size() - t + h);
        }
        void clear() {
            head_.store(0, std::memory_order_release);
            tail_.store(0, std::memory_order_release);
        }
        size_t writeSilence(size_t n) {
            size_t cap = buf_.size();
            size_t h   = head_.load(std::memory_order_relaxed);
            size_t t   = tail_.load(std::memory_order_acquire);
            size_t free = (t > h) ? (t - h - 1) : (cap - h + t - 1);
            size_t toWrite = (n < free) ? n : free;
            for (size_t i = 0; i < toWrite; ++i) {
                buf_[h] = 0.0f;
                h = (h + 1 == cap) ? 0 : h + 1;
            }
            head_.store(h, std::memory_order_release);
            return toWrite;
        }
        size_t write(const float* src, size_t n) {
            size_t cap = buf_.size();
            size_t h   = head_.load(std::memory_order_relaxed);
            size_t t   = tail_.load(std::memory_order_acquire);
            size_t free = (t > h) ? (t - h - 1) : (cap - h + t - 1);
            size_t toWrite = (n < free) ? n : free;
            for (size_t i = 0; i < toWrite; ++i) {
                buf_[h] = src[i];
                h = (h + 1 == cap) ? 0 : h + 1;
            }
            head_.store(h, std::memory_order_release);
            return toWrite;
        }
        // Peek a sample at `offset` from tail without consuming. Returns
        // false (and 0.0f) when out of range.
        bool peekAt(size_t offset, float& out) const {
            size_t cap = buf_.size();
            size_t h   = head_.load(std::memory_order_acquire);
            size_t t   = tail_.load(std::memory_order_relaxed);
            size_t avail = (h >= t) ? (h - t) : (cap - t + h);
            if (offset >= avail) { out = 0.0f; return false; }
            size_t idx = t + offset;
            if (idx >= cap) idx -= cap;
            out = buf_[idx];
            return true;
        }
        // Advance the tail by `n` samples (consume without copying).
        void advance(size_t n) {
            size_t cap = buf_.size();
            size_t h   = head_.load(std::memory_order_acquire);
            size_t t   = tail_.load(std::memory_order_relaxed);
            size_t avail = (h >= t) ? (h - t) : (cap - t + h);
            if (n > avail) n = avail;
            t += n;
            if (t >= cap) t -= cap;
            tail_.store(t, std::memory_order_release);
        }
    private:
        std::vector<float>  buf_;
        std::atomic<size_t> head_{0};
        std::atomic<size_t> tail_{0};
    };

    std::shared_ptr<oboe::AudioStream> inputStream_;
    std::shared_ptr<oboe::AudioStream> outputStream_;

    std::unique_ptr<DspProcessor> dsp_;
    FloatRing                     ring_;
    std::vector<float>            inputScratch_;   // input-side down-mix scratch
    std::vector<float>            outputScratch_;  // resampler output scratch

    // Configuration captured from the *actual* opened streams.
    int32_t sampleRate_      = 48000;
    int32_t framesPerBurst_  = 256;
    int32_t inputDeviceId_   = 0;
    int32_t inputChannels_   = 1;
    int32_t ringTargetFrames_= 0;

    // Adaptive fractional resampler state.
    // baseStep_ = inputSampleRate / outputSampleRate — covers the physical
    // rate ratio between the two devices (fixed, can be far from 1.0).
    // resampStep_ = baseStep_ × (1 + ppm drift) — the live step driven by
    // the PI controller; only the ppm term is constrained to ±kMaxDrift.
    double  readPos_     = 0.0;   // fractional position from current tail
    double  baseStep_    = 1.0;   // inputSR / outputSR
    double  resampStep_  = 1.0;   // base × ppm drift
    double  driftAccum_  = 0.0;   // PI integral term
    float   lastSample_  = 0.0f;  // hold value for underflow

    // Crossfade state after a resync — fades from the held-last-sample
    // signal into the new ring contents over crossfadeRemaining_ samples
    // to avoid the audible click of a hard cut.
    int32_t crossfadeLen_       = 0;
    int32_t crossfadeRemaining_ = 0;
    float   crossfadeFrom_      = 0.0f;

    std::atomic<float>   gain_      {4.0f};
    std::atomic<bool>    bypass_    {false};
    std::atomic<bool>    running_   {false};
    std::atomic<float>   diagPeak_  {0.0f};
    std::atomic<int32_t> diagMissed_{0};
    std::atomic<int32_t> diagRingFill_{0};
    std::atomic<float>   diagDrift_ {0.0f};
    std::atomic<int32_t> diagResyncs_{0};
    std::atomic<int32_t> diagInputDrops_{0};
    int32_t              lowFillStreak_ = 0;

    // Physical rate measurement — input thread writes, output thread reads once.
    // Counts real frames delivered by the OS over a 5-second window and derives
    // the true sample rate (may differ from getSampleRate() when Oboe/AAudio
    // silently resamples a USB device).
    std::atomic<int64_t> rateCalibStartNs_    {0};
    std::atomic<int64_t> rateCalibFrames_     {0};
    std::atomic<float>   diagMeasuredInputRate_{0.0f};
    std::atomic<bool>    rateCalibDone_        {false};
    bool                 baseStepCorrected_    = false; // output thread only

    // Restart re-entrancy guard.
    std::mutex restartMutex_;
};
