@echo off
docker compose pull
docker compose down && docker compose up -d
pause
