# Quick Reference Guide

## Installation Commands

```bash
# Install all dependencies
cd backend && npm install
cd ../frontend && npm install

# Or use root package.json (after installing concurrently)
npm run install-all
```

## Running the Application

### Development Mode

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Production Mode

```bash
# Build frontend
cd frontend
npm run build

# Start backend
cd backend
npm start
```

## Configuration

### Backend (.env)
```env
AIRFLOW_BASE_URL=http://localhost:8080
AIRFLOW_USERNAME=admin
AIRFLOW_PASSWORD=admin
PORT=3001
```

## URLs

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## Common API Calls

### List DAGs
```bash
curl http://localhost:3001/api/dags
```

### Trigger DAG
```bash
curl -X POST http://localhost:3001/api/dags/example_dag/dagRuns \
  -H "Content-Type: application/json" \
  -d '{"conf": {}}'
```

### Pause DAG
```bash
curl -X PATCH http://localhost:3001/api/dags/example_dag \
  -H "Content-Type: application/json" \
  -d '{"is_paused": true}'
```

### Get DAG Runs
```bash
curl http://localhost:3001/api/dags/example_dag/dagRuns?limit=10
```

## Project Structure

```
custom-ui/
├── backend/
│   ├── server.js          # Express server
│   ├── package.json       # Backend dependencies
│   └── .env              # Configuration
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── services/     # API calls
│   │   ├── App.jsx       # Main app
│   │   └── main.jsx      # Entry point
│   ├── package.json      # Frontend dependencies
│   └── vite.config.js    # Vite configuration
└── README.md             # Main documentation
```

## Key Components

### Frontend
- **DagList.jsx**: Main DAG listing page
- **DagDetails.jsx**: Individual DAG details and runs
- **DagRuns.jsx**: All DAG runs across all DAGs
- **api.js**: API service layer

### Backend
- **server.js**: Express server with all API endpoints

## Troubleshooting Quick Fixes

### Backend won't start
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

### Frontend won't start
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Port already in use
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Can't connect to Airflow
1. Check Airflow is running: `curl http://localhost:8080`
2. Verify credentials in `backend/.env`
3. Check Airflow REST API is enabled

## Feature Checklist

- ✅ List all DAGs
- ✅ Search DAGs
- ✅ View DAG details
- ✅ Trigger DAG runs
- ✅ Trigger with custom config
- ✅ Pause/Unpause DAGs
- ✅ View DAG runs
- ✅ View task instances
- ✅ Monitor all runs
- ✅ Responsive design

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| AIRFLOW_BASE_URL | Airflow instance URL | http://localhost:8080 |
| AIRFLOW_USERNAME | Airflow username | admin |
| AIRFLOW_PASSWORD | Airflow password | admin |
| PORT | Backend server port | 3001 |
| NODE_ENV | Environment | development |

## Dependencies

### Backend
- express: ^4.18.2
- cors: ^2.8.5
- axios: ^1.6.2
- dotenv: ^16.3.1
- body-parser: ^1.20.2

### Frontend
- react: ^18.2.0
- react-dom: ^18.2.0
- axios: ^1.6.2
- react-router-dom: ^6.20.1
- vite: ^5.0.8

## Useful Commands

```bash
# Check Node version
node --version

# Check npm version
npm --version

# Test Airflow API
curl -u admin:admin http://localhost:8080/api/v1/dags

# View backend logs
cd backend && npm start

# Build frontend for production
cd frontend && npm run build

# Preview production build
cd frontend && npm run preview
```

## Status Codes

- 🟢 Success (200)
- 🔴 Error (400, 401, 404, 500)
- 🟡 Loading/Processing

## Next Steps

1. ✅ Install dependencies
2. ✅ Configure Airflow connection
3. ✅ Start backend
4. ✅ Start frontend
5. ✅ Access UI at http://localhost:3000
6. 🎯 Customize for your needs
7. 🚀 Deploy to production

## Resources

- [Main README](README.md)
- [Setup Guide](SETUP_GUIDE.md)
- [API Documentation](API_DOCUMENTATION.md)
- [Features](FEATURES.md)
- [Airflow REST API](https://airflow.apache.org/docs/apache-airflow/stable/stable-rest-api-ref.html)

