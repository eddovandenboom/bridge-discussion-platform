#!/bin/bash

# Bridge Discussion App Deployment Script
# Run this script to deploy the application to production

set -e  # Exit on any error

echo "🚀 Starting Bridge Discussion App deployment..."

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 is not installed. Installing PM2..."
    npm install -g pm2
fi

# Create logs directory
mkdir -p logs

# Create uploads directory
mkdir -p backend/uploads/tournaments

# Stop existing PM2 processes (if any)
echo "🛑 Stopping existing processes..."
pm2 stop ecosystem.config.js 2>/dev/null || echo "No existing processes to stop"

# Create symlink for backend .env
echo "🔗 Creating environment symlink..."
ln -sf ../.env backend/.env

# Install dependencies and build
echo "📦 Installing dependencies and building..."
npm run build:prod

# Set up production database
echo "🗄️ Setting up production database..."
cd backend
npm run db:push:prod
# npm run db:seed:prod
cd ..

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating production environment file..."
    cp .env.example .env
    echo "⚠️  IMPORTANT: Edit .env file and set a secure SESSION_SECRET!"
fi

# Start services with PM2
echo "🚀 Starting services..."
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup

echo "✅ Deployment complete!"
echo ""
echo "🌐 Services running:"
echo "   - Backend API: http://localhost:3001"
echo "   - Bridge Hand Viewer: http://localhost:3002"
echo "   - Frontend: Served as static files (see nginx.conf)"
echo ""
echo "📋 Next steps:"
echo "   1. Configure nginx (see nginx.conf)"
echo "   2. Set up your domain DNS"
echo "   3. Obtain SSL certificates (optional)"
echo "   4. Edit .env file with secure SESSION_SECRET"
echo ""
echo "🔧 Useful commands:"
echo "   - Check status: pm2 status"
echo "   - View logs: pm2 logs"
echo "   - Restart: pm2 restart ecosystem.config.js"
echo "   - Stop: pm2 stop ecosystem.config.js"
