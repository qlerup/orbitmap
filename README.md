# OrbitMap

OrbitMap is a self-hosted roadmap and project-planning application for keeping multiple products, ideas, bugs, and features in one place. It provides per-application Kanban boards as well as a global roadmap view.

The interface is currently in Danish.

## Features

- Organize roadmap items by application
- Kanban workflow with backlog, planned, in-progress, and done states
- Idea, bug, and feature item types
- Low, medium, and high priorities
- Drag-and-drop ordering
- Global roadmap across all applications
- Single-user authentication with Argon2 password hashing
- Login rate limiting and temporary account lockout
- PostgreSQL persistence
- Docker-based production deployment

## Technology

- Next.js 15 and React 19
- TypeScript and Tailwind CSS
- PostgreSQL 16
- Docker Compose

## Quick start with Docker

### Requirements

- Docker Engine
- Docker Compose v2

### 1. Clone the repository

```bash
git clone https://github.com/qlerup/orbitmap.git
cd orbitmap
```

### 2. Configure the environment

Copy the example environment file:

```bash
cp .env.example .env
```

Set a strong database password and JWT secret in `.env`:

```dotenv
DB_PASSWORD=replace_with_a_strong_database_password
JWT_SECRET=replace_with_a_long_random_secret
```

You can generate a suitable JWT secret with OpenSSL:

```bash
openssl rand -base64 64
```

Never commit `.env`. It is excluded by the repository's `.gitignore`.

### 3. Start OrbitMap

```bash
docker compose up -d --build
```

OrbitMap will be available at:

```text
http://localhost:3005
```

### 4. Create the account

Open `http://localhost:3005/setup` and create the initial account. OrbitMap is designed as a single-user application, so the setup route is disabled after the first account has been created.

## Managing the deployment

View container status:

```bash
docker compose ps
```

Follow application logs:

```bash
docker compose logs -f app
```

Stop the application:

```bash
docker compose down
```

Update to the newest version:

```bash
git pull
docker compose up -d --build
```

PostgreSQL data is stored in the Docker volume `postgres_data`. Running `docker compose down` preserves the volume; running it with `-v` deletes the database.

## Reverse proxy

OrbitMap listens on port `3005` on the Docker host. Point your reverse proxy or Cloudflare Tunnel at:

```text
http://YOUR_SERVER_IP:3005
```

TLS should normally terminate at the reverse proxy.

## FjordHub integration

OrbitMap can be installed directly from FjordHub. A FjordHub-managed installation automatically receives its database and session secrets, registers the installing user as an OrbitMap administrator, and enables shared user access and single sign-on.

When managed by FjordHub:

- users and OrbitMap access are managed in FjordHub;
- opening OrbitMap from FjordHub signs the user in with a short-lived SSO token;
- direct login uses the same FjordHub username and password;
- OrbitMap's standalone first-user setup is disabled.

Standalone installations continue to use OrbitMap's built-in account setup and authentication.

## Local development

Run PostgreSQL separately and provide `DATABASE_URL` and `JWT_SECRET` to the application environment. Then start the Next.js development server:

```bash
cd app
npm install
npm run dev
```

The production build can be validated with:

```bash
npm run build
```

## Project structure

```text
orbitmap/
├── app/                 Next.js application
├── db/init.sql          Initial PostgreSQL schema
├── docker-compose.yml   Application and database services
└── .env.example         Environment variable template
```

## Security notes

- Use unique, randomly generated values for `DB_PASSWORD` and `JWT_SECRET`.
- Do not expose PostgreSQL directly to the internet.
- Put public deployments behind HTTPS.
- Back up the PostgreSQL volume regularly.
- Rotate secrets immediately if they are ever committed or shared publicly.

## License

No license has been granted. All rights are reserved by the repository owner unless a license is added later.
