# Deployment Guide: GitHub & Render.com (Frontend / Backend Separation)

This guide walks you through publishing this portfolio project to **GitHub** and hosting it on **Render.com** with a decoupled **Static Site (Frontend)** and **Web Service (Backend API)** architecture.

---

## Architecture Overview

```
                          ┌───────────────────────────┐
                          │   GitHub Repository       │
                          │   (Contains render.yaml)  │
                          └─────────────┬─────────────┘
                                        │
                    ┌───────────────────┴───────────────────┐
                    ▼                                       ▼
    ┌───────────────────────────────┐       ┌───────────────────────────────┐
    │  RENDER STATIC SITE           │       │  RENDER WEB SERVICE           │
    │  (Frontend React SPA)         │       │  (Backend Express API)        │
    ├───────────────────────────────┤       ├───────────────────────────────┤
    │ • Global CDN                  │       │ • Node.js runtime             │
    │ • Build: npm run build:client │       │ • Build: npm run build:server │
    │ • Publish Dir: dist           │       │ • Start: npm run start:server │
    │ • Routes: /* -> /index.html   │       │ • Health: /api/health         │
    │ • Env: VITE_API_URL           │◄──────┤ • CORS enabled                │
    └───────────────────────────────┘       └───────────────────────────────┘
```

---

## Step 1: Export Project to GitHub

### Option A: Direct AI Studio Export (Fastest)
1. In Google AI Studio, click the **Settings / More Options** menu (top right).
2. Select **Export to GitHub** (or **Download ZIP**).
3. Connect your GitHub account and choose your new repository name.

### Option B: Push via Git Terminal
If you download or clone the files locally:
```bash
# 1. Initialize git repository
git init

# 2. Add all files
git add .

# 3. Create initial commit
git commit -m "feat: complete portfolio with separated frontend & backend for Render"

# 4. Set main branch
git branch -M main

# 5. Link your GitHub remote repository (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# 6. Push to GitHub
git push -u origin main
```

---

## Step 2: Deploy to Render.com

You have two simple ways to deploy on Render:

### Method 1: Automatic 1-Click Render Blueprint (Recommended)
This repository includes a pre-configured `render.yaml` blueprint.

1. Go to [dashboard.render.com](https://dashboard.render.com/).
2. Click **New +** in the top navigation bar and choose **Blueprint**.
3. Connect your GitHub repository.
4. Render will detect `render.yaml` and automatically create **two services**:
   - **`portfolio-frontend`** (Static Site)
   - **`portfolio-backend`** (Web Service)
5. Click **Apply**. Render will build and deploy both services automatically!

---

### Method 2: Manual Setup on Render

If you prefer to configure each service manually in the Render dashboard:

#### 1. Deploy the Backend (Web Service)
1. In Render Dashboard, click **New +** > **Web Service**.
2. Select your GitHub repository.
3. Configure the settings:
   - **Name**: `portfolio-backend`
   - **Language**: `Node`
   - **Branch**: `main`
   - **Build Command**: `npm run build:server`
   - **Start Command**: `npm run start:server`
   - **Health Check Path**: `/api/health`
4. In **Environment Variables**, add:
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
5. Click **Deploy Web Service**.
6. Once deployed, copy your backend URL (e.g., `https://portfolio-backend.onrender.com`).

#### 2. Deploy the Frontend (Static Site)
1. In Render Dashboard, click **New +** > **Static Site**.
2. Select the same GitHub repository.
3. Configure the settings:
   - **Name**: `portfolio-frontend`
   - **Branch**: `main`
   - **Build Command**: `npm run build:client`
   - **Publish Directory**: `dist`
4. In **Redirects / Rewrites**:
   - **Type**: `Rewrite`
   - **Source**: `/*`
   - **Destination**: `/index.html`
   *(This ensures client-side routing like `/projects`, `/about`, `/admin` works on page refresh).*
5. In **Environment Variables**, add:
   - `VITE_API_URL`: `https://portfolio-backend.onrender.com` (your backend URL from Step 1)
   - Add your Firebase client config variables if using a custom Firebase project (see `.env.example`).
6. Click **Deploy Static Site**.

---

## Available NPM Scripts

- `npm run dev`: Boots local development server with Vite middleware on port 3000.
- `npm run build:client`: Compiles the frontend React SPA into `dist/`.
- `npm run build:server`: Compiles the backend Express server into a standalone `dist/server.cjs` bundle.
- `npm run start:server`: Launches the compiled backend server.
- `npm run build`: Builds both frontend and backend for full-stack containers.

---

## Verifying Your Deployment

1. **Backend Health Check**:
   Visit `https://YOUR_BACKEND.onrender.com/api/health`
   You should receive:
   ```json
   {
     "status": "ok",
     "service": "portfolio-backend-api",
     "uptime": 12,
     "environment": "production"
   }
   ```

2. **Frontend Portfolio**:
   Visit `https://YOUR_FRONTEND.onrender.com`
   Navigate across pages to confirm client-side routing works smoothly.
