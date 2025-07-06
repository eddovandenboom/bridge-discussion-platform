# Bridge Discussion App - Deployment Guide

This guide covers deploying the Bridge Discussion App to a production server using PM2 and nginx.

## Prerequisites

- Node.js 18+ installed
- npm installed
- nginx installed
- A domain name (optional, can use IP address)

## Quick Deployment

1. **Clone and setup the application:**
   ```bash
   git clone <your-repo-url>
   cd bridge-discussion-simple
   ```

2. **Run the deployment script:**
   ```bash
   ./deploy.sh
   ```

3. **Configure nginx:**
   ```bash
   sudo cp nginx.conf /etc/nginx/sites-available/bridge-discussion
   sudo ln -s /etc/nginx/sites-available/bridge-discussion /etc/nginx/sites-enabled/
   sudo nginx -t  # Test configuration
   sudo systemctl reload nginx
   ```

4. **Edit environment variables:**
   ```bash
   nano .env
   # Set a secure SESSION_SECRET
   ```

## Manual Deployment Steps

### 1. Install Dependencies and Build

```bash
# Install all dependencies
npm run install:all

# Build for production
npm run build:prod
```

### 2. Database Setup

```bash
# Set up production database
cd backend
DATABASE_URL="file:./prisma/prod.db" npx prisma db push
DATABASE_URL="file:./prisma/prod.db" node prisma/seed.js
cd ..
```

### 3. Environment Configuration

```bash
# Copy environment template
cp .env.production .env

# Edit with your values
nano .env
```

**Important:** Change the `SESSION_SECRET` to a secure random string!

### 4. PM2 Process Management

```bash
# Install PM2 globally
npm install -g pm2

# Start services
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup auto-start on server boot
pm2 startup
```

### 5. Nginx Configuration

```bash
# Copy nginx configuration
sudo cp nginx.conf /etc/nginx/sites-available/bridge-discussion

# Enable the site
sudo ln -s /etc/nginx/sites-available/bridge-discussion /etc/nginx/sites-enabled/

# Edit the configuration file
sudo nano /etc/nginx/sites-available/bridge-discussion
# Update server_name with your domain

# Test nginx configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

## File Structure After Deployment

```
bridge-discussion-simple/
├── frontend/
│   └── dist/              # Built frontend files (served by nginx)
├── backend/
│   ├── dist/              # Compiled TypeScript backend
│   ├── prisma/
│   │   └── prod.db        # Production SQLite database
│   └── uploads/           # Uploaded PBN files
├── logs/                  # PM2 logs
├── ecosystem.config.js    # PM2 configuration
├── nginx.conf            # Nginx configuration template
└── .env                  # Production environment variables
```

## Service Management

### PM2 Commands

```bash
# Check status
pm2 status

# View logs
pm2 logs

# Restart all services
pm2 restart ecosystem.config.js

# Stop all services
pm2 stop ecosystem.config.js

# Delete all services
pm2 delete ecosystem.config.js

# Monitor processes
pm2 monit
```

### Nginx Commands

```bash
# Test configuration
sudo nginx -t

# Reload configuration
sudo systemctl reload nginx

# Restart nginx
sudo systemctl restart nginx

# Check status
sudo systemctl status nginx
```

## URL Structure

After deployment, your services will be available at:

- **Main App**: `http://your-domain.com/`
- **API**: `http://your-domain.com/api/*`
- **Uploads**: `http://your-domain.com/uploads/*`
- **Bridge Viewer**: `http://your-domain.com/viewer/*`

## SSL/HTTPS Setup (Optional)

### Using Let's Encrypt (Recommended)

1. **Install Certbot:**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   ```

2. **Obtain SSL certificate:**
   ```bash
   sudo certbot --nginx -d your-domain.com -d www.your-domain.com
   ```

3. **Auto-renewal:**
   ```bash
   sudo systemctl enable certbot.timer
   ```

### Manual SSL Configuration

1. Obtain SSL certificates from your provider
2. Uncomment HTTPS section in nginx.conf
3. Update certificate paths
4. Reload nginx

## Monitoring and Maintenance

### Log Files

- **PM2 Logs**: `./logs/`
- **Nginx Logs**: `/var/log/nginx/bridge-discussion-*.log`

### Database Backup

```bash
# Backup production database
cp backend/prisma/prod.db backend/prisma/prod.db.backup.$(date +%Y%m%d_%H%M%S)
```

### Updates and Deployments

```bash
# Pull latest code
git pull

# Rebuild and restart
npm run build:prod
pm2 restart ecosystem.config.js
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3001 and 3002 are available
2. **File permissions**: Check that the app can write to uploads/ and logs/
3. **Environment variables**: Verify .env file is properly configured
4. **Database issues**: Check that prod.db file exists and is writable

### Debug Commands

```bash
# Check if services are running
pm2 status
netstat -tlnp | grep -E ':(3001|3002|80|443)'

# View recent logs
pm2 logs --lines 50

# Test API directly
curl http://localhost:3001/api/health

# Test nginx configuration
sudo nginx -t
```

### Performance Tuning

1. **PM2 Clustering**: Update ecosystem.config.js to use more instances
2. **Nginx Caching**: Add caching rules for static assets
3. **Database Optimization**: Monitor database size and performance

## Security Considerations

1. **Firewall**: Configure firewall to only allow necessary ports
2. **Updates**: Keep Node.js, npm, and system packages updated
3. **Backup**: Regular database and file backups
4. **Monitoring**: Set up monitoring for service availability
5. **Session Secret**: Use a cryptographically secure random string

## Support

For issues and questions:
1. Check the logs first: `pm2 logs`
2. Verify nginx configuration: `sudo nginx -t`
3. Test services individually
4. Review this deployment guide

## Production Checklist

- [ ] Environment variables configured
- [ ] Secure SESSION_SECRET set
- [ ] Database initialized and seeded
- [ ] PM2 services running
- [ ] Nginx configured and running
- [ ] Domain/DNS configured
- [ ] SSL certificates installed (if using HTTPS)
- [ ] Firewall configured
- [ ] Backup strategy in place
- [ ] Monitoring setup