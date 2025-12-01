# Backend API Endpoints - Complete Reference

## DAG Run Endpoints

### GET /api/dags/:dagId/dagRuns
**Purpose**: Get list of DAG runs for a specific DAG
**Authentication**: Handled by backend
**Parameters**: 
- `dagId` (path): The DAG identifier
- `limit` (query, optional): Number of results (default: 10)
- `offset` (query, optional): Pagination offset (default: 0)

**Request Examples**:
```bash
# Get last 10 runs
curl http://localhost:3001/api/dags/example_dag/dagRuns

# Get last 20 runs
curl http://localhost:3001/api/dags/example_dag/dagRuns?limit=20

# Get runs with pagination
curl http://localhost:3001/api/dags/example_dag/dagRuns?limit=10&offset=10
```

**Response Structure**:
```json
{
  "dag_runs": [
    {
      "conf": {},
      "dag_id": "example_dag",
      "dag_run_id": "scheduled__2024-01-01T00:00:00+00:00",
      "data_interval_end": "2024-01-02T00:00:00+00:00",
      "data_interval_start": "2024-01-01T00:00:00+00:00",
      "end_date": "2024-01-01T00:05:30+00:00",
      "execution_date": "2024-01-01T00:00:00+00:00",
      "external_trigger": false,
      "last_scheduling_decision": "2024-01-01T00:05:30+00:00",
      "logical_date": "2024-01-01T00:00:00+00:00",
      "note": null,
      "run_type": "scheduled",
      "start_date": "2024-01-01T00:00:05+00:00",
      "state": "success"
    }
  ],
  "total_entries": 1
}
```

**DAG Run States**:
- `queued`: Waiting to be executed
- `running`: Currently executing
- `success`: Completed successfully
- `failed`: Failed execution
- `up_for_retry`: Failed but will retry
- `up_for_reschedule`: Waiting to be rescheduled
- `skipped`: Skipped execution

**Query Parameters Details**:
- `limit`: Controls page size (1-100)
- `offset`: Skip first N results
- `order_by`: Sort order (default: `-execution_date`)

**Implementation**:
```javascript
app.get('/api/dags/:dagId/dagRuns', async (req, res) => {
  try {
    const { dagId } = req.params;
    const { limit = 10, offset = 0 } = req.query;
    
    const response = await airflowAPI.get(`/dags/${dagId}/dagRuns`, {
      params: { limit, offset, order_by: '-execution_date' }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching DAG runs:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data
    });
  }
});
```

**Pagination Example**:
```javascript
// Page 1 (first 10)
GET /api/dags/example_dag/dagRuns?limit=10&offset=0

// Page 2 (next 10)
GET /api/dags/example_dag/dagRuns?limit=10&offset=10

// Page 3 (next 10)
GET /api/dags/example_dag/dagRuns?limit=10&offset=20
```

**Use Cases**:
- Display run history in UI
- Monitor DAG execution status
- Analyze run patterns
- Debugging failed runs

---

### GET /api/dagRuns
**Purpose**: Get all DAG runs across all DAGs
**Authentication**: Handled by backend
**Parameters**: 
- `limit` (query, optional): Number of results (default: 25)
- `offset` (query, optional): Pagination offset (default: 0)

**Request Examples**:
```bash
# Get last 25 runs
curl http://localhost:3001/api/dagRuns

# Get last 50 runs
curl http://localhost:3001/api/dagRuns?limit=50

# Pagination
curl http://localhost:3001/api/dagRuns?limit=25&offset=25
```

**Response Structure**:
```json
{
  "dag_runs": [
    {
      "conf": {},
      "dag_id": "dag_1",
      "dag_run_id": "scheduled__2024-01-01T00:00:00+00:00",
      "execution_date": "2024-01-01T00:00:00+00:00",
      "start_date": "2024-01-01T00:00:05+00:00",
      "end_date": "2024-01-01T00:05:30+00:00",
      "state": "success",
      "run_type": "scheduled"
    },
    {
      "conf": {"param": "value"},
      "dag_id": "dag_2",
      "dag_run_id": "manual__2024-01-01T01:00:00+00:00",
      "execution_date": "2024-01-01T01:00:00+00:00",
      "start_date": "2024-01-01T01:00:10+00:00",
      "end_date": null,
      "state": "running",
      "run_type": "manual"
    }
  ],
  "total_entries": 2
}
```

