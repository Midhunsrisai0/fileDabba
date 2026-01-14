#!/bin/bash

echo "Stopping containers..."
docker compose down

echo ""
echo "Cleaning up unused images and build cache..."
docker system prune -a -f
docker builder prune -a -f

echo ""
echo "--- DISK USAGE REPORT ---"
docker system df

echo ""
echo "Done! Your database and uploads are safe."
