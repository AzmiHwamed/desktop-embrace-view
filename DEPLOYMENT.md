# VPS deployment with PM2

## Requirements

- Node.js 22 LTS
- PM2
- Nginx
- A domain pointing to the VPS

## First deployment

```bash
git clone <your-repository-url> smarttravel
cd smarttravel
npm ci
cp .env.example .env
nano .env
npm run build
npm run pm2:start
pm2 save
pm2 startup
```

Run the command printed by `pm2 startup`, then run `pm2 save` again. The app
listens publicly on `0.0.0.0:5023`, as configured in `ecosystem.config.cjs`.
You can reach it at `http://YOUR_VPS_IP:5023` after allowing the port through
your VPS firewall and hosting-provider security group.

`VITE_API_BASE_URL` is a build-time browser variable. Set it before every
production build. Do not use `localhost` unless the API runs in each visitor's
browser machine—which it normally does not.

## Google Places

Nearby exploration and receipt merchant matching are handled by the NestJS API.
Enable **Places API (New)** and set `GOOGLE_MAPS_API_KEY` only in the backend
`translate-app` environment. The frontend process does not need this key.

```bash
cd /home/ubuntu/translate-app
export GOOGLE_MAPS_API_KEY="your-key"
npm run build
pm2 restart <backend-pm2-name> --update-env
pm2 save
```

Current-location matching requires HTTPS in production. Browsers allow
geolocation on `localhost`, but block it on a plain `http://IP:port` page.

## Nginx

```nginx
server {
    listen 80;
    server_name app.example.com;

    client_max_body_size 12M;

    location / {
        proxy_pass http://127.0.0.1:5023;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Enable the site and HTTPS:

```bash
sudo ln -s /etc/nginx/sites-available/smarttravel /etc/nginx/sites-enabled/smarttravel
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d app.example.com
```

## Updating

```bash
cd smarttravel
git pull --ff-only
npm ci
npm run build
npm run pm2:reload
pm2 save
```

## Useful commands

```bash
pm2 status
pm2 logs smarttravel-web
pm2 monit
curl -I http://127.0.0.1:5023
```

For Ubuntu with UFW, expose the direct IP port with:

```bash
sudo ufw allow 5023/tcp
sudo ufw status
```

If Firebase OAuth is enabled, add the production domain to Firebase
Authentication's authorized domains. Facebook/Google redirect URLs must also
match the production Firebase callback configuration.
