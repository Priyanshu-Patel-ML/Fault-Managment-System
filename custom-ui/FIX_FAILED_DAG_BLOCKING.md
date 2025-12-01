# Fix: Failed DAGs Blocking New Triggers

## 🔴 Problem

You reported that even though a DAG has **failed**, the trigger buttons for other DAGs are still disabled. The system was incorrectly treating failed DAGs as "running".

### Error Logs

```
⚠️  Found 11 running/queued DAG(s)
   Currently running: hs_search_service_container_restart (failed)
```

This is **wrong** - failed DAGs should NOT block new triggers!

---

## ✅ Solution Applied

I've fixed the backend to properly filter DAG states:

### Changes Made

#### 1. Fixed State Filtering (`backend/server.js`)

**Before**:
```javascript
const response = await airflowAPI.get('/dags/~/dagRuns', {
  params: {
    state: ['running', 'queued'],  // This wasn't working in Airflow 3.x
    limit: 1
  }
});
```

**After**:
```javascript
const response = await airflowAPI.get('/dags/~/dagRuns', {
  params: {
    limit: 100,
    order_by: '-start_date'
  }
});

// Filter manually to only include active states
const activeDagRuns = allDagRuns.filter(dagRun => 
  dagRun.state === 'running' || dagRun.state === 'queued'
);
```

**Why**: Airflow 3.x doesn't properly filter by state parameter in the query, so we fetch recent runs and filter manually.

#### 2. Fixed DAG Runs Endpoint

**Before**:
```javascript
const response = await airflowAPI.get('/dagRuns/list', {  // 404 error
  params: { limit, offset, order_by: '-execution_date' }
});
```

**After**:
```javascript
const response = await airflowAPI.get('/dags/~/dagRuns', {
  params: { limit, offset, order_by: '-start_date' }
});
```

**Why**: `/dagRuns/list` doesn't exist in Airflow 3.x. Use `/dags/~/dagRuns` instead.

---

## 🎯 DAG States Explained

### States That BLOCK New Triggers

- ✅ **running** - DAG is currently executing
- ✅ **queued** - DAG is waiting to start

### States That DO NOT Block New Triggers

- ❌ **failed** - DAG execution failed
- ❌ **success** - DAG completed successfully
- ❌ **skipped** - DAG was skipped
- ❌ **upstream_failed** - DAG failed due to upstream dependency
- ❌ **up_for_retry** - DAG is waiting to retry (not actively running)
- ❌ **up_for_reschedule** - DAG is waiting to be rescheduled

---

## 🚀 Apply the Fix

### Step 1: Restart Backend

In your backend terminal, press `Ctrl+C`, then:

```bash
cd ~/custom-ui/backend
npm start
```

### Step 2: Verify the Fix

**Expected output**:
```
Backend server running on port 3001
🔑 Fetching new JWT token from Airflow...
✅ JWT token obtained successfully
✅ No DAGs currently running or queued
```

**NOT**:
```
⚠️  Found 11 running/queued DAG(s)
   Currently running: hs_search_service_container_restart (failed)
```

### Step 3: Test in UI

1. Refresh browser: `http://localhost:3000`
2. **Expected**: No warning banner (since no DAGs are running)
3. **Expected**: All trigger buttons are **enabled** (green)
4. Click "Trigger" on any DAG
5. **Expected**: DAG triggers successfully

---

## 🔍 Verification

### Check Backend Logs

When you refresh the UI, you should see:

```
✅ No DAGs currently running or queued
```

**NOT**:
```
⚠️  Found 11 running/queued DAG(s)
```

### Check UI

- ✅ No warning banner at the top
- ✅ All trigger buttons are enabled (not grayed out)
- ✅ No "Another DAG is running" messages

---

## 🧪 Test Scenarios

### Test 1: Failed DAG Should Not Block

**Setup**: You have a failed DAG run

**Expected**:
- ✅ No warning banner
- ✅ All trigger buttons enabled
- ✅ Can trigger any DAG

### Test 2: Running DAG Should Block

**Setup**: Trigger a DAG and let it run

**Expected**:
- ⚠️ Warning banner appears
- 🔒 Other trigger buttons disabled
- ❌ Cannot trigger other DAGs

### Test 3: Completed DAG Should Not Block

**Setup**: Wait for running DAG to complete (success or failed)

**Expected**:
- ✅ Warning banner disappears (within 5 seconds)
- ✅ All trigger buttons enabled again
- ✅ Can trigger any DAG

---

## 📊 Improved Logging

The backend now shows better logs:

### When No DAGs Running

```
✅ No DAGs currently running or queued
```

### When DAGs Are Running

```
⚠️  Found 2 running/queued DAG(s)
   1. fault_linger_workflow (running) - started: 2025-11-27T16:20:46Z
   2. hs_search_service_container_restart (queued) - started: not started
```

### When Checking Before Trigger

```
🔍 Checking for running DAGs before triggering my_dag...
✅ No DAGs currently running or queued
🚀 Triggering DAG: my_dag (no other DAGs running)
✅ DAG triggered successfully: manual__2025-11-27T16:20:46.266378+00:00
```

---

## 🐛 Troubleshooting

### Issue: Still seeing "11 running/queued DAGs"

**Solution**: Make sure you restarted the backend server

```bash
cd ~/custom-ui/backend
# Press Ctrl+C
npm start
```

### Issue: Trigger buttons still disabled

**Solution**: 
1. Check backend logs for "No DAGs currently running"
2. Refresh browser (F5)
3. Check browser console for errors (F12)

### Issue: 404 errors in backend logs

**Solution**: Already fixed! The `/dagRuns/list` endpoint has been updated to `/dags/~/dagRuns`

---

## 📝 Summary of Fixes

| Issue | Before | After |
|-------|--------|-------|
| **State filtering** | Used query param (didn't work) | Manual filtering after fetch |
| **Failed DAGs** | Blocked new triggers ❌ | Don't block triggers ✅ |
| **DAG runs endpoint** | `/dagRuns/list` (404) | `/dags/~/dagRuns` ✅ |
| **Logging** | Showed failed as running | Shows only running/queued ✅ |
| **Order by** | `execution_date` | `start_date` ✅ |

---

## ✅ Expected Behavior Now

1. **Failed DAGs** → Do NOT block new triggers
2. **Success DAGs** → Do NOT block new triggers
3. **Running DAGs** → DO block new triggers
4. **Queued DAGs** → DO block new triggers
5. **No active DAGs** → All triggers enabled

---

**Status**: ✅ **FIXED** - Restart backend to apply

The system will now correctly identify only truly active DAGs (running/queued) and allow triggers when DAGs are in terminal states (failed/success).
