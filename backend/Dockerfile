FROM node:20-slim

WORKDIR /app/backend

# Install dependencies first
COPY backend/package*.json ./
RUN npm ci --omit=dev

# Copy application code
COPY backend/ ./

EXPOSE 3000

CMD ["npm", "start"]

