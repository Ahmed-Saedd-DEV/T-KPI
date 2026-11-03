FROM node:22-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

# Migrations and initial admin creation are intentionally manual.
# docker compose -f docker-compose.production.yml exec app npx prisma migrate deploy
# docker compose -f docker-compose.production.yml exec -it app node scripts/bootstrap-admin.js

EXPOSE 3000
CMD ["npm", "start"]
