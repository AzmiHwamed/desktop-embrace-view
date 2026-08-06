module.exports = {
  apps: [
    {
      name: "smarttravel-web",
      script: ".output/server/index.mjs",
      cwd: __dirname,
      interpreter: "node",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      time: true,
      env: {
        NODE_ENV: "production",
        HOST: "127.0.0.1",
        PORT: 3001,
      },
    },
  ],
};
