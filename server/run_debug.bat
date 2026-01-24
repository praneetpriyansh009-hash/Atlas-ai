@echo off
echo STARTING BACKEND... > debug.log
node index.js >> debug.log 2>&1
