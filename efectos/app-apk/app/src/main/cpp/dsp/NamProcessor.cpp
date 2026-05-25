#include "NamProcessor.h"
#include <algorithm>
#include <cassert>
#include <cstring>
#include <stdexcept>

// ═══════════════════════════════════════════════════════════════════════════
// LSTM implementation
// ═══════════════════════════════════════════════════════════════════════════

// One LSTM cell — weight layout: W(4H×(I+H)) then b(4H) then h0(H) then c0(H).
// Combined W matrix maps [input; h] → [i,f,g,o] gates (IFGO order, like PyTorch).
class NamLstmCell {
public:
    void load(int I, int H, std::vector<float>::const_iterator& it) {
        I_ = I; H_ = H;
        const int sz = I + H;
        w_    .resize(4 * H * sz);
        b_    .resize(4 * H);
        initH_.resize(H);
        initC_.resize(H);
        xh_   .resize(sz,  0.0f);
        c_    .resize(H,   0.0f);
        ifgo_ .resize(4 * H);
        for (auto& v : w_)     v = *it++;
        for (auto& v : b_)     v = *it++;
        for (auto& v : initH_) v = *it++;
        for (auto& v : initC_) v = *it++;
        resetState();
    }
    void resetState() {
        std::copy(initH_.begin(), initH_.end(), xh_.begin() + I_);
        std::copy(initC_.begin(), initC_.end(), c_.begin());
    }
    void forward(const float* input) {
        std::memcpy(xh_.data(), input, I_ * sizeof(float));
        const int sz = I_ + H_;
        for (int i = 0; i < 4 * H_; i++) {
            float s = b_[i];
            const float* row = w_.data() + i * sz;
            for (int j = 0; j < sz; j++) s += row[j] * xh_[j];
            ifgo_[i] = s;
        }
        for (int i = 0; i < H_; i++) {
            const float ig = 1.0f / (1.0f + expf(-ifgo_[      i]));
            const float fg = 1.0f / (1.0f + expf(-ifgo_[H_  + i]));
            const float gg = tanhf(ifgo_[2*H_ + i]);
            const float og = 1.0f / (1.0f + expf(-ifgo_[3*H_ + i]));
            c_[i]       = fg * c_[i] + ig * gg;
            xh_[I_ + i] = og * tanhf(c_[i]);
        }
    }
    const float* hiddenPtr() const { return xh_.data() + I_; }
    int hiddenSize()         const { return H_; }

private:
    int I_ = 0, H_ = 0;
    std::vector<float> w_, b_, initH_, initC_, xh_, c_, ifgo_;
};

class NamLstmImpl : public NamProcessor::IImpl {
public:
    bool load(int numLayers, int inputSize, int hiddenSize,
              const float* weights, int weightCount) {
        // Compute expected weight count
        int expected = 0;
        for (int l = 0; l < numLayers; l++) {
            int I = (l == 0) ? inputSize : hiddenSize;
            expected += 4*hiddenSize*(I+hiddenSize) + 4*hiddenSize + hiddenSize + hiddenSize;
        }
        expected += hiddenSize + 1;
        if (weightCount != expected) return false;

        std::vector<float> w(weights, weights + weightCount);
        auto it = w.cbegin();
        cells_.clear();
        cells_.resize(numLayers);
        for (int l = 0; l < numLayers; l++) {
            int cellIn = (l == 0) ? inputSize : hiddenSize;
            cells_[l].load(cellIn, hiddenSize, it);
        }
        headW_.resize(hiddenSize);
        for (auto& v : headW_) v = *it++;
        headB_ = *it++;
        H_ = hiddenSize;
        return true;
    }

    float process(float x) override {
        cells_[0].forward(&x);
        for (size_t l = 1; l < cells_.size(); l++)
            cells_[l].forward(cells_[l-1].hiddenPtr());
        const float* h = cells_.back().hiddenPtr();
        float out = headB_;
        for (int i = 0; i < H_; i++) out += headW_[i] * h[i];
        return out;
    }

    void reset() override {
        for (auto& c : cells_) c.resetState();
    }

private:
    std::vector<NamLstmCell> cells_;
    std::vector<float>       headW_;
    float                    headB_ = 0.0f;
    int                      H_     = 0;
};

