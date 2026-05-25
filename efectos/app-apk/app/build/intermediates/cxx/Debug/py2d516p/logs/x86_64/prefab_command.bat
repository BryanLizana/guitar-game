@echo off
"C:\\Program Files\\Eclipse Adoptium\\jdk-21.0.11.10-hotspot\\bin\\java" ^
  --class-path ^
  "C:\\Users\\bryan\\.gradle\\caches\\modules-2\\files-2.1\\com.google.prefab\\cli\\2.1.0\\aa32fec809c44fa531f01dcfb739b5b3304d3050\\cli-2.1.0-all.jar" ^
  com.google.prefab.cli.AppKt ^
  --build-system ^
  cmake ^
  --platform ^
  android ^
  --abi ^
  x86_64 ^
  --os-version ^
  29 ^
  --stl ^
  c++_shared ^
  --ndk-version ^
  28 ^
  --output ^
  "C:\\Users\\bryan\\AppData\\Local\\Temp\\agp-prefab-staging12050241905537490024\\staged-cli-output" ^
  "C:\\Users\\bryan\\.gradle\\caches\\transforms-4\\ca50b5259ef20d07ed60eea69594e85e\\transformed\\oboe-1.9.3\\prefab"
