# Deployment Guide

Simple Docker + Caddy deployment for Bridge Discussion app.

## Prerequisites

- Ubuntu/Debian server with sudo access
- Docker and Docker Compose installed
- Domain name pointed to your server (optional)

## Quick Deploy

### 1. Clone and Configure

```bash
git clone <your-repo-url> bridge-discussion-platform
cd bridge-discussion-platform
cp .env.example .env
# Edit .env with your values (especially SESSION_SECRET)
nano .env
```

### 2. Deploy

```bash
# Start Docker services
docker compose up -d --build
```

## Access

- **Production**: `https://yourdomain.com`
- **Local testing**: `http://localhost`

## Management

```bash
# View logs
docker compose -f docker-compose.prod.yml logs -f

# Restart services
docker compose -f docker-compose.prod.yml restart

# Stop services
docker compose -f docker-compose.prod.yml down

# Update deployment
git pull
docker compose -f docker-compose.prod.yml up -d --build
sudo systemctl restart caddy
```

## Troubleshooting

- **Port 80 issues**: Caddy runs as root and handles port 80
- **SSL issues**: Caddy automatically manages Let's Encrypt certificates
- **Service issues**: Check `docker compose ps` and logs