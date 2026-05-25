#pragma once
#include <cmath>
#include <memory>
#include <vector>

// ─────────────────────────────────────────────────────────────────────────────
// NamProcessor — unified wrapper for LSTM and WaveNet (.nam) models.
//
// Call loadLstm() or loadWaveNet() once (from the JNI/UI thread).
// Call process() per audio sample (from the RT thread; non-blocking).
// ─────────────────────────────────────────────────────────────────────────────

class NamProcessor {
public:
    struct IImpl {
        virtual ~IImpl() = default;
        virtual float process(float x) = 0;
        virtual void  reset()          = 0;
    };

    NamProcessor() = default;

    // LSTM: weight layout matches NeuralAmpModelerCore LSTMCell exactly.
    bool loadLstm(int numLayers, int inputSize, int hiddenSize,
                  const float* weights, int weightCount);

    // WaveNet (A2 compact format): kept for reference; not used by standard .nam files.
    bool loadWaveNet(int channels,
                     const int* kernelSizes, const int* dilations, int numLayers,
                     int headKernelSize,
                     const float* weights, int weightCount);

    // WaveNet (standard NeuralAmpModelerCore multi-group format).
    // Each group has its own channels/kernel/dilations/head config.
    // dilationCounts[g] = number of layers in group g.
    // flatDilations = all per-layer dilations concatenated (Σ dilationCounts[g] elements).
    bool loadWaveNetGroups(int numGroups,
                           const int* groupChannels,
                           const int* groupKernelSizes,
                           const int* groupHeadSizes,
                           const int* groupHeadBias,   // 0/1 per group
                           const int* dilationCounts,
                           const int* flatDilations,
                           float headScale,
                           const float* weights, int weightCount);

    float process(float x);
    void  reset();
    bool  isLoaded() const { return impl_ != nullptr; }

private:
    std::unique_ptr<IImpl> impl_;
};
