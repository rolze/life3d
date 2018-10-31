@echo off
intro.exe
echo.
choice "Besitzt der Computer einen Koprozessor "
cls
echo LOADING LIFE 3D...
if errorlevel=2 goto life286
if errorlevel=1 goto life486
:life286
life286.exe
goto ende
:life486
life486.exe
goto ende
:ende