**Implementation**:
```javascript
app.get('/api/dagRuns', async (req, res) => {
  try {
    const { limit = 25, offset = 0 } = req.query;
    const response = await airflowAPI.get('/dagRuns/list', {
      params: { limit, offset, order_by: '-execution_date' }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching all DAG runs:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data
    });
  }
});
```

**Differences from /api/dags/:dagId/dagRuns**:
- Returns runs from ALL DAGs
- Useful for dashboard views
- Higher default limit (25 vs 10)
- Sorted by execution date across all DAGs

**Use Cases**:
- Global DAG run monitoring
- Cross-DAG analytics
- System-wide status dashboard
- Recent activity feed

---

## Task Instance Endpoints

### GET /api/dags/:dagId/dagRuns/:dagRunId/taskInstances
**Purpose**: Get all task instances for a specific DAG run
**Authentication**: Handled by backend
**Parameters**:
- `dagId` (path): The DAG identifier
- `dagRunId` (path): The DAG run identifier

**Request Example**:
```bash
curl http://localhost:3001/api/dags/example_dag/dagRuns/scheduled__2024-01-01T00:00:00+00:00/taskInstances
```

**Note**: DAG run ID must be URL-encoded if it contains special characters:
```bash
# Correct encoding
curl http://localhost:3001/api/dags/example_dag/dagRuns/scheduled__2024-01-01T00%3A00%3A00%2B00%3A00/taskInstances
```

**Response Structure**:
```json
{
  "task_instances": [
    {
      "dag_id": "example_dag",
      "dag_run_id": "scheduled__2024-01-01T00:00:00+00:00",
      "duration": 45.123,
      "end_date": "2024-01-01T00:01:00+00:00",
      "execution_date": "2024-01-01T00:00:00+00:00",
      "executor_config": "{}",
      "hostname": "worker-1",
      "map_index": -1,
      "max_tries": 0,
      "note": null,
      "operator": "PythonOperator",
      "pid": 12345,
      "pool": "default_pool",
      "pool_slots": 1,
      "priority_weight": 1,
      "queue": "default",
      "queued_when": null,
      "rendered_fields": {},
      "sla_miss": null,
      "start_date": "2024-01-01T00:00:15+00:00",
      "state": "success",
      "task_id": "task_1",
      "trigger": null,
      "triggerer_job": null,
      "try_number": 1,
      "unixname": "airflow"
    },
    {
      "dag_id": "example_dag",
      "dag_run_id": "scheduled__2024-01-01T00:00:00+00:00",
      "duration": 30.456,
      "end_date": "2024-01-01T00:01:30+00:00",
      "start_date": "2024-01-01T00:01:00+00:00",
      "state": "success",
      "task_id": "task_2",
      "operator": "BashOperator",
      "try_number": 1
    }
  ],
  "total_entries": 2
}
```

**Task Instance States**:
- `none`: Not yet queued
- `scheduled`: Scheduled to run
- `queued`: Queued for execution
- `running`: Currently executing
- `success`: Completed successfully
- `failed`: Failed execution
- `up_for_retry`: Failed, will retry
- `up_for_reschedule`: Waiting to reschedule
- `upstream_failed`: Upstream task failed
- `skipped`: Skipped execution
- `removed`: Task removed from DAG
- `deferred`: Deferred to trigger

**Important Fields**:
- `task_id`: Unique task identifier within DAG
- `state`: Current execution state
- `duration`: Execution time in seconds
- `try_number`: Attempt number (1 for first try)
- `operator`: Airflow operator type
- `pool`: Resource pool used
- `queue`: Celery queue (if using CeleryExecutor)

