#pragma once
#include <oboe/Oboe.h>
#include <atomic>
#include <memory>
#include <vector>

// Minimal diagnostic passthrough — NO ring buffer, NO resampler, NO DSP.
// Output callback calls inputStream->read() directly (non-blocking pull model).
// Use to determine whether saturation originates before any of our processing.
class AudioEngineRaw : public oboe::AudioStreamErrorCallback {
public:
    AudioEngineRaw()  = default;
    ~AudioEngineRaw() { stop(); }

    bool start(int32_t sampleRate, int32_t framesPerBurst, int32_t inputDeviceId);
    void stop();
    bool isRunning() const { return running_.load(); }

    // Called by the JNI bridge's output-stream data callback shim.
    oboe::DataCallbackResult onOutputReady(void* data, int32_t frames);

    void onErrorAfterClose(oboe::AudioStream* stream, oboe::Result error) override;

private:
    // Shim: the output stream needs a DataCallback object — we use this inner class
    // so AudioEngineRaw itself doesn't inherit from AudioStreamDataCallback
    // (which would require exposing onAudioReady to both streams).
    struct OutputCb : public oboe::AudioStreamDataCallback {
        AudioEngineRaw* engine = nullptr;
        oboe::DataCallbackResult onAudioReady(
            oboe::AudioStream*, void* data, int32_t frames) override {
            return engine->onOutputReady(data, frames);
        }
    } outputCb_;

    std::shared_ptr<oboe::AudioStream> inputStream_;
    std::shared_ptr<oboe::AudioStream> outputStream_;
    std::vector<float>                 scratch_;
    std::atomic<bool>                  running_{false};
};