// ═══════════════════════════════════════════════════════════════════════════
// WaveNet implementation — generic, handles any layer/dilation configuration.
//
// Weight layout matches NeuralAmpModelerCore layer-array format exactly:
//   rechannel [C]
//   per layer:
//     conv_w [C×C×K]  read order: out i, in j, tap k
//     conv_b [C]
//     mixin_w [C]     (1→C, no bias)
//     l1x1_w [C×C]   read order: out i, in j
//     l1x1_b [C]
//   head_w [C×head_K]  read order: in j, tap k
//   head_b [1]
//   head_scale [1]
// ═══════════════════════════════════════════════════════════════════════════

static int waveNetWeightCount(int C, const int* kernelSizes, int numLayers, int headK) {
    int n = C; // rechannel
    for (int l = 0; l < numLayers; l++) {
        int K = kernelSizes[l];
        n += C*C*K + C; // conv
        n += C;          // mixin
        n += C*C + C;    // l1x1
    }
    n += C * headK + 1 + 1; // head conv + head_b + head_scale
    return n;
}

struct WNLayer {
    int K, D, maxLookback;
    int C;
    // conv: K × C × C, stored as [i_out][i_in][k_tap] = convW[i*C*K + j*K + k]
    // but we read/access by tap for the forward pass so store [k][j][i] = convW[k*C*C + j*C + i]
    std::vector<float> convW;  // K×C×C col-major per tap
    std::vector<float> convB;  // C
    std::vector<float> mixinW; // C
    std::vector<float> l1x1W;  // C×C col-major
    std::vector<float> l1x1B;  // C

    // Circular history ring (C channels × histLen frames, col-major)
    std::vector<float> history;
    int histLen = 0;
    int writePos = 0;

    void init(int channels, int kernelSize, int dilation) {
        C = channels; K = kernelSize; D = dilation;
        maxLookback = (K - 1) * D;
        convW .assign(K * C * C, 0.0f);
        convB .assign(C, 0.0f);
        mixinW.assign(C, 0.0f);
        l1x1W .assign(C * C, 0.0f);
        l1x1B .assign(C, 0.0f);
        histLen  = maxLookback + 1;
        history.assign(histLen * C, 0.0f);
        writePos = 0;
    }

    // Process one frame: modifies layerIn (C floats) in-place, accumulates into headSum (C floats)
    void forward(float cond, float* layerIn, float* headSum) {
        // 1. Write current layerIn to history ring
        std::memcpy(history.data() + writePos * C, layerIn, C * sizeof(float));
        writePos = (writePos + 1 >= histLen) ? 0 : writePos + 1;

        // 2. z = conv_b (seed)
        float z[64]; // max C=8, but safe up to 64
        std::memcpy(z, convB.data(), C * sizeof(float));

        // 3. z += sum over taps of W[k] @ history[pos_for_tap_k]
        for (int k = 0; k < K; k++) {
            const int tapsBack = K - 1 - k;
            int histPos = writePos - 1 - tapsBack * D;
            while (histPos < 0) histPos += histLen;
            const float* hist = history.data() + histPos * C;
            // conv_w stored as col-major per tap: w[k*C*C + j*C + i] = weight(out=i, in=j, tap=k)
            const float* wk = convW.data() + k * C * C;
            for (int i = 0; i < C; i++) {
                for (int j = 0; j < C; j++) {
                    z[i] += wk[j * C + i] * hist[j];
                }
            }
        }

        // 4. z += mixin * cond
        for (int i = 0; i < C; i++) z[i] += mixinW[i] * cond;

        // 5. LeakyReLU
        for (int i = 0; i < C; i++) z[i] = z[i] > 0.0f ? z[i] : 0.01f * z[i];

        // 6. head_sum += z
        for (int i = 0; i < C; i++) headSum[i] += z[i];

        // 7. layerIn = layerIn + l1x1(z)  [residual, l1x1 has bias]
        for (int i = 0; i < C; i++) {
            float v = l1x1B[i];
            for (int j = 0; j < C; j++) v += l1x1W[j * C + i] * z[j];
            layerIn[i] += v;
        }
    }
};

