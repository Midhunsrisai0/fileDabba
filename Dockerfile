# -------- BUILD STAGE --------
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install --production=false

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

# -------- RUNTIME STAGE --------
FROM node:20-alpine

WORKDIR /app

# Copy only what is needed to RUN
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src ./src
COPY --from=builder /app/package.json ./package.json

RUN mkdir -p /app/uploads /app/backups

EXPOSE 1729

CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && node src/app.js"]