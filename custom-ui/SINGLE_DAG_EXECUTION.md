# Single DAG Execution Feature

## 📋 Overview

This feature ensures that **only one DAG can execute at a time** across your entire Airflow instance. When a DAG is running or queued, all other DAG trigger attempts will be blocked until the current DAG completes.

---

## 🎯 Business Logic

### Rule: One DAG at a Time

- ✅ **Allowed**: Trigger a DAG when no other DAG is running or queued
- ❌ **Blocked**: Trigger a DAG when another DAG is running or queued
- 🔄 **Auto-check**: System checks running status before every trigger
- 📊 **Real-time**: UI updates every 5 seconds to show current running status

---

## 🔧 How It Works

### Backend Logic

**File**: `backend/server.js`

#### 1. Check Running DAGs

Before triggering any DAG, the backend calls `isAnyDagRunning()` function:

```javascript
async function isAnyDagRunning() {
  // Query Airflow for DAGs in 'running' or 'queued' state
  const response = await airflowAPI.get('/dags/~/dagRuns', {
    params: {
      state: ['running', 'queued'],
      limit: 1
    }
  });
  
  return {
    isRunning: response.data.total_entries > 0,
    count: response.data.total_entries,
    runningDags: response.data.dag_runs
  };
}
```

#### 2. Enforce Single Execution

When triggering a DAG:

```javascript
// Check if any DAG is running
const runningStatus = await isAnyDagRunning();

if (runningStatus.isRunning) {
  // Return 409 Conflict error
  return res.status(409).json({
    error: 'Conflict',
    message: 'Cannot trigger DAG. Another DAG is currently running',
    details: {
      currently_running: {
        dag_id: runningDag.dag_id,
        state: runningDag.state,
        ...
      }
    }
  });
}

// Otherwise, proceed with trigger
```

#### 3. Status Endpoint

New endpoint to check running status:

```
GET /api/status/running
```

**Response**:
```json
{
  "has_running_dags": true,
  "running_count": 1,
  "running_dags": [
    {
      "dag_id": "fault_linger_workflow",
      "dag_run_id": "manual__2025-11-27T16:20:46.266378+00:00",
      "state": "running",
      "start_date": "2025-11-27T16:20:46Z",
      "logical_date": null
    }
  ]
}
```

---

### Frontend Logic

**File**: `frontend/src/components/DagList.jsx`

#### 1. Poll Running Status

The UI polls the running status every 5 seconds:

```javascript
useEffect(() => {
  fetchRunningStatus();
  
  // Poll every 5 seconds
  const interval = setInterval(fetchRunningStatus, 5000);
  return () => clearInterval(interval);
}, []);
```

#### 2. Show Warning Banner

When a DAG is running, a prominent warning banner appears:

```jsx
{runningStatus?.has_running_dags && (
  <div className="warning-banner">
    <strong>DAG Currently Running:</strong> {runningStatus.running_dags[0].dag_id}
    <br />
    State: {runningStatus.running_dags[0].state} | Only one DAG can run at a time
  </div>
)}
```

#### 3. Disable Trigger Buttons

All trigger buttons are disabled when another DAG is running:

```javascript
disabled={
  dag.is_paused || 
  triggeringDag === dag.dag_id || 
  (runningStatus?.has_running_dags && runningStatus.running_dags[0].dag_id !== dag.dag_id)
}
```

#### 4. Handle 409 Error

If a trigger attempt fails due to conflict:

```javascript
if (err.response?.status === 409) {
  setError(
    `Cannot trigger DAG. Another DAG is currently running: ${runningDag.dag_id}. ` +
    `Only one DAG can run at a time.`
  );
}
```

---

## 🎨 User Experience

### Visual Indicators

1. **Warning Banner** (Yellow/Orange)
   - Shows which DAG is currently running
   - Displays current state (running/queued)
   - Pulses to draw attention

2. **Disabled Buttons**
   - Trigger buttons are grayed out
   - Tooltip shows reason: "Another DAG is running: {dag_id}"

3. **Error Messages**
   - Clear error message if trigger is attempted
   - Shows which DAG is blocking the trigger

### User Flow

```
User clicks "Trigger" button
         ↓
Frontend checks running status
         ↓
    Is another DAG running?
         ↓
    YES → Show alert: "Cannot trigger, DAG X is running"
         ↓
    NO → Show confirmation: "Are you sure?"
         ↓
    User confirms
         ↓
Backend checks running status again
         ↓
    Is another DAG running?
         ↓
    YES → Return 409 error with details
         ↓
    NO → Trigger DAG successfully
```

---

## 📊 Testing

### Test Case 1: Trigger When No DAG Running

**Steps**:
1. Ensure no DAGs are running
2. Click "Trigger" on any DAG
3. Confirm the trigger

**Expected**:
- ✅ DAG triggers successfully
- ✅ Warning banner appears showing the triggered DAG
- ✅ All other trigger buttons become disabled

### Test Case 2: Trigger When DAG Already Running

**Steps**:
1. Trigger a DAG (let it run)
2. Try to trigger another DAG

**Expected**:
- ❌ Alert appears: "Cannot trigger DAG. Another DAG is currently running"
- ❌ Trigger button is disabled
- ⚠️ Warning banner shows the running DAG

### Test Case 3: Multiple Users

**Steps**:
1. User A triggers DAG X
2. User B tries to trigger DAG Y (from different browser)

**Expected**:
- ❌ User B gets 409 error
- ❌ Error message shows DAG X is running
- ✅ DAG Y is not triggered

---

## 🔍 Monitoring

### Backend Logs

When a DAG is blocked:
```
🔍 Checking for running DAGs before triggering my_dag...
⚠️  Found 1 running/queued DAG(s)
   Currently running: fault_linger_workflow (running)
❌ Cannot trigger DAG. Another DAG is currently running: fault_linger_workflow
```

When a DAG is allowed:
```
🔍 Checking for running DAGs before triggering my_dag...
🚀 Triggering DAG: my_dag (no other DAGs running)
✅ DAG triggered successfully: manual__2025-11-27T16:20:46.266378+00:00
```

---

## ⚙️ Configuration

### Polling Interval

To change how often the UI checks for running DAGs:

**File**: `frontend/src/components/DagList.jsx`

```javascript
// Change 5000 (5 seconds) to your desired interval in milliseconds
const interval = setInterval(fetchRunningStatus, 5000);
```

### States Considered "Running"

**File**: `backend/server.js`

```javascript
// Currently checks for 'running' and 'queued' states
params: {
  state: ['running', 'queued'],  // Add more states if needed
  limit: 1
}
```

---

## 🚀 Apply the Changes

### Step 1: Restart Backend

```bash
cd ~/custom-ui/backend
# Press Ctrl+C to stop
npm start
```

### Step 2: Restart Frontend (if needed)

```bash
cd ~/custom-ui/frontend
# Press Ctrl+C to stop
npm run dev
```

### Step 3: Test

1. Open browser: `http://localhost:3000`
2. Trigger a DAG
3. Try to trigger another DAG
4. Verify the warning banner appears
5. Verify other trigger buttons are disabled

---

## 📝 Summary

| Feature | Status |
|---------|--------|
| Single DAG execution enforcement | ✅ Implemented |
| Backend validation | ✅ Implemented |
| Frontend validation | ✅ Implemented |
| Visual warning banner | ✅ Implemented |
| Disabled buttons | ✅ Implemented |
| Real-time status polling | ✅ Implemented (5s interval) |
| Error handling | ✅ Implemented (409 Conflict) |
| User-friendly messages | ✅ Implemented |

---

**Status**: ✅ **READY** - Restart backend and frontend to apply
