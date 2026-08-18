module.exports = {
  apps: [
    {
      name: "smarttravel-web",
      script: ".output/server/index.mjs",
      cwd: __dirname,
      interpreter: "node",
      node_args: "--dns-result-order=ipv4first --env-file-if-exists=.env",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      time: true,
      env: {
        NODE_ENV: "production",
        HOST: "0.0.0.0",
        PORT: 5023,
        GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
      },
    },
  ],
};