class NamWaveNetImpl : public NamProcessor::IImpl {
public:
    bool load(int C, const int* kernelSizes, const int* dilations,
              int numLayers, int headK,
              const float* weights, int weightCount) {
        if (C < 1 || numLayers < 1 || headK < 1) return false;
        if (weightCount != waveNetWeightCount(C, kernelSizes, numLayers, headK)) return false;
        C_ = C;

        const float* p = weights;

        // Rechannel (1→C, no bias)
        rechannel_.assign(p, p + C); p += C;

        layers_.resize(numLayers);
        for (int l = 0; l < numLayers; l++) {
            const int K = kernelSizes[l];
            const int D = dilations[l];
            layers_[l].init(C, K, D);

            // conv_w: read order out i, in j, tap k → store col-major per tap [k*C*C + j*C + i]
            for (int i = 0; i < C; i++)
                for (int j = 0; j < C; j++)
                    for (int k = 0; k < K; k++)
                        layers_[l].convW[k*C*C + j*C + i] = *p++;
            // conv_b
            std::memcpy(layers_[l].convB.data(), p, C*sizeof(float)); p += C;
            // mixin_w
            std::memcpy(layers_[l].mixinW.data(), p, C*sizeof(float)); p += C;
            // l1x1_w: read order out i, in j → store col-major [j*C + i]
            for (int i = 0; i < C; i++)
                for (int j = 0; j < C; j++)
                    layers_[l].l1x1W[j*C + i] = *p++;
            // l1x1_b
            std::memcpy(layers_[l].l1x1B.data(), p, C*sizeof(float)); p += C;
        }

        // Head conv (C→1, k=headK): read order in j, tap k → headW[k*C + j]
        headK_  = headK;
        headW_.assign(headK * C, 0.0f);
        for (int j = 0; j < C; j++)
            for (int k = 0; k < headK; k++)
                headW_[k * C + j] = *p++;
        headB_     = *p++;
        headScale_ = *p++;

        // Head history ring: need headK frames of history
        headHistLen_ = headK;
        headHistory_.assign(headHistLen_ * C, 0.0f);
        headWritePos_ = 0;

        // Working buffers
        layerIn_ .resize(C, 0.0f);
        headSum_ .resize(C, 0.0f);

        return true;
    }

    float process(float x) override {
        // 1. Rechannel scalar input to C channels
        for (int i = 0; i < C_; i++) layerIn_[i] = rechannel_[i] * x;

        // 2. Clear head accumulator
        std::fill(headSum_.begin(), headSum_.end(), 0.0f);

        // 3. Run all layers
        for (auto& layer : layers_)
            layer.forward(x, layerIn_.data(), headSum_.data());

        // 4. Write headSum to head history ring
        std::memcpy(headHistory_.data() + headWritePos_ * C_, headSum_.data(), C_*sizeof(float));
        headWritePos_ = (headWritePos_ + 1 >= headHistLen_) ? 0 : headWritePos_ + 1;

        // 5. Head Conv1D (C→1): output = headB + sum_k dot(headW[k], headHistory[pos-k])
        float out = headB_;
        for (int k = 0; k < headK_; k++) {
            int hpos = headWritePos_ - 1 - k;
            while (hpos < 0) hpos += headHistLen_;
            const float* hs = headHistory_.data() + hpos * C_;
            const float* wk = headW_.data() + k * C_;
            for (int j = 0; j < C_; j++) out += wk[j] * hs[j];
        }

        return out * headScale_;
    }

    void reset() override {
        for (auto& l : layers_) {
            std::fill(l.history.begin(), l.history.end(), 0.0f);
            l.writePos = 0;
        }
        std::fill(headHistory_.begin(), headHistory_.end(), 0.0f);
        headWritePos_ = 0;
        std::fill(layerIn_.begin(), layerIn_.end(), 0.0f);
        std::fill(headSum_.begin(), headSum_.end(), 0.0f);
    }

private:
    int                  C_ = 0;
    int                  headK_ = 16;
    std::vector<float>   rechannel_;
    std::vector<WNLayer> layers_;
    std::vector<float>   headW_;
    float                headB_     = 0.0f;
    float                headScale_ = 1.0f;
    std::vector<float>   headHistory_;
    int                  headHistLen_  = 0;
    int                  headWritePos_ = 0;
    std::vector<float>   layerIn_;
    std::vector<float>   headSum_;
};

