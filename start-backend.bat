@echo off
echo Starting Street Map Backend Server...
echo.

REM 设置 JAVA_HOME（根据你的实际安装路径调整）
set JAVA_HOME=D:\study\Java
set PATH=%JAVA_HOME%\bin;%PATH%

REM 检查 Java 是否正确安装
java -version
if %errorlevel% neq 0 (
    echo Error: Java is not properly installed or JAVA_HOME is not set correctly.
    echo Please make sure Java is installed and JAVA_HOME points to your Java installation directory.
    pause
    exit /b 1
)

echo Java version check passed.
echo.

REM 使用 Maven 构建并运行项目
echo Building and starting the application...
call mvn clean compile exec:java -Dexec.mainClass="com.streetmap.backend.StreetMapBackendApplication" -Dexec.args="%*"

pause