if(NOT TARGET oboe::oboe)
add_library(oboe::oboe SHARED IMPORTED)
set_target_properties(oboe::oboe PROPERTIES
    IMPORTED_LOCATION "C:/Users/bryan/.gradle/caches/transforms-4/ca50b5259ef20d07ed60eea69594e85e/transformed/oboe-1.9.3/prefab/modules/oboe/libs/android.x86_64/liboboe.so"
    INTERFACE_INCLUDE_DIRECTORIES "C:/Users/bryan/.gradle/caches/transforms-4/ca50b5259ef20d07ed60eea69594e85e/transformed/oboe-1.9.3/prefab/modules/oboe/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

