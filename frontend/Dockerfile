FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./l
RUN npm ci

# Copy source
COPY . .

# Build the frontend
RUN npm run build

# Install a simple static file server
RUN npm install -g serve

# Serve the built files
CMD ["serve", "-s", "dist", "-l", "3000"]