// ═══════════════════════════════════════════════════════════════════════════
// WaveNet — standard NeuralAmpModelerCore multi-group format.
//
// Weight layout (matches NeuralAmpModelerCore LayerArray::set_weights_):
//
//   Per group g:
//     rechannel_w  [C_g × inputSize_g]       (inputSize_0=1, inputSize_g=C_{g-1})
//     Per layer l (ALL layers, including l=0):
//       conv_w     [C_g × C_g × K_g]         PyTorch [out, in, k] → transposed on load
//       conv_b     [C_g]
//       mixin_w    [C_g]                      (condition_size=1 → C_g)
//       mixin_b    [C_g]                      (conditioning bias)
//       res1x1_w   [C_g × C_g]               (residual projection, no bias)
//     head_w       [headSize_g × C_g]
//     head_b       [headSize_g]               (only if head_bias=true)
//   head_scale     [1]                        (last element of the whole array)
//
// Forward pass per group:
//   xBuf = rechannel_w @ layerInput        (layer input → C-dim feature)
//   headSum = prevGroup.headOut  (or 0 for group 0)
//   for each layer:
//     z = tanh(dilated_causal_conv(xBuf) + mixin_w*cond + mixin_b)
//     headSum += z
//     xBuf = xBuf + res1x1_w @ z
//   headOut = head_w @ headSum [+ head_b]
// output = head_scale * lastGroup.headOut[0]
// ═══════════════════════════════════════════════════════════════════════════

static constexpr int kMaxK = 32;  // max kernel size

struct WNGv2Layer {
    int C, K, D;
    // conv_w transposed from PyTorch [out, in, k] to [out, k, in] for cache efficiency
    std::vector<float> convWT;
    const float* convB    = nullptr;  // [C]
    const float* mixW     = nullptr;  // [C]
    const float* mixB     = nullptr;  // [C]
    const float* res1x1W  = nullptr;  // [C × C]

    std::vector<float> history;  // [(K-1)*D+1 × C] circular buffer
    int histLen  = 0;
    int writePos = 0;

    void init(int c, int k, int d) {
        C = c; K = k; D = d;
        histLen = (K - 1) * D + 1;
        history.assign(histLen * C, 0.0f);
        convWT.resize(C * K * C, 0.0f);
        writePos = 0;
    }

    // PyTorch [out, in, k] → convWT [out, k, in]
    void loadConvWeights(const float* src) {
        for (int i = 0; i < C; i++)
            for (int j = 0; j < C; j++)
                for (int k = 0; k < K; k++)
                    convWT[i * K * C + k * C + j] = src[i * C * K + j * K + k];
    }

    void reset() { std::fill(history.begin(), history.end(), 0.0f); writePos = 0; }
};

struct WNGv2Group {
    int inputSize, C, headSize;
    bool headBias;
    std::vector<float>    rcW;      // [C × inputSize]
    std::vector<WNGv2Layer> layers;
    const float* headW = nullptr;   // [headSize × C]
    const float* headB = nullptr;   // [headSize] or nullptr

    // Working buffers
    std::vector<float> xBuf;     // [C]
    std::vector<float> zBuf;     // [C]
    std::vector<float> headSum;  // [C]
    std::vector<float> headOut;  // [headSize]
};

