module.exports = {
  apps: [
    {
      name: 'bridge-discussion-backend',
      script: 'backend/dist/index.js',
      cwd: process.env.APP_ROOT,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        SESSION_SECRET: process.env.SESSION_SECRET
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true
    },
    {
      name: 'bridge-hand-viewer',
      script: 'npm',
      args: 'run serve:bg',
      cwd: process.env.BRIDGE_VIEWER_PATH,
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