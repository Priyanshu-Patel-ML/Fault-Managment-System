# Frontend - Detailed Documentation

## Table of Contents
1. [Overview](#overview)
2. [Project Structure](#project-structure)
3. [Dependencies](#dependencies)
4. [Configuration](#configuration)
5. [Components](#components)
6. [Services](#services)
7. [Routing](#routing)
8. [State Management](#state-management)
9. [Styling](#styling)

## Overview

The frontend is a modern React application built with Vite. It provides a user-friendly interface for managing Apache Airflow DAGs through the backend API.

### Technology Stack
- **Framework**: React 18.2.0
- **Build Tool**: Vite 5.0.8
- **Routing**: React Router DOM 6.20.1
- **HTTP Client**: Axios 1.6.2
- **Styling**: CSS3 (no framework)

### Key Features
- Component-based architecture
- Client-side routing
- Responsive design
- Real-time updates
- Error handling
- Loading states

## Project Structure

```
frontend/
├── index.html              # HTML entry point
├── package.json            # Dependencies and scripts
├── vite.config.js         # Vite configuration
├── src/
│   ├── main.jsx           # Application entry point
│   ├── index.css          # Global styles
│   ├── App.jsx            # Main application component
│   ├── App.css            # App-level styles
│   ├── components/        # React components
│   │   ├── DagList.jsx           # DAG listing component
│   │   ├── DagList.css           # DAG list styles
│   │   ├── DagDetails.jsx        # DAG details component
│   │   ├── DagDetails.css        # DAG details styles
│   │   ├── DagRuns.jsx           # All runs component
│   │   └── DagRuns.css           # DAG runs styles
│   └── services/          # API services
│       └── api.js         # API client
└── node_modules/          # Dependencies (auto-generated)
```

## Dependencies

### Production Dependencies

#### 1. react (^18.2.0)
**Purpose**: Core React library
**Usage**: Component creation, hooks, state management

```javascript
import React, { useState, useEffect } from 'react';
```

**Key Features Used**:
- Functional components
- Hooks (useState, useEffect)
- JSX syntax
- Component lifecycle

#### 2. react-dom (^18.2.0)
**Purpose**: React DOM rendering
**Usage**: Render React components to DOM

```javascript
import ReactDOM from 'react-dom/client';
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
```

#### 3. react-router-dom (^6.20.1)
**Purpose**: Client-side routing
**Usage**: Navigation between pages

```javascript
import { BrowserRouter, Routes, Route, Link, useParams } from 'react-router-dom';
```

**Features Used**:
- BrowserRouter: Router wrapper
- Routes/Route: Route definitions
- Link: Navigation links
- useParams: Extract URL parameters

#### 4. axios (^1.6.2)
**Purpose**: HTTP client
**Usage**: API calls to backend

```javascript
import axios from 'axios';
const response = await axios.get('/api/dags');
```

**Features Used**:
- GET/POST/PATCH requests
- Promise-based async/await
- Request/response interceptors
- Error handling

### Development Dependencies

#### 1. @vitejs/plugin-react (^4.2.1)
**Purpose**: Vite plugin for React
**Usage**: Enable React features in Vite

#### 2. vite (^5.0.8)
**Purpose**: Build tool and dev server
**Usage**: Development server, hot reload, production build

**Commands**:
- `npm run dev`: Start dev server
- `npm run build`: Production build
- `npm run preview`: Preview production build

## Configuration

### vite.config.js

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
})
```

**Configuration Explained**:

#### plugins
- `react()`: Enables React Fast Refresh and JSX

#### server.port
- **Value**: 3000
- **Purpose**: Development server port
- **Access**: http://localhost:3000

#### server.proxy
- **Pattern**: `/api`
- **Target**: `http://localhost:3001`
- **Purpose**: Proxy API requests to backend
- **changeOrigin**: true (required for CORS)

**How Proxy Works**:
```
Frontend Request: http://localhost:3000/api/dags
    ↓ (proxied by Vite)
Backend Request: http://localhost:3001/api/dags
```

### index.html

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Custom Airflow UI</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

**Key Elements**:
- `<div id="root">`: React mount point
- `<script type="module">`: ES6 module support
- `viewport` meta: Responsive design
- `charset="UTF-8"`: Unicode support

### package.json Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

**Script Descriptions**:
- `dev`: Start development server with hot reload
- `build`: Create optimized production build
- `preview`: Preview production build locally

---

## Services

### API Service Layer

**File**: `src/services/api.js`
**Purpose**: Centralized API client for backend communication

### Complete Code

```javascript
import axios from 'axios';

const API_BASE_URL = '/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Get all DAGs
export const getDags = async () => {
  const response = await apiClient.get('/dags');
  return response.data;
};

// Get DAG details
export const getDagDetails = async (dagId) => {
  const response = await apiClient.get(`/dags/${dagId}`);
  return response.data;
};

// Trigger a DAG
export const triggerDag = async (dagId, config = {}) => {
  const response = await apiClient.post(`/dags/${dagId}/dagRuns`, {
    conf: config
  });
  return response.data;
};

// Pause or unpause a DAG
export const pauseUnpauseDag = async (dagId, isPaused) => {
  const response = await apiClient.patch(`/dags/${dagId}`, {
    is_paused: isPaused
  });
  return response.data;
};

// Get DAG runs
export const getDagRuns = async (dagId, limit = 10) => {
  const response = await apiClient.get(`/dags/${dagId}/dagRuns`, {
    params: { limit }
  });
  return response.data;
};

// Get all DAG runs
export const getAllDagRuns = async (limit = 25, offset = 0) => {
  const response = await apiClient.get('/dagRuns', {
    params: { limit, offset }
  });
  return response.data;
};

// Get task instances for a DAG run
export const getTaskInstances = async (dagId, dagRunId) => {
  const encodedRunId = encodeURIComponent(dagRunId);
  const response = await apiClient.get(
    `/dags/${dagId}/dagRuns/${encodedRunId}/taskInstances`
  );
  return response.data;
};

export default {
  getDags,
  getDagDetails,
  triggerDag,
  pauseUnpauseDag,
  getDagRuns,
  getAllDagRuns,
  getTaskInstances
};
```

### Function Details

#### getDags()
**Purpose**: Fetch all DAGs
**Parameters**: None
**Returns**: Promise<Object>
```javascript
{
  dags: Array,
  total_entries: Number
}
```

**Usage**:
```javascript
import { getDags } from '../services/api';

const fetchDags = async () => {
  const data = await getDags();
  console.log(data.dags);
};
```

#### getDagDetails(dagId)
**Purpose**: Fetch details for specific DAG
**Parameters**:
- `dagId` (string): DAG identifier

**Returns**: Promise<Object>
```javascript
{
  dag_id: String,
  is_paused: Boolean,
  description: String,
  schedule_interval: Object,
  owners: Array,
  tags: Array
}
```

**Usage**:
```javascript
const dag = await getDagDetails('example_dag');
console.log(dag.description);
```

#### triggerDag(dagId, config)
**Purpose**: Trigger a DAG run
**Parameters**:
- `dagId` (string): DAG identifier
- `config` (object): Configuration parameters (optional)

**Returns**: Promise<Object>
```javascript
{
  dag_run_id: String,
  state: String,
  dag_id: String,
  execution_date: String
}
```

**Usage**:
```javascript
const run = await triggerDag('example_dag', {
  environment: 'production',
  batch_size: 1000
});
console.log(run.dag_run_id);
```

#### pauseUnpauseDag(dagId, isPaused)
**Purpose**: Pause or unpause a DAG
**Parameters**:
- `dagId` (string): DAG identifier
- `isPaused` (boolean): true to pause, false to unpause

**Returns**: Promise<Object>

**Usage**:
```javascript
// Pause
await pauseUnpauseDag('example_dag', true);

// Unpause
await pauseUnpauseDag('example_dag', false);
```

#### getDagRuns(dagId, limit)
**Purpose**: Get recent runs for a DAG
**Parameters**:
- `dagId` (string): DAG identifier
- `limit` (number): Maximum runs to return (default: 10)

**Returns**: Promise<Object>
```javascript
{
  dag_runs: Array,
  total_entries: Number
}
```

**Usage**:
```javascript
const data = await getDagRuns('example_dag', 20);
console.log(data.dag_runs);
```

#### getAllDagRuns(limit, offset)
**Purpose**: Get all DAG runs across all DAGs
**Parameters**:
- `limit` (number): Maximum runs to return (default: 25)
- `offset` (number): Pagination offset (default: 0)

**Returns**: Promise<Object>

**Usage**:
```javascript
// First page
const page1 = await getAllDagRuns(25, 0);

// Second page
const page2 = await getAllDagRuns(25, 25);
```

#### getTaskInstances(dagId, dagRunId)
**Purpose**: Get task instances for a DAG run
**Parameters**:
- `dagId` (string): DAG identifier
- `dagRunId` (string): DAG run identifier

**Returns**: Promise<Object>
```javascript
{
  task_instances: Array,
  total_entries: Number
}
```

**Usage**:
```javascript
const data = await getTaskInstances(
  'example_dag',
  'manual__2024-01-01T00:00:00+00:00'
);
console.log(data.task_instances);
```

### Error Handling

All API functions throw errors that should be caught:

```javascript
try {
  const dags = await getDags();
  // Handle success
} catch (error) {
  // Handle error
  console.error('API Error:', error.message);

  // Check if it's a network error
  if (error.code === 'ERR_NETWORK') {
    console.error('Backend server is not running');
  }

  // Check if it's an HTTP error
  if (error.response) {
    console.error('Status:', error.response.status);
    console.error('Data:', error.response.data);
  }
}
```

### Axios Instance Configuration

```javascript
const apiClient = axios.create({
  baseURL: API_BASE_URL,  // '/api'
  headers: {
    'Content-Type': 'application/json'
  }
});
```

**Benefits**:
- Consistent base URL
- Default headers
- Easy to add interceptors
- Centralized configuration

**Adding Interceptors** (optional):
```javascript
// Request interceptor
apiClient.interceptors.request.use(
  config => {
    console.log('Request:', config.method.toUpperCase(), config.url);
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  response => {
    console.log('Response:', response.status, response.config.url);
    return response;
  },
  error => {
    console.error('API Error:', error.message);
    return Promise.reject(error);
  }
);
```

---

## Routing

### React Router Configuration

**File**: `src/App.jsx`

### Route Definitions

```javascript
<Routes>
  <Route path="/" element={<DagList />} />
  <Route path="/dag/:dagId" element={<DagDetails />} />
  <Route path="/runs" element={<DagRuns />} />
</Routes>
```

### Route Details

#### Route 1: Home Page
- **Path**: `/`
- **Component**: DagList
- **Purpose**: Display all DAGs
- **URL Example**: `http://localhost:3000/`

#### Route 2: DAG Details
- **Path**: `/dag/:dagId`
- **Component**: DagDetails
- **Purpose**: Display specific DAG details
- **Parameter**: `dagId` (dynamic)
- **URL Example**: `http://localhost:3000/dag/example_dag`

**Accessing Parameter**:
```javascript
import { useParams } from 'react-router-dom';

function DagDetails() {
  const { dagId } = useParams();
  // dagId = "example_dag"
}
```

#### Route 3: All Runs
- **Path**: `/runs`
- **Component**: DagRuns
- **Purpose**: Display all DAG runs
- **URL Example**: `http://localhost:3000/runs`

### Navigation

#### Using Link Component

```javascript
import { Link } from 'react-router-dom';

// Static link
<Link to="/">Home</Link>

// Dynamic link
<Link to={`/dag/${dag.dag_id}`}>{dag.dag_id}</Link>

// Link with state
<Link to="/runs" state={{ from: 'dagList' }}>All Runs</Link>
```

**Benefits of Link**:
- No page reload
- Faster navigation
- Preserves React state
- Browser history support

#### Programmatic Navigation

```javascript
import { useNavigate } from 'react-router-dom';

function MyComponent() {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/runs');
  };

  const goBack = () => {
    navigate(-1);  // Go back one page
  };

  const goToDag = (dagId) => {
    navigate(`/dag/${dagId}`);
  };
}
```

---

## State Management

### Component State with useState

**Basic Usage**:
```javascript
const [value, setValue] = useState(initialValue);
```

**Examples**:

```javascript
// String state
const [searchTerm, setSearchTerm] = useState('');

// Boolean state
const [loading, setLoading] = useState(true);

// Array state
const [dags, setDags] = useState([]);

// Object state
const [dag, setDag] = useState(null);

// Number state
const [count, setCount] = useState(0);
```

### Updating State

**Direct Update**:
```javascript
setSearchTerm('new value');
setLoading(false);
```

**Functional Update**:
```javascript
// When new state depends on previous state
setCount(prevCount => prevCount + 1);

// Adding to array
setDags(prevDags => [...prevDags, newDag]);

// Updating object
setDag(prevDag => ({
  ...prevDag,
  is_paused: true
}));
```

### Side Effects with useEffect

**Basic Usage**:
```javascript
useEffect(() => {
  // Effect code

  return () => {
    // Cleanup code (optional)
  };
}, [dependencies]);
```

**Examples**:

**Run Once on Mount**:
```javascript
useEffect(() => {
  fetchDags();
}, []); // Empty dependency array
```

**Run When Value Changes**:
```javascript
useEffect(() => {
  if (dagId) {
    fetchDagDetails(dagId);
  }
}, [dagId]); // Runs when dagId changes
```

**Run on Every Render**:
```javascript
useEffect(() => {
  console.log('Component rendered');
}); // No dependency array
```

**Cleanup Function**:
```javascript
useEffect(() => {
  const timer = setInterval(() => {
    fetchDagRuns();
  }, 5000);

  // Cleanup on unmount
  return () => {
    clearInterval(timer);
  };
}, []);
```
