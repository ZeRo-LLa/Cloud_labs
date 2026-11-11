FROM node:20.18-alpine3.20

WORKDIR /app

# Спочатку лише файли залежностей: цей шар кешується, поки вони не змінились
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Потім код застосунку
COPY src ./src
COPY data ./data

# Хеш коміту, з якого зібрано образ (передає CI). Стоїть після npm ci, щоб не ламати кеш шарів
ARG GIT_SHA=dev

ENV NODE_ENV=production \
    PORT=5005 \
    GIT_SHA=$GIT_SHA

# Процес працює не від root (користувач node є в образі)
USER node

EXPOSE 5005

CMD ["node", "src/server.js"]
