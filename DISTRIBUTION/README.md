# FileDabba Distribution (Local Image)

This distribution package runs FileDabba using a **pre-built Docker image** from a local tar file.

## 📦 What's Included

- `docker-compose.yml` - Container configuration
- `start.bat` - Windows startup script
- `start.sh` - Linux/Mac startup script
- `stop-and-clean.bat` - Windows cleanup script
- `.env` - Environment configuration
- `filedabba-backend.tar` - Pre-built application image (required)

## 🚀 Quick Start

### Windows

1. **Double-click** `start.bat`
2. Wait for the containers to start
3. Access FileDabba at: **http://localhost:1729**

### Linux/Mac

```bash
chmod +x start.sh
./start.sh
```

## 🛑 Stopping the Application

### Windows

Double-click `stop-and-clean.bat`

### Linux/Mac

```bash
docker compose down
```

## 📋 What the Start Script Does

1. Stops any running containers
2. Cleans up old Docker images and cache
3. **Loads the application image** from `filedabba-backend.tar`
4. Starts all services (app, database, Redis, RedisInsight)

## 🔧 Services & Ports

| Service       | Port | Description            |
| ------------- | ---- | ---------------------- |
| FileDabba API | 1729 | Main application       |
| Prisma Studio | 5555 | Database management UI |
| RedisInsight  | 5540 | Redis monitoring UI    |

## 📝 Important Notes

- **Required file:** Make sure `filedabba-backend.tar` exists in this folder
- The start script will remove all unused Docker images to save space
- Your data is preserved in Docker volumes (uploads, backups, database)

## 🆘 Troubleshooting

### "Error: no such file" when loading tar

- Ensure `filedabba-backend.tar` is in the DISTRIBUTION folder

### Port already in use

- Stop other applications using ports 1729, 5555, or 5540
- Or modify ports in `docker-compose.yml`

### Containers won't start

- Check Docker Desktop is running
- Run `docker compose logs` to see error messages

## 🔄 Updating

To update to a new version:

1. Replace `filedabba-backend.tar` with the new version
2. Run `start.bat` (or `start.sh`)
