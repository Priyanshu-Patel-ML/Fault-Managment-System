# Custom Airflow UI - Setup Guide

This guide will walk you through setting up the Custom Airflow UI from scratch.

## Step-by-Step Setup

### Step 1: Verify Prerequisites

Make sure you have the following installed:

```bash
# Check Node.js version (should be v16+)
node --version

# Check npm version
npm --version
```

If Node.js is not installed, install it:
- **Ubuntu/Debian**: `sudo apt install nodejs npm`
- **macOS**: `brew install node`
- **Windows**: Download from https://nodejs.org/

### Step 2: Install Dependencies

#### Backend Setup

```bash
cd backend
npm install
```

This will install:
- express (web server)
- cors (cross-origin resource sharing)
- axios (HTTP client)
- dotenv (environment variables)
- body-parser (request parsing)

#### Frontend Setup

```bash
cd ../frontend
npm install
```

This will install:
- react & react-dom (UI framework)
- vite (build tool)
- axios (HTTP client)
- react-router-dom (routing)

### Step 3: Configure Airflow Connection

1. Make sure your Airflow instance is running
2. Verify Airflow REST API is accessible at `http://localhost:8080/api/v1/`
3. Update `backend/.env` with your Airflow credentials:

```env
AIRFLOW_BASE_URL=http://localhost:8080
AIRFLOW_USERNAME=your_airflow_username
AIRFLOW_PASSWORD=your_airflow_password
```

### Step 4: Test Airflow Connection

You can test if your Airflow API is accessible:

```bash
# Test with curl
curl -u admin:admin http://localhost:8080/api/v1/dags

# Or test with the backend health endpoint (after starting backend)
curl http://localhost:3001/health
```

### Step 5: Start the Application

#### Option A: Manual Start (Recommended for first time)

**Terminal 1 - Start Backend:**
```bash
cd backend
npm start
```

You should see:
```
Backend server running on port 3001
Proxying requests to Airflow at http://localhost:8080
```

**Terminal 2 - Start Frontend:**
```bash
cd frontend
npm run dev
```

You should see:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
```

#### Option B: Development Mode (with auto-reload)

**Terminal 1:**
```bash
cd backend
npm run dev  # Uses nodemon for auto-reload
```

**Terminal 2:**
```bash
cd frontend
npm run dev  # Vite has built-in hot reload
```

### Step 6: Access the Application

Open your browser and navigate to:
- **Main UI**: http://localhost:3000

You should see the Custom Airflow UI with your DAGs listed.

## Verifying the Setup

### 1. Check Backend Health

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{"status":"ok","message":"Backend server is running"}
```

### 2. Check DAGs Endpoint

```bash
curl http://localhost:3001/api/dags
```

You should see a JSON response with your Airflow DAGs.

### 3. Check Frontend

Open http://localhost:3000 in your browser. You should see:
- Header with "Custom Airflow UI"
- Navigation menu
- List of DAGs (if you have any in Airflow)

## Common Issues and Solutions

### Issue 1: "Cannot connect to Airflow"

**Solution:**
- Verify Airflow is running: `curl http://localhost:8080`
- Check `AIRFLOW_BASE_URL` in `backend/.env`
- Verify credentials are correct

### Issue 2: "CORS Error"

**Solution:**
- Make sure backend is running on port 3001
- Check Vite proxy configuration in `frontend/vite.config.js`

### Issue 3: "Module not found"

**Solution:**
```bash
# Reinstall dependencies
cd backend && npm install
cd ../frontend && npm install
```

### Issue 4: "Port already in use"

**Solution:**
```bash
# Find and kill process using the port
# For port 3001 (backend)
lsof -ti:3001 | xargs kill -9

# For port 3000 (frontend)
lsof -ti:3000 | xargs kill -9
```

Or change the port in configuration files.

### Issue 5: "No DAGs showing"

**Solution:**
- Verify Airflow has DAGs loaded
- Check Airflow UI at http://localhost:8080
- Verify API credentials have proper permissions
- Check browser console for errors (F12)

## Testing the Features

### 1. Test DAG Listing
- Navigate to http://localhost:3000
- You should see all your DAGs

### 2. Test DAG Trigger
- Click on a DAG card
- Click "Trigger" button
- Verify in Airflow UI that the DAG run was created

### 3. Test DAG Pause/Unpause
- Click "Pause" or "Unpause" button on a DAG
- Verify the status changes

### 4. Test DAG Details
- Click on a DAG name or "Details" button
- You should see DAG metadata and recent runs

### 5. Test DAG Runs View
- Click "All Runs" in the navigation
- You should see recent DAG runs across all DAGs

## Next Steps

1. **Customize the UI**: Modify components in `frontend/src/components/`
2. **Add Features**: Extend the API in `backend/server.js`
3. **Deploy**: Build for production and deploy to your server
4. **Secure**: Implement proper authentication and HTTPS

## Production Deployment

### Build Frontend

```bash
cd frontend
npm run build
```

### Serve with Backend

Modify `backend/server.js` to serve the built frontend:

```javascript
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ... existing code ...

// Serve static files from frontend build
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Handle React routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});
```

### Run in Production

```bash
cd backend
NODE_ENV=production npm start
```

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the main README.md
3. Check Airflow REST API documentation: https://airflow.apache.org/docs/apache-airflow/stable/stable-rest-api-ref.html

