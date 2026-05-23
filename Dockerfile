FROM node:22-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=8080
ENV SAPPHIRE_NEXUS_HOST=0.0.0.0
ENV SAPPHIRE_NEXUS_PUBLIC_MODE=true

EXPOSE 8080

CMD ["node", "dist/server.js"]
