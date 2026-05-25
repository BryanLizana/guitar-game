#pragma once
#include "Biquad.h"
#include "Oversampler.h"
#include <atomic>
#include <vector>
#include <algorithm>
#include <cmath>
#include <cstring>

// ── Noise Gate ────────────────────────────────────────────────────────────────
// Silences the signal below -50 dBFS to kill USB/mic noise floor.
// Peak envelope follower: 2ms attack, 150ms release, 5ms gain smoothing.
class NoiseGate {
    float env_       = 0.0f;
    float gain_      = 0.0f;
    float attCoeff_, relCoeff_, gainCoeff_, threshold_;
public:
    explicit NoiseGate(float fs, float thresholdDb = -50.0f)
        : attCoeff_ (expf(-1.0f / (0.002f * fs)))
        , relCoeff_ (expf(-1.0f / (0.150f * fs)))
        , gainCoeff_(expf(-1.0f / (0.005f * fs)))
        , threshold_(powf(10.0f, thresholdDb / 20.0f))
    {}
    inline float process(float x) {
        float level = fabsf(x);
        // Instantaneous attack so transient peaks open the gate immediately
        if (level > env_) env_ = level;
        else              env_ *= relCoeff_;
        float target = (env_ > threshold_) ? 1.0f : 0.0f;
        gain_ = gainCoeff_ * gain_ + (1.0f - gainCoeff_) * target;
        return x * gain_;
    }
};

// ── Cabinet Simulation ────────────────────────────────────────────────────────
// 3-pole biquad cascade modelling guitar speaker frequency response:
//   HP @ 80 Hz    → remove sub-bass rumble
//   Peak +6 dB @ 3 kHz → presence boost
//   LP @ 5 kHz    → speaker cone rolloff
class CabinetSim {
    Biquad hp_, prs_, lp_;
public:
    explicit CabinetSim(float fs)
        : hp_ (makeHP  (80.0f,   0.7071f, fs))
        , prs_(makePeak(3000.0f, 3.0f, 0.8f, fs))
        , lp_ (makeLP  (5000.0f, 0.7071f, fs))
    {}
    inline float process(float x) {
        return lp_.process(prs_.process(hp_.process(x)));
    }
};

// ── Overdrive ─────────────────────────────────────────────────────────────────
// Hard-drive tanh stage at 2x oversample + one-pole tone LP (1–8 kHz).
// drive: pre-clip gain 1–15.  tone: 0=dark (1kHz LP) → 1=bright (8kHz LP).
class OverdriveEffect {
    Oversampler2x         os_;
    float                 sampleRate_;
    std::atomic<float>    drive_     {4.5f};
    std::atomic<float>    toneAlpha_ {0.0f};   // set in constructor
    float                 toneLP_    = 0.0f;   // audio-thread only

    static float toneToAlpha(float tone, float fs) {
        float fc = 1000.0f + std::clamp(tone, 0.0f, 1.0f) * 7000.0f;
        float rc = 1.0f / (2.0f * static_cast<float>(M_PI) * fc);
        float dt = 1.0f / fs;
        return rc / (rc + dt);
    }
public:
    explicit OverdriveEffect(float fs = 48000.0f)
        : sampleRate_(fs) { toneAlpha_.store(toneToAlpha(0.5f, fs)); }

    void setDrive(float d) { drive_.store(std::clamp(d, 1.0f, 15.0f)); }
    void setTone (float t) { toneAlpha_.store(toneToAlpha(t, sampleRate_)); }

    inline float process(float x) {
        float d = drive_.load(std::memory_order_relaxed);
        float n = 1.0f / tanhf(d);
        float od = os_.process(x, [d, n](float s){ return tanhf(s * d) * n; });
        float a  = toneAlpha_.load(std::memory_order_relaxed);
        toneLP_  = a * toneLP_ + (1.0f - a) * od;
        return toneLP_;
    }
};

// ── Wah-Wah ───────────────────────────────────────────────────────────────────
// State-variable filter (bandpass mode) swept 400–2500 Hz by a sine LFO.
// Bandpass output is gain-compensated (÷f) so level stays constant across sweep.
class WahWahEffect {
    float                 sampleRate_, lfoPhase_ = 0.0f;
    float                 svfLow_ = 0.0f, svfBand_ = 0.0f;
    std::atomic<float>    speed_ {2.5f};   // LFO Hz, 0.3–5
    std::atomic<float>    resonance_ {2.5f}; // SVF Q, 1–6
    static constexpr float kWet = 0.90f;
public:
    explicit WahWahEffect(float fs) : sampleRate_(fs) {}
    void setSpeed    (float hz) { speed_    .store(std::clamp(hz, 0.3f, 5.0f),  std::memory_order_relaxed); }
    void setResonance(float q)  { resonance_.store(std::clamp(q,  1.0f, 6.0f),  std::memory_order_relaxed); }
    inline float process(float x) {
        float lfoFreq = speed_    .load(std::memory_order_relaxed);
        float q       = resonance_.load(std::memory_order_relaxed);
        lfoPhase_ += lfoFreq / sampleRate_;
        if (lfoPhase_ >= 1.0f) lfoPhase_ -= 1.0f;
        float lfo = (1.0f + sinf(2.0f * static_cast<float>(M_PI) * lfoPhase_)) * 0.5f;
        float fc  = 400.0f + lfo * 2100.0f;
        float f   = 2.0f * sinf(static_cast<float>(M_PI) * fc / sampleRate_);
        float hi  = x - svfLow_ - q * svfBand_;
        svfBand_  = std::clamp(svfBand_ + f * hi, -2.0f, 2.0f);
        svfLow_   = std::clamp(svfLow_  + f * svfBand_, -2.0f, 2.0f);
        float bp  = (f > 1e-4f) ? svfBand_ / f : svfBand_;
        bp = std::clamp(bp, -1.5f, 1.5f);
        return x * (1.0f - kWet) + bp * kWet;
    }
};

