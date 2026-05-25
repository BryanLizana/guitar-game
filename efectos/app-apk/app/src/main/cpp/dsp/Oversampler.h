#pragma once

// 2x oversampler using linear interpolation (upsample) + averaging (downsample).
// Reduces aliasing artifacts from nonlinear processing (clippers, saturators).
// Template Fn avoids std::function overhead in the realtime callback.
class Oversampler2x {
    float prev_ = 0.0f;
public:
    void reset() { prev_ = 0.0f; }

    template<typename Fn>
    inline float process(float x, Fn fn) {
        float s0 = fn((prev_ + x) * 0.5f);   // interpolated midpoint
        float s1 = fn(x);                      // original sample
        prev_ = x;
        return (s0 + s1) * 0.5f;              // average → decimate
    }
};
