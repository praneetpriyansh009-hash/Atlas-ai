@echo off
echo Starting server... > server.log
npm run dev >> server.log 2>&1
