@echo off
REM PromptX MCP Server Startup Script for Windows
REM This script starts the PromptX MCP server in stdio mode

REM Get the directory where the script is located
set SCRIPT_DIR=%~dp0
REM Remove trailing backslash
set SCRIPT_DIR=%SCRIPT_DIR:~0,-1%

REM Navigate to project root (parent of scripts directory)
cd /d "%SCRIPT_DIR%\.."

REM Check if node is available
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    exit /b 1
)

REM Check if promptx command exists
if not exist "src\bin\promptx.js" (
    echo Error: promptx.js not found
    echo Please make sure you're in the PromptX project directory
    exit /b 1
)

REM Start the MCP server
echo Starting PromptX MCP Server in stdio mode...
node src\bin\promptx.js mcp-server

REM If the server exits, pause to see any error messages
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo MCP Server exited with error code %ERRORLEVEL%
    pause
)