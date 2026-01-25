module.exports = {
  apps: [
    {
      name: 'swarmshield-keeper',
      cwd: '/home/ubuntu/swarmshield/keeper',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
