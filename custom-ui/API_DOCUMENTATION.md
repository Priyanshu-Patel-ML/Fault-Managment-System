# API Documentation

This document describes the REST API endpoints provided by the Custom Airflow UI backend.

## Base URL

```
http://localhost:3001
```

## Authentication

The backend handles authentication with Airflow using credentials configured in `.env` file. Frontend requests to the backend do not require authentication.

## Endpoints

### Health Check

#### GET /health

Check if the backend server is running.

**Response:**
```json
{
  "status": "ok",
  "message": "Backend server is running"
}
```

---

### DAG Endpoints

#### GET /api/dags

Get a list of all DAGs.

**Response:**
```json
{
  "dags": [
    {
      "dag_id": "example_dag",
      "is_paused": false,
      "is_active": true,
      "description": "Example DAG description",
      "schedule_interval": {
        "value": "0 0 * * *"
      },
      "owners": ["airflow"],
      "tags": [{"name": "example"}]
    }
  ],
  "total_entries": 1
}
```

#### GET /api/dags/:dagId

Get details of a specific DAG.

**Parameters:**
- `dagId` (path) - The DAG ID

**Response:**
```json
{
  "dag_id": "example_dag",
  "is_paused": false,
  "is_active": true,
  "description": "Example DAG description",
  "schedule_interval": {
    "value": "0 0 * * *"
  },
  "fileloc": "/path/to/dag/file.py",
  "owners": ["airflow"],
  "tags": [{"name": "example"}]
}
```

#### POST /api/dags/:dagId/dagRuns

Trigger a new DAG run.

**Parameters:**
- `dagId` (path) - The DAG ID

**Request Body:**
```json
{
  "conf": {
    "key1": "value1",
    "key2": "value2"
  }
}
```

**Response:**
```json
{
  "dag_run_id": "manual__2024-01-01T00:00:00+00:00",
  "dag_id": "example_dag",
  "state": "queued",
  "execution_date": "2024-01-01T00:00:00+00:00",
  "start_date": null,
  "end_date": null,
  "conf": {
    "key1": "value1",
    "key2": "value2"
  }
}
```

#### PATCH /api/dags/:dagId

Pause or unpause a DAG.

**Parameters:**
- `dagId` (path) - The DAG ID

**Request Body:**
```json
{
  "is_paused": true
}
```

**Response:**
```json
{
  "dag_id": "example_dag",
  "is_paused": true
}
```

---

### DAG Run Endpoints

#### GET /api/dags/:dagId/dagRuns

Get DAG runs for a specific DAG.

**Parameters:**
- `dagId` (path) - The DAG ID
- `limit` (query, optional) - Number of results (default: 10)
- `offset` (query, optional) - Offset for pagination (default: 0)

**Example:**
```
GET /api/dags/example_dag/dagRuns?limit=20&offset=0
```

**Response:**
```json
{
  "dag_runs": [
    {
      "dag_run_id": "manual__2024-01-01T00:00:00+00:00",
      "dag_id": "example_dag",
      "state": "success",
      "execution_date": "2024-01-01T00:00:00+00:00",
      "start_date": "2024-01-01T00:00:05+00:00",
      "end_date": "2024-01-01T00:05:00+00:00",
      "run_type": "manual"
    }
  ],
  "total_entries": 1
}
```

#### GET /api/dagRuns

Get all DAG runs across all DAGs.

**Parameters:**
- `limit` (query, optional) - Number of results (default: 25)
- `offset` (query, optional) - Offset for pagination (default: 0)

**Example:**
```
GET /api/dagRuns?limit=50&offset=0
```

**Response:**
```json
{
  "dag_runs": [
    {
      "dag_run_id": "manual__2024-01-01T00:00:00+00:00",
      "dag_id": "example_dag",
      "state": "success",
      "execution_date": "2024-01-01T00:00:00+00:00",
      "start_date": "2024-01-01T00:00:05+00:00",
      "end_date": "2024-01-01T00:05:00+00:00",
      "run_type": "manual"
    }
  ],
  "total_entries": 1
}
```

---

### Task Instance Endpoints

#### GET /api/dags/:dagId/dagRuns/:dagRunId/taskInstances

Get task instances for a specific DAG run.

**Parameters:**
- `dagId` (path) - The DAG ID
- `dagRunId` (path) - The DAG run ID

**Example:**
```
GET /api/dags/example_dag/dagRuns/manual__2024-01-01T00:00:00+00:00/taskInstances
```

**Response:**
```json
{
  "task_instances": [
    {
      "task_id": "task_1",
      "dag_id": "example_dag",
      "dag_run_id": "manual__2024-01-01T00:00:00+00:00",
      "state": "success",
      "start_date": "2024-01-01T00:00:05+00:00",
      "end_date": "2024-01-01T00:02:00+00:00",
      "duration": 115.5
    }
  ],
  "total_entries": 1
}
```

---

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "error": "Error message",
  "details": {
    // Additional error details from Airflow API
  }
}
```

### Common HTTP Status Codes

- `200 OK` - Request successful
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Authentication failed
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## Examples

### Trigger a DAG with Configuration

```bash
curl -X POST http://localhost:3001/api/dags/example_dag/dagRuns \
  -H "Content-Type: application/json" \
  -d '{"conf": {"param1": "value1"}}'
```

### Get Recent DAG Runs

```bash
curl http://localhost:3001/api/dags/example_dag/dagRuns?limit=10
```

### Pause a DAG

```bash
curl -X PATCH http://localhost:3001/api/dags/example_dag \
  -H "Content-Type: application/json" \
  -d '{"is_paused": true}'
```

---

## Airflow REST API Reference

For more details on the underlying Airflow REST API, refer to:
https://airflow.apache.org/docs/apache-airflow/stable/stable-rest-api-ref.html

