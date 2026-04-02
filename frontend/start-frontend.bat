@echo off
echo Starting Street Map Frontend Server...
echo.

REM 检查 Node.js 是否安装
node --version
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js version check passed.
echo.

REM 检查是否已安装依赖
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo Error: Failed to install dependencies.
        pause
        exit /b 1
    )
)

echo Dependencies are ready.
echo.

REM 启动前端开发服务器
echo Starting frontend development server...
npm run dev

pause