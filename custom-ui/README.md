# Custom Airflow UI

A modern, custom user interface for Apache Airflow that interacts with Airflow's REST API. This application provides a clean and intuitive interface to manage your Airflow DAGs without directly accessing the Airflow UI.

## 🌟 Features

- **DAG Management**: View all DAGs with detailed information
- **Trigger DAGs**: Trigger DAG runs with custom configuration
- **Pause/Unpause DAGs**: Control DAG execution state
- **Monitor DAG Runs**: View real-time status of DAG runs
- **Task Instances**: Inspect individual task execution details
- **Search & Filter**: Easily find DAGs with search functionality
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🏗️ Architecture

The application consists of two main components:

1. **Backend (Node.js/Express)**: Proxy server that handles authentication and forwards requests to Airflow REST API
2. **Frontend (React)**: Modern UI built with React and Vite

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   React UI  │ ───> │   Backend   │ ───> │   Airflow   │
│  (Port 3000)│      │  (Port 3001)│      │  (Port 8080)│
└─────────────┘      └─────────────┘      └─────────────┘
```

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Apache Airflow instance running with REST API enabled
- Airflow credentials (username and password)

## 🚀 Installation

### 1. Clone the repository

```bash
cd custom-ui
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

## ⚙️ Configuration

### Backend Configuration

1. Copy the example environment file:

```bash
cd backend
cp .env.example .env
```

2. Edit `.env` file with your Airflow configuration:

```env
# Airflow Configuration
AIRFLOW_BASE_URL=http://localhost:8080
AIRFLOW_USERNAME=admin
AIRFLOW_PASSWORD=admin

# Server Configuration
PORT=3001
NODE_ENV=development
```

**Important**: Replace the values with your actual Airflow instance details.

## 🎯 Running the Application

### Option 1: Run Both Services Separately

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Option 2: Development Mode with Auto-Reload

**Backend (with nodemon):**
```bash
cd backend
npm run dev
```

**Frontend (with Vite hot reload):**
```bash
cd frontend
npm run dev
```

## 🌐 Accessing the Application

Once both services are running:

- **Frontend UI**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## 📚 API Endpoints

The backend exposes the following endpoints:

### DAG Endpoints
- `GET /api/dags` - List all DAGs
- `GET /api/dags/:dagId` - Get specific DAG details
- `POST /api/dags/:dagId/dagRuns` - Trigger a DAG run
- `PATCH /api/dags/:dagId` - Pause/Unpause a DAG

### DAG Run Endpoints
- `GET /api/dags/:dagId/dagRuns` - Get DAG runs for a specific DAG
- `GET /api/dagRuns` - Get all DAG runs
- `GET /api/dags/:dagId/dagRuns/:dagRunId/taskInstances` - Get task instances

## 🎨 Features Overview

### 1. DAG List Page
- View all available DAGs
- Search DAGs by name
- See DAG status (Active/Paused)
- Quick trigger buttons
- Pause/Unpause functionality

### 2. DAG Details Page
- Detailed DAG information
- Trigger DAG with custom JSON configuration
- View recent DAG runs
- Monitor task instances for each run

### 3. All DAG Runs Page
- View all DAG runs across all DAGs
- Filter by number of runs (10, 25, 50, 100)
- See run status, duration, and timestamps
- Quick navigation to DAG details

## 🔒 Security Considerations

1. **Environment Variables**: Never commit `.env` file with real credentials
2. **CORS**: The backend uses CORS - configure it properly for production
3. **Authentication**: Currently uses basic auth - consider implementing OAuth for production
4. **HTTPS**: Use HTTPS in production environments
5. **API Keys**: Consider using API keys instead of username/password

## 🛠️ Customization

### Adding New Features

1. **Backend**: Add new endpoints in `backend/server.js`
2. **Frontend API**: Add API calls in `frontend/src/services/api.js`
3. **Components**: Create new React components in `frontend/src/components/`

### Styling

- Global styles: `frontend/src/index.css` and `frontend/src/App.css`
- Component styles: Individual CSS files for each component

## 📦 Building for Production

### Frontend Build

```bash
cd frontend
npm run build
```

This creates an optimized production build in the `frontend/dist` directory.

### Serving Production Build

You can serve the production build using the backend:

```javascript
// Add to backend/server.js
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, '../frontend/dist')));
```

## 🐛 Troubleshooting

### Backend can't connect to Airflow
- Verify `AIRFLOW_BASE_URL` in `.env`
- Check if Airflow is running
- Verify credentials are correct
- Ensure Airflow REST API is enabled

### CORS errors
- Check backend CORS configuration
- Verify frontend is making requests to correct backend URL

### DAGs not showing
- Check Airflow has DAGs loaded
- Verify API credentials have proper permissions
- Check browser console for errors

## 📝 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

