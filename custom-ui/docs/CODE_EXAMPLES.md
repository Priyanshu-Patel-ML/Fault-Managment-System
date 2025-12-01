# Code Examples - Complete Reference

## Table of Contents
1. [Basic Usage Examples](#basic-usage-examples)
2. [Advanced API Usage](#advanced-api-usage)
3. [Custom Components](#custom-components)
4. [Integration Examples](#integration-examples)
5. [Testing Examples](#testing-examples)
6. [Real-World Scenarios](#real-world-scenarios)

## Basic Usage Examples

### Example 1: Trigger a DAG

**Scenario**: Trigger a DAG from external script

**JavaScript/Node.js**:
```javascript
const axios = require('axios');

async function triggerDag(dagId, config = {}) {
  try {
    const response = await axios.post(
      `http://localhost:3001/api/dags/${dagId}/dagRuns`,
      { conf: config },
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    console.log('DAG triggered successfully!');
    console.log('Run ID:', response.data.dag_run_id);
    console.log('State:', response.data.state);
    return response.data;
  } catch (error) {
    console.error('Failed to trigger DAG:', error.message);
    throw error;
  }
}

// Usage
triggerDag('example_dag', {
  environment: 'production',
  batch_size: 1000
});
```

**Python**:
```python
import requests
import json

def trigger_dag(dag_id, config=None):
    """Trigger an Airflow DAG via custom UI backend"""
    url = f"http://localhost:3001/api/dags/{dag_id}/dagRuns"
    
    payload = {
        "conf": config or {}
    }
    
    try:
        response = requests.post(
            url,
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        response.raise_for_status()
        
        data = response.json()
        print(f"DAG triggered successfully!")
        print(f"Run ID: {data['dag_run_id']}")
        print(f"State: {data['state']}")
        return data
        
    except requests.exceptions.RequestException as e:
        print(f"Failed to trigger DAG: {e}")
        raise

# Usage
trigger_dag('example_dag', {
    'environment': 'production',
    'batch_size': 1000
})
```

**cURL**:
```bash
#!/bin/bash

# Function to trigger DAG
trigger_dag() {
  local dag_id=$1
  local config=$2
  
  curl -X POST "http://localhost:3001/api/dags/${dag_id}/dagRuns" \
    -H "Content-Type: application/json" \
    -d "{\"conf\": ${config}}" \
    | jq '.'
}

# Usage
trigger_dag "example_dag" '{"environment":"production","batch_size":1000}'
```

---

### Example 2: List All DAGs

**JavaScript**:
```javascript
async function listDags() {
  try {
    const response = await axios.get('http://localhost:3001/api/dags');
    const dags = response.data.dags;
    
    console.log(`Found ${dags.length} DAGs:`);
    dags.forEach(dag => {
      console.log(`- ${dag.dag_id} (${dag.is_paused ? 'Paused' : 'Active'})`);
    });
    
    return dags;
  } catch (error) {
    console.error('Failed to list DAGs:', error.message);
    throw error;
  }
}

// Usage
listDags();
```

**Python**:
```python
def list_dags():
    """List all Airflow DAGs"""
    url = "http://localhost:3001/api/dags"
    
    try:
        response = requests.get(url)
        response.raise_for_status()
        
        data = response.json()
        dags = data['dags']
        
        print(f"Found {len(dags)} DAGs:")
        for dag in dags:
            status = "Paused" if dag['is_paused'] else "Active"
            print(f"- {dag['dag_id']} ({status})")
        
        return dags
        
    except requests.exceptions.RequestException as e:
        print(f"Failed to list DAGs: {e}")
        raise

# Usage
list_dags()
```

---

### Example 3: Monitor DAG Run Status

**JavaScript**:
```javascript
async function monitorDagRun(dagId, dagRunId, pollInterval = 5000) {
  console.log(`Monitoring DAG run: ${dagRunId}`);
  
  const checkStatus = async () => {
    try {
      const response = await axios.get(
        `http://localhost:3001/api/dags/${dagId}/dagRuns`
      );
      
      const run = response.data.dag_runs.find(r => r.dag_run_id === dagRunId);
      
      if (!run) {
        console.log('Run not found');
        return null;
      }
      
      console.log(`Status: ${run.state}`);
      
      // Terminal states
      if (['success', 'failed'].includes(run.state)) {
        console.log(`DAG run completed with state: ${run.state}`);
        return run;
      }
      
      // Continue monitoring
      setTimeout(checkStatus, pollInterval);
      
    } catch (error) {
      console.error('Error checking status:', error.message);
    }
  };
  
  await checkStatus();
}

// Usage
monitorDagRun('example_dag', 'manual__2024-01-01T00:00:00+00:00');
```

**Python with polling**:
```python
import time

def monitor_dag_run(dag_id, dag_run_id, poll_interval=5):
    """Monitor DAG run until completion"""
    print(f"Monitoring DAG run: {dag_run_id}")
    
    while True:
        try:
            url = f"http://localhost:3001/api/dags/{dag_id}/dagRuns"
            response = requests.get(url)
            response.raise_for_status()
            
            data = response.json()
            runs = data['dag_runs']
            
            # Find our run
            run = next((r for r in runs if r['dag_run_id'] == dag_run_id), None)
            
            if not run:
                print("Run not found")
                return None
            
            state = run['state']
            print(f"Status: {state}")
            
            # Check if completed
            if state in ['success', 'failed']:
                print(f"DAG run completed with state: {state}")
                return run
            
            # Wait before next check
            time.sleep(poll_interval)
            
        except requests.exceptions.RequestException as e:
            print(f"Error checking status: {e}")
            time.sleep(poll_interval)

# Usage
monitor_dag_run('example_dag', 'manual__2024-01-01T00:00:00+00:00')
```

---

### Example 4: Pause/Unpause DAG

**JavaScript**:
```javascript
async function pauseDag(dagId) {
  try {
    const response = await axios.patch(
      `http://localhost:3001/api/dags/${dagId}`,
      { is_paused: true }
    );
    console.log(`DAG ${dagId} paused successfully`);
    return response.data;
  } catch (error) {
    console.error('Failed to pause DAG:', error.message);
    throw error;
  }
}

async function unpauseDag(dagId) {
  try {
    const response = await axios.patch(
      `http://localhost:3001/api/dags/${dagId}`,
      { is_paused: false }
    );
    console.log(`DAG ${dagId} unpaused successfully`);
    return response.data;
  } catch (error) {
    console.error('Failed to unpause DAG:', error.message);
    throw error;
  }
}

// Usage
await pauseDag('example_dag');
await unpauseDag('example_dag');
```

---

## Advanced API Usage

### Example 5: Batch Operations

**Trigger Multiple DAGs**:
```javascript
async function triggerMultipleDags(dagIds, config = {}) {
  const results = await Promise.allSettled(
    dagIds.map(dagId => 
      axios.post(
        `http://localhost:3001/api/dags/${dagId}/dagRuns`,
        { conf: config }
      )
    )
  );
  
  results.forEach((result, index) => {
    const dagId = dagIds[index];
    if (result.status === 'fulfilled') {
      console.log(`✓ ${dagId}: ${result.value.data.dag_run_id}`);
    } else {
      console.error(`✗ ${dagId}: ${result.reason.message}`);
    }
  });
  
  return results;
}

// Usage
triggerMultipleDags(
  ['dag1', 'dag2', 'dag3'],
  { environment: 'production' }
);
```

**Pause Multiple DAGs**:
```javascript
async function pauseMultipleDags(dagIds) {
  const results = await Promise.allSettled(
    dagIds.map(dagId =>
      axios.patch(
        `http://localhost:3001/api/dags/${dagId}`,
        { is_paused: true }
      )
    )
  );
  
  const succeeded = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  
  console.log(`Paused ${succeeded} DAGs, ${failed} failed`);
  return results;
}

// Usage
pauseMultipleDags(['dag1', 'dag2', 'dag3']);
```

---

### Example 6: Get DAG Run Details with Tasks

**JavaScript**:
```javascript
async function getDagRunWithTasks(dagId, dagRunId) {
  try {
    // Get DAG run details
    const runsResponse = await axios.get(
      `http://localhost:3001/api/dags/${dagId}/dagRuns`
    );
    
    const run = runsResponse.data.dag_runs.find(
      r => r.dag_run_id === dagRunId
    );
    
    if (!run) {
      throw new Error('DAG run not found');
    }
    
    // Get task instances
    const encodedRunId = encodeURIComponent(dagRunId);
    const tasksResponse = await axios.get(
      `http://localhost:3001/api/dags/${dagId}/dagRuns/${encodedRunId}/taskInstances`
    );
    
    return {
      run: run,
      tasks: tasksResponse.data.task_instances
    };
    
  } catch (error) {
    console.error('Failed to get DAG run details:', error.message);
    throw error;
  }
}

// Usage
const details = await getDagRunWithTasks(
  'example_dag',
  'manual__2024-01-01T00:00:00+00:00'
);

console.log('Run state:', details.run.state);
console.log('Tasks:');
details.tasks.forEach(task => {
  console.log(`- ${task.task_id}: ${task.state} (${task.duration}s)`);
});
```
