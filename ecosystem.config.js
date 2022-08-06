module.exports = {
  apps: [
    {
      name: 'nescii-backend',
      cwd: '/home/ubuntu/documents/nescii/backend',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production'
      },
    },
  ],
};
