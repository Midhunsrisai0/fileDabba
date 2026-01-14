docker build -t filedabba-backend:1.0 --no-cache .
docker save filedabba-backend:1.0 > filedabba-backend.tar
docker compose down && docker compose up -d
docker compose exec app npx prisma studio --hostname 0.0.0.0 --port 5555
docker compose down -v
docker system prune
