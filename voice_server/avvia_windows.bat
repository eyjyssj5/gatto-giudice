@echo off
cd /d "%~dp0.."
if not exist "voice_server\.venv\Scripts\python.exe" (
  py -3 -m venv voice_server\.venv
  if errorlevel 1 (
    echo Python 3 non trovato. Installa Python da python.org, poi riapri questo file.
    pause
    exit /b 1
  )
)
voice_server\.venv\Scripts\python.exe -m pip install -r voice_server\requirements.txt
if errorlevel 1 (
 echo Installazione non riuscita.
 pause
 exit /b 1
)
if "%VOICE_SHARED_SECRET%"=="" (
 echo Manca VOICE_SHARED_SECRET. Configuralo nel sistema o nel file avvia_configurato.bat privato.
 pause
 exit /b 1
)
echo Motore vocale avviato localmente su 127.0.0.1:8765
voice_server\.venv\Scripts\python.exe -m uvicorn voice_server.server:app --host 127.0.0.1 --port 8765
pause