**Implementation**:
```javascript
app.get('/api/dags/:dagId/dagRuns/:dagRunId/taskInstances', async (req, res) => {
  try {
    const { dagId, dagRunId } = req.params;
    const response = await airflowAPI.get(
      `/dags/${dagId}/dagRuns/${dagRunId}/taskInstances`
    );
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching task instances:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data
    });
  }
});
```

**Use Cases**:
- Debug failed DAG runs
- Monitor task-level execution
- Analyze task performance
- Identify bottlenecks
- Track retry attempts

**Common Patterns**:
```javascript
// Frontend: Get tasks for a run
const getTasks = async (dagId, dagRunId) => {
  const encodedRunId = encodeURIComponent(dagRunId);
  const response = await axios.get(
    `/api/dags/${dagId}/dagRuns/${encodedRunId}/taskInstances`
  );
  return response.data.task_instances;
};

// Calculate total duration
const totalDuration = tasks.reduce((sum, task) => sum + (task.duration || 0), 0);

// Find failed tasks
const failedTasks = tasks.filter(task => task.state === 'failed');

// Get task by ID
const task = tasks.find(t => t.task_id === 'my_task');
```

---

## Error Handling

### Error Response Format

All endpoints return errors in a consistent format:

```json
{
  "error": "Human-readable error message",
  "details": {
    // Additional error details from Airflow
  }
}
```

### Common Error Scenarios

#### 1. Authentication Failure (401)
**Cause**: Invalid Airflow credentials
**Response**:
```json
{
  "error": "Request failed with status code 401",
  "details": {
    "title": "Unauthorized",
    "status": 401,
    "detail": "Incorrect username or password"
  }
}
```

**Solution**:
- Verify AIRFLOW_USERNAME in .env
- Verify AIRFLOW_PASSWORD in .env
- Check Airflow user exists and is active

#### 2. DAG Not Found (404)
**Cause**: DAG ID doesn't exist
**Response**:
```json
{
  "error": "Request failed with status code 404",
  "details": {
    "title": "DAG not found",
    "status": 404,
    "detail": "DAG with ID 'nonexistent_dag' not found"
  }
}
```

**Solution**:
- Verify DAG ID spelling
- Check DAG is loaded in Airflow
- Refresh DAG list

#### 3. Connection Refused (500)
**Cause**: Cannot connect to Airflow
**Response**:
```json
{
  "error": "connect ECONNREFUSED 127.0.0.1:8080",
  "details": null
}
```

**Solution**:
- Verify Airflow is running
- Check AIRFLOW_BASE_URL in .env
- Verify network connectivity
- Check firewall settings

#### 4. Invalid Configuration (400)
**Cause**: Invalid request body
**Response**:
```json
{
  "error": "Request failed with status code 400",
  "details": {
    "title": "Bad Request",
    "status": 400,
    "detail": "Invalid JSON in conf parameter"
  }
}
```

**Solution**:
- Validate JSON before sending
- Check required fields
- Verify data types

### Error Handling Implementation

```javascript
// Generic error handler
const handleError = (error, res) => {
  console.error('Error:', error.message);

  // Extract status code
  const status = error.response?.status || 500;

  // Build error response
  const errorResponse = {
    error: error.message,
    details: error.response?.data || null
  };

  // Send response
  res.status(status).json(errorResponse);
};

// Usage in endpoint
app.get('/api/dags', async (req, res) => {
  try {
    const response = await airflowAPI.get('/dags');
    res.json(response.data);
  } catch (error) {
    handleError(error, res);
  }
});
```

### Logging

All errors are logged to console:
```javascript
console.error('Error fetching DAGs:', error.message);
```

**Log Format**:
```
Error fetching DAGs: Request failed with status code 401
Error triggering DAG: connect ECONNREFUSED 127.0.0.1:8080
Error updating DAG: DAG is paused
```

**Production Logging**:
For production, consider using a logging library:
```javascript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Usage
logger.error('Error fetching DAGs', { error: error.message, stack: error.stack });
```
