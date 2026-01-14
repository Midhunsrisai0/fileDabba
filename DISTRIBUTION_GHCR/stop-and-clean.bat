@echo off
echo Stopping containers...
docker compose down

echo.
echo Cleaning up unused images and build cache...
:: This removes images that aren't running and the build cache
docker system prune -a -f
docker builder prune -a -f

echo.
echo --- DISK USAGE REPORT ---
:: This shows internal Docker usage (Images vs Volumes)
docker system df

echo.
echo Done! Your database and uploads are safe.
pause