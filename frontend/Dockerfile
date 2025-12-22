FROM node:20-alpine AS builder

WORKDIR /app

# Копируем package файлы
COPY package.json package-lock.json ./
COPY vite.config.js ./

# Устанавливаем зависимости
RUN npm ci

# Копируем исходный код frontend
COPY frontend/ ./frontend/

# Собираем приложение с переменными окружения для Docker
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

# Production stage
FROM nginx:alpine

# Копируем собранные файлы
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# Копируем конфигурацию nginx
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 5173

CMD ["nginx", "-g", "daemon off;"]

