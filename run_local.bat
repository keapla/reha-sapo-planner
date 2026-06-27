@echo off
chcp 65001 > nul
echo ==========================================
echo   リハサポ ^| Planner ローカル起動スクリプト
echo ==========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js がインストールされていません。
    echo https://nodejs.org/ から Node.js をインストールして再実行してください。
    echo.
    pause
    exit /b 1
)

REM Install dependencies if node_modules doesn't exist
if not exist node_modules (
    echo [INFO] node_modules が見つかりません。セットアップを開始します...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] 依存関係のインストールに失敗しました。
        pause
        exit /b 1
    )
)

echo [INFO] ブラウザで http://localhost:3000 を開きます...
start http://localhost:3000

echo [INFO] ローカルサーバーを起動しています（終了するには Ctrl+C を押してください）...
call npm run dev

pause
