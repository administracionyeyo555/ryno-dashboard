@echo off
REM ============================================================================
REM Git Metrics Sync - Windows Batch Script
REM ============================================================================
REM This script runs sync-metrics.js and logs the output.
REM Use this with Windows Task Scheduler for automation.
REM ============================================================================

cd /d "C:\Users\EQUIPO\Documents\CEREBRO FLOWMANDO 3"

REM Set log file with timestamp
set LOGFILE=logs\sync-metrics-%DATE:~-4%%DATE:~3,2%%DATE:~0,2%-%TIME:~0,2%%TIME:~3,2%.log

REM Create logs directory if it doesn't exist
if not exist "logs" mkdir logs

REM Run the sync script
echo Running Git Metrics Sync at %DATE% %TIME%
node scripts\sync-metrics.js >> %LOGFILE% 2>&1

REM Check exit code
if %ERRORLEVEL% EQU 0 (
    echo Sync completed successfully.
) else (
    echo Sync failed with error code %ERRORLEVEL%
)

exit /b %ERRORLEVEL%
