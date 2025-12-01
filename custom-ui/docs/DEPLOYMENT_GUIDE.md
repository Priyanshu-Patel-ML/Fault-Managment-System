# Deployment Guide - Complete Reference

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Local Deployment](#local-deployment)
3. [Docker Deployment](#docker-deployment)
4. [Cloud Deployment](#cloud-deployment)
5. [Production Optimization](#production-optimization)
6. [Monitoring and Logging](#monitoring-and-logging)
7. [Backup and Recovery](#backup-and-recovery)

## Pre-Deployment Checklist

### Security Checklist

- [ ] Change default Airflow credentials
- [ ] Use strong passwords (16+ characters)
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Set NODE_ENV=production
- [ ] Remove .env from version control
- [ ] Use environment variables for secrets
- [ ] Enable rate limiting
- [ ] Add security headers
- [ ] Implement authentication (if needed)
- [ ] Review and minimize API permissions
- [ ] Enable firewall rules
- [ ] Use reverse proxy (nginx/Apache)
- [ ] Implement logging and monitoring
- [ ] Set up error tracking

### Performance Checklist

- [ ] Build frontend for production
- [ ] Enable gzip compression
- [ ] Configure caching headers
- [ ] Optimize images and assets
- [ ] Minify JavaScript and CSS
- [ ] Use CDN for static assets (optional)
- [ ] Configure connection pooling
- [ ] Set appropriate timeouts
- [ ] Enable HTTP/2
- [ ] Implement request throttling

### Infrastructure Checklist

- [ ] Provision servers/containers
- [ ] Configure load balancer (if needed)
- [ ] Set up database (if adding persistence)
- [ ] Configure DNS records
- [ ] Set up SSL certificates
- [ ] Configure backup strategy
- [ ] Set up monitoring tools
- [ ] Configure log aggregation
- [ ] Test disaster recovery
- [ ] Document deployment process

## Local Deployment

### Development Setup

**Step 1: Install Dependencies**
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

**Step 2: Configure Environment**
```bash
# Create .env file
cd backend
cp .env.example .env

# Edit .env with your settings
nano .env
```

**Step 3: Start Services**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

**Step 4: Verify**
```bash
# Check backend health
curl http://localhost:3001/health

# Check frontend
open http://localhost:3000
```

### Production Build (Local)

**Step 1: Build Frontend**
```bash
cd frontend
npm run build
```

This creates `frontend/dist/` with optimized files.

**Step 2: Serve Frontend from Backend**

Edit `backend/server.js`:
```javascript
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ... existing code ...

// Serve static files from frontend build
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Handle React routing - serve index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

**Step 3: Start Production Server**
```bash
cd backend
NODE_ENV=production npm start
```

**Step 4: Access Application**
```
http://localhost:3001
```

## Docker Deployment

### Dockerfile for Backend

**File**: `backend/Dockerfile`
```dockerfile
# Use Node.js LTS version
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Expose port
EXPOSE 3001

# Set environment to production
ENV NODE_ENV=production

# Start application
CMD ["node", "server.js"]
```

### Dockerfile for Frontend

**File**: `frontend/Dockerfile`
```dockerfile
# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY . .

# Build application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files to nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

### Nginx Configuration

**File**: `frontend/nginx.conf`
```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # API proxy
    location /api {
        proxy_pass http://backend:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # React routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Docker Compose

**File**: `docker-compose.yml`
```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: airflow-ui-backend
    ports:
      - "3001:3001"
    environment:
      - AIRFLOW_BASE_URL=${AIRFLOW_BASE_URL}
      - AIRFLOW_USERNAME=${AIRFLOW_USERNAME}
      - AIRFLOW_PASSWORD=${AIRFLOW_PASSWORD}
      - PORT=3001
      - NODE_ENV=production
    restart: unless-stopped
    networks:
      - airflow-ui-network
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: airflow-ui-frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - airflow-ui-network

networks:
  airflow-ui-network:
    driver: bridge
```

### Environment File for Docker

**File**: `.env` (in root directory)
```env
AIRFLOW_BASE_URL=http://airflow-webserver:8080
AIRFLOW_USERNAME=admin
AIRFLOW_PASSWORD=your_secure_password
```

### Build and Run with Docker

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild and restart
docker-compose up -d --build
```

### Docker Commands

```bash
# Check running containers
docker ps

# View backend logs
docker logs airflow-ui-backend

# View frontend logs
docker logs airflow-ui-frontend

# Execute command in container
docker exec -it airflow-ui-backend sh

# Restart specific service
docker-compose restart backend

# Remove all containers and volumes
docker-compose down -v
```
