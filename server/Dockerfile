FROM node:22-alpine
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

# Manual migration execution must be approved and run explicitly outside normal startup.
# Example: docker compose exec app npx prisma migrate deploy
# Manual admin bootstrap must be run interactively and explicitly when needed.
# Example: docker compose exec -it app node scripts/bootstrap-admin.js

EXPOSE 3000
CMD ["npm", "start"]