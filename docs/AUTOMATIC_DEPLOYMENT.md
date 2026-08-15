# Automatic production deployment

Every push to `main` deploys Merry Tales through GitHub Actions after the one-time setup below.

## Production host setup

The host must have Docker Compose, this repository checked out at a fixed path, a valid production `.env`, and read access to `origin`.

The Docker API image runs `prisma migrate deploy` before starting. Do not run local-only database credentials in production.

## GitHub environment secrets

Create a GitHub Environment named `production`, then add these secrets:

| Secret | Value |
| --- | --- |
| `DEPLOY_HOST` | Production server hostname or IP address |
| `DEPLOY_PORT` | SSH port, normally `22` |
| `DEPLOY_USER` | Restricted deployment user on the server |
| `DEPLOY_SSH_KEY` | Private SSH key for that user |
| `DEPLOY_KNOWN_HOSTS` | Host public key in `known_hosts` format |
| `DEPLOY_PATH` | Absolute path to the checked-out Merry Tales repository |

After setup, GitHub Actions runs `git pull --ff-only origin main`, rebuilds Docker Compose, applies all pending migrations during API startup, and checks `/api/health`.

Use the `production` environment’s approval rule if releases should require a human confirmation before the workflow reaches the server.
