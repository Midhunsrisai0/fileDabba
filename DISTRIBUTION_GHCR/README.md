# FileDabba Distribution (GitHub Container Registry)

This distribution package runs FileDabba by **pulling the latest image** from GitHub Container Registry (GHCR).

## 📦 What's Included

- `docker-compose.yml` - Container configuration
- `start.bat` - Windows startup script
- `start.sh` - Linux/Mac startup script
- `stop-and-clean.bat` - Windows cleanup script
- `stop.sh` - Linux/Mac stop script
- `.env` - Environment configuration

## 🚀 Quick Start

### Windows

1. **Double-click** `start.bat`
2. Wait for the image to download and containers to start
3. Access FileDabba at: **http://localhost:1729**

### Linux/Mac

```bash
chmod +x start.sh
./start.sh
```

## 🛑 Stopping the Application

### Windows

- **Clean stop:** Double-click `stop-and-clean.bat` (removes containers and cleans up)
- **Simple stop:** Run `docker compose down` in terminal

### Linux/Mac

```bash
./stop.sh
```

## 📋 What the Start Script Does

1. Stops any running containers
2. Cleans up old Docker images and cache
3. **Pulls the latest image** from `ghcr.io/midhunsrisai0/filedabba-backend:latest`
4. Starts all services (app, database, Redis, RedisInsight)

## 🔧 Services & Ports

| Service       | Port | Description            |
| ------------- | ---- | ---------------------- |
| FileDabba API | 1729 | Main application       |
| Prisma Studio | 5555 | Database management UI |
| RedisInsight  | 5540 | Redis monitoring UI    |

## 🌐 Advantages of GHCR Distribution

✅ **Always up-to-date:** Pulls the latest version automatically  
✅ **No large files:** No need to distribute tar files  
✅ **Automatic updates:** Just restart to get the newest version  
✅ **Smaller download:** Only downloads changed layers

## 📝 Important Notes

- **Internet required:** First run needs internet to download the image (~200-500 MB)
- Subsequent runs only download updates (usually much smaller)
- Your data is preserved in Docker volumes (uploads, backups, database)

## 🆘 Troubleshooting

### "pull access denied" or "unauthorized" error

This means the image is private. You need to authenticate:

```bash
docker login ghcr.io
Username: your-github-username
Password: your-github-personal-access-token
```

### Slow download

- The first download is large but one-time
- Future updates only download changed parts

### Port already in use

- Stop other applications using ports 1729, 5555, or 5540
- Or modify ports in `docker-compose.yml`

### Containers won't start

- Check Docker Desktop is running
- Run `docker compose logs` to see error messages

## 🔄 Updating

To get the latest version:

1. Just run `start.bat` (or `start.sh`)
2. The script automatically pulls the newest image

Or manually:

```bash
docker compose pull
docker compose up -d
```

## 🔐 Environment Configuration

The `.env` file contains sensitive configuration. **Do not share** this file publicly.

To modify settings like ports or credentials, edit the `.env` file before running the start script.
