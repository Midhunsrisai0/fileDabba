@echo off
docker load < filedabba-backend.tar
docker compose down && docker compose up -d
pause
