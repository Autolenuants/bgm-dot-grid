FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi
COPY . .
RUN mkdir -p /app/image_cache /app/bgmdata_cache && chmod 777 /app/image_cache /app/bgmdata_cache
EXPOSE 3000 3001 3002
CMD ["node", "index.js"]
