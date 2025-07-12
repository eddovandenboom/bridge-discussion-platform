FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Build
RUN npm run build

# Caddy will serve the static files via volume mount
CMD ["echo", "Frontend built - static files ready for Caddy"]