class NamWaveNetGroupsImpl : public NamProcessor::IImpl {
public:
    bool load(int numGroups,
              const int* groupChannels,
              const int* groupKernelSizes,
              const int* groupHeadSizes,
              const int* groupHeadBias,
              const int* dilationCounts,
              const int* flatDilations,
              float /*headScaleHint*/,
              const float* weights, int weightCount) {
        if (numGroups < 1) return false;

        // Validate weight count
        int expected = 0;
        for (int g = 0; g < numGroups; g++) {
            const int is = (g == 0) ? 1 : groupChannels[g-1];
            const int C  = groupChannels[g];
            const int K  = groupKernelSizes[g];
            const int L  = dilationCounts[g];
            const int hs = groupHeadSizes[g];
            const bool hb = groupHeadBias[g] != 0;
            expected += C * is;                         // rechannel
            expected += L * (C*C*K + C + C + C + C*C); // conv+convB+mixW+mixB+res1x1
            expected += hs * C + (hb ? hs : 0);         // head_rechannel
        }
        expected += 1;  // head_scale (last element)
        if (expected != weightCount) return false;

        // Head scale is the last weight in the array
        headScale_ = weights[weightCount - 1];

        // Pre-reserve storage for non-conv weights so pointers stay stable
        wStore_.clear();
        wStore_.reserve(weightCount);

        groups_.resize(numGroups);
        const float* p = weights;
        int dilOffset = 0;

        for (int g = 0; g < numGroups; g++) {
            const int is = (g == 0) ? 1 : groupChannels[g-1];
            const int C  = groupChannels[g];
            const int K  = groupKernelSizes[g];
            const int L  = dilationCounts[g];
            const int hs = groupHeadSizes[g];
            const bool hb = groupHeadBias[g] != 0;

            auto& grp = groups_[g];
            grp.inputSize = is;
            grp.C         = C;
            grp.headSize  = hs;
            grp.headBias  = hb;

            // Rechannel weights [C × inputSize]
            grp.rcW.assign(p, p + C * is);
            p += C * is;

            grp.layers.resize(L);
            for (int l = 0; l < L; l++) {
                const int D = flatDilations[dilOffset + l];
                auto& layer = grp.layers[l];
                layer.init(C, K, D);

                // conv_w: [C × C × K] → transposed to [C × K × C]
                layer.loadConvWeights(p);
                p += C * C * K;

                // Remaining weights stored in wStore_ (pointers stable after reserve)
                auto storeSlice = [&](int n) -> const float* {
                    const size_t off = wStore_.size();
                    wStore_.insert(wStore_.end(), p, p + n);
                    p += n;
                    return wStore_.data() + off;
                };
                layer.convB   = storeSlice(C);
                layer.mixW    = storeSlice(C);
                layer.mixB    = storeSlice(C);
                layer.res1x1W = storeSlice(C * C);
            }

            // Head rechannel
            auto storeSlice = [&](int n) -> const float* {
                const size_t off = wStore_.size();
                wStore_.insert(wStore_.end(), p, p + n);
                p += n;
                return wStore_.data() + off;
            };
            grp.headW = storeSlice(hs * C);
            grp.headB = hb ? storeSlice(hs) : nullptr;

            // Working buffers
            grp.xBuf   .resize(C,  0.f);
            grp.zBuf   .resize(C,  0.f);
            grp.headSum.resize(C,  0.f);
            grp.headOut.resize(hs, 0.f);

            dilOffset += L;
        }
        return true;
    }

    float process(float x) override {
        const float cond = x;

        for (int gi = 0; gi < (int)groups_.size(); gi++) {
            auto& grp = groups_[gi];
            const int C  = grp.C;
            const int hs = grp.headSize;

            // 1. Rechannel: xBuf = rcW @ layerInput
            if (grp.inputSize == 1) {
                for (int c = 0; c < C; c++) grp.xBuf[c] = grp.rcW[c] * x;
            } else {
                const float* prevX = groups_[gi - 1].xBuf.data();
                const int is = grp.inputSize;
                for (int c = 0; c < C; c++) {
                    float acc = 0.f;
                    const float* row = grp.rcW.data() + c * is;
                    for (int j = 0; j < is; j++) acc += row[j] * prevX[j];
                    grp.xBuf[c] = acc;
                }
            }

            // 2. Init headSum (zero for group 0, prev headOut for others)
            if (gi == 0) {
                std::fill(grp.headSum.begin(), grp.headSum.end(), 0.f);
            } else {
                std::copy(groups_[gi-1].headOut.begin(),
                          groups_[gi-1].headOut.end(),
                          grp.headSum.begin());
            }

            // 3. Process layers
            for (auto& layer : grp.layers) {
                // Write xBuf to history ring
                std::memcpy(layer.history.data() + layer.writePos * C,
                            grp.xBuf.data(), C * sizeof(float));
                const int wp1 = (layer.writePos + 1 < layer.histLen)
                              ? layer.writePos + 1 : 0;
                layer.writePos = wp1;

                // Flatten K taps into a contiguous buffer — enables NEON auto-vectorization.
                // tapBuf[k*C .. k*C+C-1] = history at dilation tap k (k=0 oldest)
                float tapBuf[kMaxK * 32];  // K×C, max K=32 C=32
                const int KC = layer.K * C;
                for (int k = 0; k < layer.K; k++) {
                    int hpos = wp1 - 1 - (layer.K - 1 - k) * layer.D;
                    if (hpos < 0) hpos += layer.histLen;
                    std::memcpy(tapBuf + k * C,
                                layer.history.data() + hpos * C,
                                C * sizeof(float));
                }

                // Dilated causal conv: z[i] = convB[i] + dot(convWT[i,:], tapBuf)
                // convWT[i,:] is K*C contiguous floats — inner loop is a flat dot product.
                for (int i = 0; i < C; i++) {
                    float acc = layer.convB[i];
                    const float* wi = layer.convWT.data() + i * KC;
                    for (int j = 0; j < KC; j++) acc += wi[j] * tapBuf[j];
                    grp.zBuf[i] = acc;
                }

                // Conditioning: z += mixW * cond + mixB
                for (int i = 0; i < C; i++)
                    grp.zBuf[i] += layer.mixW[i] * cond + layer.mixB[i];

                // Tanh activation
                for (int i = 0; i < C; i++) grp.zBuf[i] = tanhf(grp.zBuf[i]);

                // Skip accumulation: headSum += z
                for (int i = 0; i < C; i++) grp.headSum[i] += grp.zBuf[i];

                // Residual in-place: xBuf[i] += dot(res1x1W[i,:], zBuf)
                // Safe because each i reads then writes only xBuf[i] (no cross-i dependency).
                for (int i = 0; i < C; i++) {
                    float v = grp.xBuf[i];
                    const float* row = layer.res1x1W + i * C;
                    for (int j = 0; j < C; j++) v += row[j] * grp.zBuf[j];
                    grp.xBuf[i] = v;
                }
            }

            // 4. Head rechannel: headOut = headW @ headSum [+ headB]
            for (int h = 0; h < hs; h++) {
                float acc = grp.headBias ? grp.headB[h] : 0.f;
                const float* row = grp.headW + h * C;
                for (int c = 0; c < C; c++) acc += row[c] * grp.headSum[c];
                grp.headOut[h] = acc;
            }
        }

        return headScale_ * groups_.back().headOut[0];
    }

