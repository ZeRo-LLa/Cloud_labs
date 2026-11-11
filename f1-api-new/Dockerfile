FROM node:20.18-alpine3.20

WORKDIR /app

# Спочатку лише файли залежностей: цей шар кешується, поки вони не змінились
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Потім код застосунку
COPY src ./src
COPY data ./data

ENV NODE_ENV=production \
    PORT=5005

# Процес працює не від root (користувач node є в образі)
USER node

EXPOSE 5005

CMD ["node", "src/server.js"]
