@echo off
chcp 65001 >nul
title Hotel
cd /d "%~dp0"

taskkill /F /IM dotnet.exe >nul 2>&1
timeout /t 1 /nobreak >nul

start http://localhost:5156/login.html
dotnet run --no-launch-profile --project Hotel.csproj --urls "http://localhost:5156"

pause