    void reset() override {
        for (auto& grp : groups_) {
            std::fill(grp.xBuf .begin(), grp.xBuf .end(), 0.f);
            std::fill(grp.zBuf .begin(), grp.zBuf .end(), 0.f);
            std::fill(grp.headSum.begin(), grp.headSum.end(), 0.f);
            std::fill(grp.headOut.begin(), grp.headOut.end(), 0.f);
            for (auto& l : grp.layers) l.reset();
        }
    }

private:
    std::vector<WNGv2Group> groups_;
    std::vector<float>      wStore_;   // non-conv weights (pointers stable after reserve)
    float                   headScale_ = 1.0f;
};

// ═══════════════════════════════════════════════════════════════════════════
// NamProcessor public API
// ═══════════════════════════════════════════════════════════════════════════

bool NamProcessor::loadLstm(int numLayers, int inputSize, int hiddenSize,
                             const float* weights, int weightCount) {
    auto p = std::make_unique<NamLstmImpl>();
    if (!p->load(numLayers, inputSize, hiddenSize, weights, weightCount)) return false;
    impl_ = std::move(p);
    return true;
}

bool NamProcessor::loadWaveNet(int channels,
                               const int* kernelSizes, const int* dilations, int numLayers,
                               int headKernelSize,
                               const float* weights, int weightCount) {
    auto p = std::make_unique<NamWaveNetImpl>();
    if (!p->load(channels, kernelSizes, dilations, numLayers, headKernelSize,
                 weights, weightCount)) return false;
    impl_ = std::move(p);
    return true;
}

bool NamProcessor::loadWaveNetGroups(int numGroups,
                                     const int* groupChannels,
                                     const int* groupKernelSizes,
                                     const int* groupHeadSizes,
                                     const int* groupHeadBias,
                                     const int* dilationCounts,
                                     const int* flatDilations,
                                     float headScale,
                                     const float* weights, int weightCount) {
    auto p = std::make_unique<NamWaveNetGroupsImpl>();
    if (!p->load(numGroups, groupChannels, groupKernelSizes, groupHeadSizes,
                 groupHeadBias, dilationCounts, flatDilations,
                 headScale, weights, weightCount)) return false;
    impl_ = std::move(p);
    return true;
}

float NamProcessor::process(float x) {
    return impl_ ? impl_->process(x) : 0.0f;
}

void NamProcessor::reset() {
    if (impl_) impl_->reset();
}
