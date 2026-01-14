#!/bin/bash

docker load < filedabba-backend.tar
docker compose down && docker system prune -a -f && docker builder prune -a -f && docker compose up -d
