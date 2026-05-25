@rem Gradle wrapper for Windows
@rem Generated for GuitarEffects project

@if "%DEBUG%"=="" @echo off

set DIRNAME=%~dp0
if "%DIRNAME%"=="" set DIRNAME=.

set JAVA_EXE=java.exe

%JAVA_EXE% -version >NUL 2>&1
if "%ERRORLEVEL%"=="0" goto execute

echo ERROR: JAVA_HOME is not set and no 'java' command could be found.
exit /b 1

:execute
set CLASSPATH=%DIRNAME%gradle\wrapper\gradle-wrapper.jar

%JAVA_EXE% -classpath "%CLASSPATH%" org.gradle.wrapper.GradleWrapperMain %*
