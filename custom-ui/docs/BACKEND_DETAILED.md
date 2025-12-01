# Backend - Detailed Documentation

## Table of Contents
1. [Overview](#overview)
2. [File Structure](#file-structure)
3. [Dependencies](#dependencies)
4. [Server Configuration](#server-configuration)
5. [API Endpoints](#api-endpoints)
6. [Error Handling](#error-handling)
7. [Authentication](#authentication)

## Overview

The backend is a Node.js Express server that acts as a proxy between the frontend React application and the Apache Airflow REST API. It handles authentication, request forwarding, and response processing.

### Purpose
- **Authentication Management**: Stores and manages Airflow credentials securely
- **API Proxy**: Forwards requests to Airflow with proper authentication
- **CORS Handling**: Enables cross-origin requests from the frontend
- **Error Processing**: Provides user-friendly error messages
- **Request/Response Transformation**: Formats data for frontend consumption

### Technology Stack
- **Runtime**: Node.js (v16+)
- **Framework**: Express.js v4.18.2
- **HTTP Client**: Axios v1.6.2
- **Middleware**: CORS, Body-Parser
- **Configuration**: dotenv

## File Structure

```
backend/
├── server.js           # Main server file (all logic)
├── package.json        # Dependencies and scripts
├── .env               # Environment variables (created by user)
├── .env.example       # Environment template
└── node_modules/      # Installed dependencies (auto-generated)
```

## Dependencies

### Production Dependencies

#### 1. express (^4.18.2)
**Purpose**: Web application framework for Node.js
**Usage**: Creates HTTP server, defines routes, handles middleware
**Installation**: `npm install express`

```javascript
import express from 'express';
const app = express();
```

**Key Features Used**:
- Route handling (GET, POST, PATCH)
- Middleware support
- Request/Response objects
- JSON parsing

#### 2. cors (^2.8.5)
**Purpose**: Enable Cross-Origin Resource Sharing
**Usage**: Allows frontend (port 3000) to communicate with backend (port 3001)
**Installation**: `npm install cors`

```javascript
import cors from 'cors';
app.use(cors());
```

**Configuration**:
- Allows all origins (development)
- Should be restricted in production
- Enables preflight requests

#### 3. axios (^1.6.2)
**Purpose**: Promise-based HTTP client
**Usage**: Makes requests to Airflow REST API
**Installation**: `npm install axios`

```javascript
import axios from 'axios';
const airflowAPI = axios.create({
  baseURL: `${AIRFLOW_BASE_URL}/api/v1`,
  auth: { username: AIRFLOW_USERNAME, password: AIRFLOW_PASSWORD }
});
```

**Features Used**:
- Instance creation with default config
- Basic authentication
- Interceptors for error handling
- Promise-based async/await

#### 4. dotenv (^16.3.1)
**Purpose**: Load environment variables from .env file
**Usage**: Manages configuration without hardcoding
**Installation**: `npm install dotenv`

```javascript
import dotenv from 'dotenv';
dotenv.config();
```

**Variables Loaded**:
- AIRFLOW_BASE_URL
- AIRFLOW_USERNAME
- AIRFLOW_PASSWORD
- PORT
- NODE_ENV

#### 5. body-parser (^1.20.2)
**Purpose**: Parse incoming request bodies
**Usage**: Extracts JSON data from POST/PATCH requests
**Installation**: `npm install body-parser`

```javascript
import bodyParser from 'body-parser';
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
```

**Parsers Used**:
- `json()`: Parses JSON payloads
- `urlencoded()`: Parses URL-encoded data

### Development Dependencies

#### nodemon (^3.0.2)
**Purpose**: Auto-restart server on file changes
**Usage**: Development mode with hot reload
**Installation**: `npm install --save-dev nodemon`

```json
"scripts": {
  "dev": "nodemon server.js"
}
```

## Server Configuration

### Port Configuration
```javascript
const PORT = process.env.PORT || 3001;
```
- **Default**: 3001
- **Override**: Set PORT in .env file
- **Usage**: `http://localhost:3001`

### Airflow Configuration
```javascript
const AIRFLOW_BASE_URL = process.env.AIRFLOW_BASE_URL || 'http://localhost:8080';
const AIRFLOW_USERNAME = process.env.AIRFLOW_USERNAME || 'admin';
const AIRFLOW_PASSWORD = process.env.AIRFLOW_PASSWORD || 'admin';
```

**Configuration Priority**:
1. Environment variables from .env
2. Default values (fallback)

### Axios Instance Configuration
```javascript
const airflowAPI = axios.create({
  baseURL: `${AIRFLOW_BASE_URL}/api/v1`,
  auth: {
    username: AIRFLOW_USERNAME,
    password: AIRFLOW_PASSWORD
  },
  headers: {
    'Content-Type': 'application/json'
  }
});
```

**Properties**:
- `baseURL`: Prepended to all requests
- `auth`: HTTP Basic Authentication
- `headers`: Default headers for all requests

### Middleware Stack
```javascript
app.use(cors());                              // 1. Enable CORS
app.use(bodyParser.json());                   // 2. Parse JSON
app.use(bodyParser.urlencoded({ extended: true })); // 3. Parse URL-encoded
```

**Execution Order**: Top to bottom for each request

## API Endpoints

### Health Check Endpoint

#### GET /health
**Purpose**: Verify backend server is running
**Authentication**: None required
**Parameters**: None

**Request Example**:
```bash
curl http://localhost:3001/health
```

**Response**:
```json
{
  "status": "ok",
  "message": "Backend server is running"
}
```

**Status Codes**:
- 200: Server is healthy

**Implementation**:
```javascript
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend server is running' });
});
```

**Use Cases**:
- Health checks in deployment
- Monitoring scripts
- Debugging connectivity

---

### DAG Endpoints

#### GET /api/dags
**Purpose**: Retrieve list of all DAGs from Airflow
**Authentication**: Handled by backend
**Parameters**: None

**Request Example**:
```bash
curl http://localhost:3001/api/dags
```

**Response Structure**:
```json
{
  "dags": [
    {
      "dag_id": "example_dag",
      "is_paused": false,
      "is_active": true,
      "is_subdag": false,
      "last_parsed_time": "2024-01-01T00:00:00+00:00",
      "last_pickled": null,
      "last_expired": null,
      "scheduler_lock": null,
      "pickle_id": null,
      "default_view": "grid",
      "fileloc": "/opt/airflow/dags/example_dag.py",
      "file_token": "token123",
      "owners": ["airflow"],
      "description": "Example DAG for demonstration",
      "schedule_interval": {
        "__type": "CronExpression",
        "value": "0 0 * * *"
      },
      "timetable_description": "At 00:00",
      "tags": [
        {
          "name": "example"
        }
      ],
      "max_active_tasks": 16,
      "max_active_runs": 16,
      "has_task_concurrency_limits": false,
      "has_import_errors": false,
      "next_dagrun": "2024-01-02T00:00:00+00:00",
      "next_dagrun_data_interval_start": "2024-01-01T00:00:00+00:00",
      "next_dagrun_data_interval_end": "2024-01-02T00:00:00+00:00",
      "next_dagrun_create_after": "2024-01-02T00:00:00+00:00"
    }
  ],
  "total_entries": 1
}
```

**Response Fields Explained**:
- `dag_id`: Unique identifier for the DAG
- `is_paused`: Whether DAG is paused (true/false)
- `is_active`: Whether DAG is active in scheduler
- `fileloc`: File path where DAG is defined
- `owners`: List of DAG owners
- `description`: DAG description from docstring
- `schedule_interval`: Cron expression or preset
- `tags`: List of tags for categorization
- `next_dagrun`: Next scheduled run time

**Status Codes**:
- 200: Success
- 401: Authentication failed
- 500: Server error

**Error Response**:
```json
{
  "error": "Failed to connect to Airflow",
  "details": {
    "message": "Connection refused"
  }
}
```

**Implementation**:
```javascript
app.get('/api/dags', async (req, res) => {
  try {
    const response = await airflowAPI.get('/dags');
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching DAGs:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data
    });
  }
});
```

**Flow**:
1. Frontend calls `/api/dags`
2. Backend receives request
3. Backend calls Airflow `/api/v1/dags` with auth
4. Airflow returns DAG list
5. Backend forwards response to frontend

**Common Issues**:
- 401: Check AIRFLOW_USERNAME and AIRFLOW_PASSWORD
- 500: Verify AIRFLOW_BASE_URL is correct
- Timeout: Check if Airflow is running

---

#### GET /api/dags/:dagId
**Purpose**: Get detailed information about a specific DAG
**Authentication**: Handled by backend
**Parameters**:
- `dagId` (path parameter): The DAG identifier

**Request Example**:
```bash
curl http://localhost:3001/api/dags/example_dag
```

**Response Structure**:
```json
{
  "dag_id": "example_dag",
  "is_paused": false,
  "is_active": true,
  "description": "Detailed DAG description",
  "fileloc": "/opt/airflow/dags/example_dag.py",
  "owners": ["airflow", "admin"],
  "schedule_interval": {
    "__type": "CronExpression",
    "value": "0 0 * * *"
  },
  "tags": [{"name": "production"}, {"name": "daily"}],
  "catchup": true,
  "orientation": "LR",
  "concurrency": 16,
  "start_date": "2024-01-01T00:00:00+00:00",
  "end_date": null,
  "is_paused_upon_creation": false,
  "last_parsed_time": "2024-01-01T12:00:00+00:00",
  "last_pickled": null,
  "default_view": "grid",
  "max_active_tasks": 16,
  "max_active_runs": 16,
  "has_task_concurrency_limits": false,
  "has_import_errors": false,
  "next_dagrun": "2024-01-02T00:00:00+00:00"
}
```

**Additional Fields Explained**:
- `catchup`: Whether to backfill missed runs
- `orientation`: Graph orientation (LR/TB)
- `concurrency`: Max concurrent tasks
- `start_date`: DAG start date
- `end_date`: DAG end date (null = no end)

**Status Codes**:
- 200: Success
- 404: DAG not found
- 401: Authentication failed
- 500: Server error

**Implementation**:
```javascript
app.get('/api/dags/:dagId', async (req, res) => {
  try {
    const { dagId } = req.params;
    const response = await airflowAPI.get(`/dags/${dagId}`);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching DAG details:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data
    });
  }
});
```

**Use Cases**:
- Display DAG metadata in UI
- Verify DAG configuration
- Check DAG status before triggering

---

#### POST /api/dags/:dagId/dagRuns
**Purpose**: Trigger a new DAG run
**Authentication**: Handled by backend
**Parameters**:
- `dagId` (path parameter): The DAG identifier
- `conf` (body parameter): Optional configuration object

**Request Example**:
```bash
curl -X POST http://localhost:3001/api/dags/example_dag/dagRuns \
  -H "Content-Type: application/json" \
  -d '{
    "conf": {
      "environment": "production",
      "batch_size": 1000
    }
  }'
```

**Request Body Structure**:
```json
{
  "conf": {
    "key1": "value1",
    "key2": "value2",
    "nested": {
      "param": "value"
    }
  }
}
```

**Response Structure**:
```json
{
  "conf": {
    "environment": "production",
    "batch_size": 1000
  },
  "dag_id": "example_dag",
  "dag_run_id": "manual__2024-01-01T12:30:00+00:00",
  "data_interval_end": "2024-01-01T12:30:00+00:00",
  "data_interval_start": "2024-01-01T12:30:00+00:00",
  "end_date": null,
  "execution_date": "2024-01-01T12:30:00+00:00",
  "external_trigger": true,
  "last_scheduling_decision": null,
  "logical_date": "2024-01-01T12:30:00+00:00",
  "note": null,
  "run_type": "manual",
  "start_date": null,
  "state": "queued"
}
```

**Response Fields Explained**:
- `dag_run_id`: Unique identifier for this run
- `execution_date`: Logical date of execution
- `state`: Current state (queued, running, success, failed)
- `run_type`: Type of run (manual, scheduled, backfill)
- `external_trigger`: Whether triggered externally (true for API)
- `conf`: Configuration passed to the DAG

**Status Codes**:
- 200: DAG run created successfully
- 400: Invalid request (bad configuration)
- 404: DAG not found
- 409: Conflict (run already exists)
- 500: Server error

**Error Response Examples**:
```json
{
  "error": "DAG is paused",
  "details": {
    "title": "DAG is paused",
    "status": 400
  }
}
```

**Implementation**:
```javascript
app.post('/api/dags/:dagId/dagRuns', async (req, res) => {
  try {
    const { dagId } = req.params;
    const { conf } = req.body;

    const payload = {
      conf: conf || {}
    };

    const response = await airflowAPI.post(`/dags/${dagId}/dagRuns`, payload);
    res.json(response.data);
  } catch (error) {
    console.error('Error triggering DAG:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data
    });
  }
});
```

**Configuration Usage in DAG**:
```python
# In your Airflow DAG
from airflow.models import DagRun

def my_task(**context):
    dag_run = context['dag_run']
    conf = dag_run.conf  # Access the configuration
    environment = conf.get('environment', 'development')
    batch_size = conf.get('batch_size', 100)
    print(f"Running in {environment} with batch size {batch_size}")
```

**Use Cases**:
- Manual DAG execution
- Parameterized runs
- External system integration
- Testing with specific configurations

**Best Practices**:
- Validate configuration before sending
- Use meaningful parameter names
- Document expected configuration in DAG
- Handle missing configuration gracefully in DAG code

---

#### PATCH /api/dags/:dagId
**Purpose**: Update DAG properties (pause/unpause)
**Authentication**: Handled by backend
**Parameters**:
- `dagId` (path parameter): The DAG identifier
- `is_paused` (body parameter): Boolean to pause/unpause

**Request Example (Pause)**:
```bash
curl -X PATCH http://localhost:3001/api/dags/example_dag \
  -H "Content-Type: application/json" \
  -d '{"is_paused": true}'
```

**Request Example (Unpause)**:
```bash
curl -X PATCH http://localhost:3001/api/dags/example_dag \
  -H "Content-Type: application/json" \
  -d '{"is_paused": false}'
```

**Request Body**:
```json
{
  "is_paused": true
}
```

**Response Structure**:
```json
{
  "dag_id": "example_dag",
  "is_paused": true
}
```

**Status Codes**:
- 200: DAG updated successfully
- 404: DAG not found
- 400: Invalid request
- 500: Server error

**Implementation**:
```javascript
app.patch('/api/dags/:dagId', async (req, res) => {
  try {
    const { dagId } = req.params;
    const { is_paused } = req.body;

    const response = await airflowAPI.patch(`/dags/${dagId}`, { is_paused });
    res.json(response.data);
  } catch (error) {
    console.error('Error updating DAG:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data
    });
  }
});
```

**Effects of Pausing**:
- Prevents new DAG runs from being scheduled
- Does not affect currently running DAG runs
- Can be unpaused at any time
- Useful for maintenance or debugging

**Use Cases**:
- Temporarily disable DAG
- Prevent scheduled runs during maintenance
- Stop DAG while fixing issues
- Control DAG execution programmatically

