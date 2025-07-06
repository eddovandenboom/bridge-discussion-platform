module.exports = {
  apps: [
    {
      name: 'bridge-discussion-backend',
      script: 'backend/dist/index.js',
      cwd: '/home/eddo/Projects/bridge-discussion-simple',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        DATABASE_URL: 'file:./backend/prisma/prod.db',
        SESSION_SECRET: process.env.SESSION_SECRET || 'change-this-in-production'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
        DATABASE_URL: 'file:./backend/prisma/prod.db',
        SESSION_SECRET: process.env.SESSION_SECRET || 'change-this-in-production'
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true
    },
    {
      name: 'bridge-hand-viewer',
      script: 'cd /home/eddo/Projects/bridge-hand-viewer && npm start',
      shell: true,
      cwd: '/home/eddo/Projects/bridge-hand-viewer',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3002
      },
      error_file: './logs/viewer-error.log',
      out_file: './logs/viewer-out.log',
      log_file: './logs/viewer-combined.log',
      time: true
    }
  ]
};