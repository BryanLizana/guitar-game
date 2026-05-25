#pragma once
#include <cmath>

struct BiquadCoeffs { float b0, b1, b2, a1, a2; };

// Second-order IIR filter (Direct Form I).
// All process() calls are inlined — zero function call overhead in the DSP loop.
class Biquad {
    float x1_ = 0, x2_ = 0, y1_ = 0, y2_ = 0;
    BiquadCoeffs c_;
public:
    explicit Biquad(BiquadCoeffs c) : c_(c) {}
    void reset() { x1_ = x2_ = y1_ = y2_ = 0.0f; }

    inline float process(float x) {
        float y = c_.b0*x + c_.b1*x1_ + c_.b2*x2_ - c_.a1*y1_ - c_.a2*y2_;
        x2_ = x1_; x1_ = x;
        y2_ = y1_; y1_ = y;
        return y;
    }
};

// Audio EQ Cookbook biquad factory functions (all for mono, normalized by a0).
inline BiquadCoeffs makeLP(float fc, float Q, float fs) {
    float w0 = 2.0f * static_cast<float>(M_PI) * fc / fs;
    float cosw = cosf(w0), sinw = sinf(w0);
    float alpha = sinw / (2.0f * Q);
    float a0 = 1.0f + alpha;
    return { (1.0f - cosw) / (2.0f * a0),
             (1.0f - cosw) / a0,
             (1.0f - cosw) / (2.0f * a0),
             -2.0f * cosw / a0,
             (1.0f - alpha) / a0 };
}

inline BiquadCoeffs makeHP(float fc, float Q, float fs) {
    float w0 = 2.0f * static_cast<float>(M_PI) * fc / fs;
    float cosw = cosf(w0), sinw = sinf(w0);
    float alpha = sinw / (2.0f * Q);
    float a0 = 1.0f + alpha;
    return {  (1.0f + cosw) / (2.0f * a0),
             -(1.0f + cosw) / a0,
              (1.0f + cosw) / (2.0f * a0),
             -2.0f * cosw / a0,
             (1.0f - alpha) / a0 };
}

inline BiquadCoeffs makePeak(float fc, float dBgain, float Q, float fs) {
    float w0 = 2.0f * static_cast<float>(M_PI) * fc / fs;
    float cosw = cosf(w0), sinw = sinf(w0);
    float A = powf(10.0f, dBgain / 40.0f);
    float alpha = sinw / (2.0f * Q);
    float a0 = 1.0f + alpha / A;
    return { (1.0f + alpha * A) / a0,
             -2.0f * cosw / a0,
             (1.0f - alpha * A) / a0,
             -2.0f * cosw / a0,
             (1.0f - alpha / A) / a0 };
}
