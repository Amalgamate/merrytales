# MerryTales Docker deployment

This stack creates a new, isolated PostgreSQL database for MerryTales. It does not connect to or modify the TrendScore database.

## First deployment

```bash
git clone https://github.com/Amalgamate/merrytales.git
cd merrytales
cp .env.production.example .env
# Replace all CHANGE_ME values and set WEB_ORIGIN to the public HTTPS URL.
docker compose config
docker compose up -d --build
docker compose ps
curl http://127.0.0.1:8080/api/health
```

The API automatically runs `prisma migrate deploy` before starting. Database data lives in the named `merrytales_db` volume and uploads live in `merrytales_uploads`. PostgreSQL is available only to containers on the private backend network; it is not published on the host.

Optional M-Pesa and MobileSasa values are intentionally excluded from the base Compose file. Add them under the API service through a production override file only when real credentials are available; do not set schema-validated optional values to empty strings.

## Host reverse proxy

Route the public domain to `127.0.0.1:8080`. Example Nginx site:

```nginx
server {
    server_name merrytales.co.ke www.merrytales.co.ke;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Use the server's existing Certbot or Caddy setup to issue HTTPS certificates.

## Database backup

```bash
mkdir -p backups
docker compose exec -T db pg_dump -U merrytales -d merrytales -Fc > backups/merrytales-$(date +%F-%H%M).dump
```

Copy backups off the server and test restoration regularly. To restore into an empty MerryTales database:

```bash
cat backups/FILE.dump | docker compose exec -T db pg_restore -U merrytales -d merrytales --clean --if-exists
```

## Updates

```bash
git pull --ff-only
docker compose up -d --build
docker compose ps
```

Do not run `docker compose down -v` in production: `-v` deletes the database and uploads volumes.