// ── Reverb ────────────────────────────────────────────────────────────────────
// Schroeder reverb: 4 parallel comb filters + 2 series allpass.
// Delay lengths are the classic Freeverb values, scaled to actual sample rate.
// inputGain scales with (1-room) so the comb steady-state stays below the ±2 clamp.
class ReverbEffect {
    static constexpr int   kNumCombs  = 4;
    static constexpr int   kNumAps    = 2;
    static constexpr int   kCombMs[4] = {35, 37, 34, 32};
    static constexpr int   kApMs  [2] = {5,  13};

    std::atomic<float>     roomSize_ {0.72f};  // 0.30–0.95
    std::atomic<float>     wet_      {0.28f};  // 0.00–0.60

    struct DelayLine {
        std::vector<float> buf;
        int pos = 0;
        explicit DelayLine(int len) : buf(len, 0.0f) {}
        float read() const { return buf[pos]; }
        void write(float v) { buf[pos] = v; pos = (pos + 1) % static_cast<int>(buf.size()); }
    };
    DelayLine combs_[kNumCombs] = { DelayLine(1), DelayLine(1), DelayLine(1), DelayLine(1) };
    DelayLine aps_  [kNumAps  ] = { DelayLine(1), DelayLine(1) };

public:
    explicit ReverbEffect(float fs) :
        combs_{ DelayLine(std::max(1, static_cast<int>(kCombMs[0]*fs/1000))),
                DelayLine(std::max(1, static_cast<int>(kCombMs[1]*fs/1000))),
                DelayLine(std::max(1, static_cast<int>(kCombMs[2]*fs/1000))),
                DelayLine(std::max(1, static_cast<int>(kCombMs[3]*fs/1000))) },
        aps_  { DelayLine(std::max(1, static_cast<int>(kApMs[0]*fs/1000))),
                DelayLine(std::max(1, static_cast<int>(kApMs[1]*fs/1000))) }
    {}

    void setRoomSize(float r) { roomSize_.store(std::clamp(r, 0.30f, 0.95f), std::memory_order_relaxed); }
    void setWet     (float w) { wet_     .store(std::clamp(w, 0.00f, 0.60f), std::memory_order_relaxed); }

    float process(float x) {
        float room = roomSize_.load(std::memory_order_relaxed);
        float wet  = wet_     .load(std::memory_order_relaxed);
        // inputGain keeps steady-state below ±2: gain/(1-room) < 2 → gain = (1-room)*0.9
        float inputGain = (1.0f - room) * 0.9f;

        float comb = 0.0f;
        for (auto& c : combs_) {
            float d = c.read();
            c.write(std::clamp(x * inputGain + d * room, -2.0f, 2.0f));
            comb += d;
        }
        comb *= 0.25f;

        float ap = comb;
        for (auto& a : aps_) {
            float d = a.read();
            a.write(std::clamp(ap + d * 0.5f, -2.0f, 2.0f));
            ap = -ap + d;
        }
        return x * (1.0f - wet) + ap * wet;
    }
};

// ── Delay ─────────────────────────────────────────────────────────────────────
// Variable echo: time 50–750 ms, feedback 0–90%, wet 0–70%.
// Buffer is allocated at max size (750 ms); only the read offset changes at runtime.
// Parameters are atomic so the UI thread can update them without locks.
class DelayEffect {
    std::vector<float>   buf_;
    int                  writePos_ = 0;
    float                sampleRate_;
    std::atomic<int>     delaySamples_;   // read-offset into buf_
    std::atomic<float>   feedback_  {0.45f};
    std::atomic<float>   wet_       {0.35f};
    static constexpr float kInputGain = 0.50f;
    static constexpr float kMaxMs     = 750.0f;
public:
    explicit DelayEffect(float fs)
        : buf_(std::max(1, static_cast<int>(fs * kMaxMs / 1000.0f + 1)), 0.0f)
        , sampleRate_(fs)
        , delaySamples_(static_cast<int>(fs * 0.375f))  // default 375 ms
    {}

    // Called from the UI/main thread — safe via atomics.
    void setTimeMs   (float ms) {
        int s = static_cast<int>(sampleRate_ * std::clamp(ms, 50.0f, kMaxMs) / 1000.0f);
        s = std::clamp(s, 1, static_cast<int>(buf_.size()) - 1);
        delaySamples_.store(s, std::memory_order_relaxed);
    }
    void setFeedback (float f)  { feedback_.store(std::clamp(f, 0.0f, 0.90f), std::memory_order_relaxed); }
    void setWet      (float w)  { wet_     .store(std::clamp(w, 0.0f, 0.70f), std::memory_order_relaxed); }

    float process(float x) {
        int   delay = delaySamples_.load(std::memory_order_relaxed);
        float fb    = feedback_    .load(std::memory_order_relaxed);
        float wet   = wet_         .load(std::memory_order_relaxed);
        int   sz    = static_cast<int>(buf_.size());
        int   readPos = (writePos_ - delay + sz) % sz;
        float d = buf_[readPos];
        buf_[writePos_] = std::clamp(x * kInputGain + d * fb, -1.0f, 1.0f);
        writePos_ = (writePos_ + 1) % sz;
        return x * (1.0f - wet) + d * wet;
    }
};
