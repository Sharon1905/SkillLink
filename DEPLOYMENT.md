# SkillLink Railway Deployment Guide

## Prerequisites

1. Install Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```

2. Login to Railway:
   ```bash
   railway login
   ```

## Backend Deployment

### 1. Initialize Railway Project
```bash
cd backend
railway init
```

### 2. Set Environment Variables
```bash
railway variables set MONGO_URL="your-mongodb-atlas-url"
railway variables set MONGO_DB_NAME="versatile_db"
railway variables set SECRET_KEY="your-super-secret-key"
```

### 3. Deploy Backend
```bash
railway up
```

### 4. Get Backend URL
```bash
railway domain
```

## Frontend Deployment

### 1. Initialize Railway Project
```bash
cd frontend
railway init
```

### 2. Set Environment Variables
Replace `YOUR_BACKEND_URL` with the backend URL from step 4 above:
```bash
railway variables set VITE_API_BASE_URL="YOUR_BACKEND_URL"
```

### 3. Deploy Frontend
```bash
railway up
```

### 4. Get Frontend URL
```bash
railway domain
```

## Environment Variables

### Backend (.env)
```
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/database
MONGO_DB_NAME=versatile_db
SECRET_KEY=your-super-secret-key-here
PORT=8000
```

### Frontend (.env)
```
VITE_API_BASE_URL=https://your-backend-url.railway.app
```

## Database Setup

1. Create a MongoDB Atlas cluster
2. Get your connection string
3. Set the MONGO_URL environment variable in Railway

## Troubleshooting

### Backend Issues
- Check Railway logs: `railway logs`
- Verify environment variables: `railway variables`
- Test database connection locally

### Frontend Issues
- Check build logs: `railway logs`
- Verify API URL is correct
- Test API endpoints manually

## Local Development

### Backend
```bash
cd backend/app
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend
```bash
cd frontend
npm run dev
```

## API Endpoints

- Backend: `https://your-backend-url.railway.app`
- Frontend: `https://your-frontend-url.railway.app`
- API Docs: `https://your-backend-url.railway.app/docs` 