# Architecture Documentation - Complete Reference

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Component Architecture](#component-architecture)
4. [Data Flow](#data-flow)
5. [Authentication Flow](#authentication-flow)
6. [Error Handling Architecture](#error-handling-architecture)
7. [Scalability Considerations](#scalability-considerations)

## System Overview

### High-Level Architecture

The Custom Airflow UI is a three-tier web application:

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │      │                 │
│  React Frontend │ ───> │  Express Backend│ ───> │ Airflow REST API│
│   (Port 3000)   │ <─── │   (Port 3001)   │ <─── │   (Port 8080)   │
│                 │      │                 │      │                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘
     Browser                  Node.js                Apache Airflow
```

### Tier Responsibilities

#### Tier 1: Frontend (React)
**Technology**: React 18 + Vite
**Port**: 3000 (development)
**Responsibilities**:
- User interface rendering
- User interaction handling
- Client-side routing
- State management
- API calls to backend
- Data presentation

**Does NOT**:
- Communicate directly with Airflow
- Handle authentication
- Store sensitive data

#### Tier 2: Backend (Express)
**Technology**: Node.js + Express
**Port**: 3001
**Responsibilities**:
- API proxy to Airflow
- Authentication handling
- Request/response transformation
- Error handling
- CORS management
- Request validation

**Does NOT**:
- Render UI
- Store data (stateless)
- Implement business logic

#### Tier 3: Airflow
**Technology**: Apache Airflow
**Port**: 8080 (default)
**Responsibilities**:
- DAG management
- Task scheduling
- Workflow execution
- Data persistence
- User authentication

---

## Architecture Diagram

### Complete System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                              │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    React Application                        │  │
│  │                                                             │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │  │
│  │  │ DagList  │  │DagDetails│  │ DagRuns  │  Components     │  │
│  │  └──────────┘  └──────────┘  └──────────┘                 │  │
│  │                                                             │  │
│  │  ┌──────────────────────────────────────┐                 │  │
│  │  │         API Service Layer            │                 │  │
│  │  │  (axios client, API functions)       │                 │  │
│  │  └──────────────────────────────────────┘                 │  │
│  │                      │                                      │  │
│  └──────────────────────┼──────────────────────────────────────┘  │
│                         │                                         │
└─────────────────────────┼─────────────────────────────────────────┘
                          │ HTTP/HTTPS
                          │ (Proxied by Vite in dev)
                          ▼
┌──────────────────────────────────────────────────────────────────┐
│                      Backend Server                               │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                   Express Application                       │  │
│  │                                                             │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │  │
│  │  │ CORS         │  │ Body Parser  │  │ Error Handler│     │  │
│  │  │ Middleware   │  │ Middleware   │  │              │     │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘     │  │
│  │                                                             │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │              API Endpoints                           │  │  │
│  │  │  /health, /api/dags, /api/dagRuns, etc.             │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  │                                                             │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │         Axios Instance (Airflow Client)              │  │  │
│  │  │  - Base URL configuration                            │  │  │
│  │  │  - Basic Auth credentials                            │  │  │
│  │  │  - Default headers                                   │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  │                      │                                      │  │
│  └──────────────────────┼──────────────────────────────────────┘  │
│                         │                                         │
└─────────────────────────┼─────────────────────────────────────────┘
                          │ HTTP/HTTPS + Basic Auth
                          ▼
┌──────────────────────────────────────────────────────────────────┐
│                    Apache Airflow                                 │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                  Airflow REST API                           │  │
│  │                  (/api/v1/...)                              │  │
│  │                                                             │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │  │
│  │  │ DAG Manager  │  │ Scheduler    │  │ Executor     │     │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘     │  │
│  │                                                             │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │              Metadata Database                       │  │  │
│  │  │  (PostgreSQL/MySQL/SQLite)                           │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### Frontend Component Hierarchy

```
App (Root)
│
├── Header
│   ├── Title
│   └── Navigation
│       ├── Link: DAGs (/)
│       └── Link: All Runs (/runs)
│
├── Main (Routes)
│   │
│   ├── Route: / → DagList
│   │   ├── SearchBox
│   │   ├── RefreshButton
│   │   ├── MessageDisplay (error/success)
│   │   └── DagGrid
│   │       └── DagCard (multiple)
│   │           ├── DagHeader
│   │           ├── DagDescription
│   │           ├── DagMetadata
│   │           └── DagActions
│   │               ├── TriggerButton
│   │               └── PauseButton
│   │
│   ├── Route: /dag/:dagId → DagDetails
│   │   ├── BackButton
│   │   ├── DagInfo
│   │   ├── TriggerSection
│   │   │   ├── ConfigEditor (conditional)
│   │   │   └── TriggerButton
│   │   ├── RecentRuns
│   │   │   └── RunsTable
│   │   │       └── RunRow (multiple)
│   │   └── TaskInstances (conditional)
│   │       └── TasksTable
│   │           └── TaskRow (multiple)
│   │
│   └── Route: /runs → DagRuns
│       ├── PaginationControls
│       ├── RefreshButton
│       └── RunsTable
│           └── RunRow (multiple)
│
└── Footer
    └── Copyright
```

### Backend Architecture

```
server.js (Entry Point)
│
├── Configuration
│   ├── Environment Variables (dotenv)
│   ├── Port Configuration
│   └── Airflow Connection Settings
│
├── Middleware Stack
│   ├── CORS Middleware
│   ├── Body Parser (JSON)
│   └── Body Parser (URL-encoded)
│
├── Airflow API Client
│   ├── Axios Instance
│   ├── Base URL Configuration
│   ├── Authentication (Basic Auth)
│   └── Default Headers
│
├── API Endpoints
│   ├── GET  /health
│   ├── GET  /api/dags
│   ├── GET  /api/dags/:dagId
│   ├── POST /api/dags/:dagId/dagRuns
│   ├── PATCH /api/dags/:dagId
│   ├── GET  /api/dags/:dagId/dagRuns
│   ├── GET  /api/dagRuns
│   └── GET  /api/dags/:dagId/dagRuns/:dagRunId/taskInstances
│
├── Error Handling
│   ├── Try-Catch Blocks
│   ├── Error Response Formatting
│   └── Logging
│
└── Server Initialization
    └── Express Listen
```

---

## Data Flow

### Example: Triggering a DAG

**Step-by-Step Flow**:

```
1. User Action
   │
   ├─> User clicks "Trigger" button in DagList component
   │
   └─> Confirmation dialog appears

2. Frontend Processing
   │
   ├─> handleTriggerDag() function called
   │
   ├─> State updated: setTriggeringDag(dagId)
   │
   └─> API call: triggerDag(dagId, config)

3. API Service Layer
   │
   ├─> services/api.js: triggerDag() function
   │
   ├─> Axios POST request created
   │   URL: /api/dags/${dagId}/dagRuns
   │   Body: { conf: config }
   │
   └─> Request sent to backend

4. Vite Proxy (Development)
   │
   ├─> Request intercepted by Vite
   │
   ├─> Proxied to http://localhost:3001
   │
   └─> Forwarded to backend

5. Backend Processing
   │
   ├─> Express receives POST /api/dags/:dagId/dagRuns
   │
   ├─> Middleware processes request
   │   ├─> CORS check
   │   └─> Body parsing
   │
   ├─> Route handler executes
   │   ├─> Extract dagId from params
   │   ├─> Extract conf from body
   │   └─> Build Airflow API request
   │
   └─> Axios call to Airflow

6. Airflow API
   │
   ├─> Receives POST /api/v1/dags/:dagId/dagRuns
   │
   ├─> Authenticates request (Basic Auth)
   │
   ├─> Validates DAG exists
   │
   ├─> Creates DAG run
   │   ├─> Generates run ID
   │   ├─> Sets state to "queued"
   │   └─> Stores in database
   │
   └─> Returns response

7. Backend Response
   │
   ├─> Receives Airflow response
   │
   ├─> Extracts data
   │
   └─> Sends to frontend: res.json(response.data)

8. Frontend Response Handling
   │
   ├─> Axios promise resolves
   │
   ├─> Success handler executes
   │   ├─> setSuccessMessage()
   │   ├─> setTimeout() for auto-clear
   │   └─> setTriggeringDag(null)
   │
   └─> UI updates
       ├─> Success message displays
       ├─> Button re-enables
       └─> Component re-renders

9. User Feedback
   │
   └─> User sees: "Successfully triggered DAG: example_dag"
```

### Data Transformation

**Frontend Request**:
```javascript
{
  conf: {
    environment: "production",
    batch_size: 1000
  }
}
```

**Backend to Airflow**:
```javascript
{
  conf: {
    environment: "production",
    batch_size: 1000
  }
}
```

**Airflow Response**:
```javascript
{
  dag_run_id: "manual__2024-01-01T12:00:00+00:00",
  dag_id: "example_dag",
  state: "queued",
  execution_date: "2024-01-01T12:00:00+00:00",
  start_date: null,
  end_date: null,
  conf: {
    environment: "production",
    batch_size: 1000
  }
}
```

**Backend to Frontend** (pass-through):
```javascript
{
  dag_run_id: "manual__2024-01-01T12:00:00+00:00",
  dag_id: "example_dag",
  state: "queued",
  execution_date: "2024-01-01T12:00:00+00:00",
  start_date: null,
  end_date: null,
  conf: {
    environment: "production",
    batch_size: 1000
  }
}
```
