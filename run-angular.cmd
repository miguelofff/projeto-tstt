@echo off
set "NODE_DIR=%~dp0node-portable\node-v24.19.0-win-x64"
cd /d "%~dp0"
set "PATH=%NODE_DIR%;%PATH%"
"%NODE_DIR%\node.exe" -v
call "%NODE_DIR%\npm.cmd" -v
if not exist "node_modules\.bin\ng.cmd" (
	echo Installing project dependencies...
	call "%NODE_DIR%\npm.cmd" ci
	if errorlevel 1 (
		echo Dependency installation failed.
		pause
		exit /b 1
	)
)
echo Starting Angular...
call "%NODE_DIR%\npm.cmd" start
pause

cd C:\Users\rosa.miguel\projeto-tst-main
run-angular.cmd
