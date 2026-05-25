cmake_minimum_required(VERSION 3.22.1)
project(guitar-engine VERSION 1.0 LANGUAGES CXX)

find_package(oboe REQUIRED CONFIG)

add_library(guitar-engine SHARED
    src/main/cpp/AudioEngine.cpp
    src/main/cpp/AudioEngineRaw.cpp
    src/main/cpp/dsp/NamProcessor.cpp
    src/main/cpp/jni_bridge.cpp
)

target_include_directories(guitar-engine PRIVATE
    src/main/cpp
)

target_compile_features(guitar-engine PRIVATE cxx_std_17)

# Force optimisation even in debug builds — NAM requires vectorised code to run in real-time.
target_compile_options(guitar-engine PRIVATE -O3 -ffast-math)

# DspProcessor.cpp is #included by AudioEngine.cpp (single-TU pattern)
# so it is NOT listed separately here to avoid duplicate symbol errors.

target_link_libraries(guitar-engine
    oboe::oboe
    log
    android
)
