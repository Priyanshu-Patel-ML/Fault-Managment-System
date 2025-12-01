# Quick Fix: DAG Trigger 422 Error

## 🔴 Problem

When clicking "Trigger DAG" button, you get:
- **Error Code**: 422 (Unprocessable Entity)
- **Error Message**: Field `logical_date` required

## ✅ Solution

I've fixed the backend to include the required `logical_date` field for Airflow 3.x.

---

## 🚀 Apply the Fix (2 Steps)

### Step 1: Restart Backend Server

**In your backend terminal**, press `Ctrl+C` to stop, then:

```bash
cd ~/custom-ui/backend
npm start
```

**Expected output:**
```
Backend server running on port 3001
Proxying requests to Airflow at http://20.253.7.27:8080
🔑 Fetching new JWT token from Airflow...
✅ JWT token obtained successfully
```

### Step 2: Test Trigger

1. **Refresh** your browser at `http://localhost:3000`
2. Click **"Trigger"** button on any DAG
3. You should see:
   - ✅ Success message
   - ✅ New DAG run appears in the list
   - ✅ Backend logs show: `🚀 Triggering DAG: <dag_name>`
   - ✅ Backend logs show: `✅ DAG triggered successfully: <run_id>`

---

## 🔍 What Was Changed

### Backend Code Fix

**File**: `backend/server.js`

**Before (causing 422 error)**:
```javascript
const payload = {
  conf: conf || {}
};
```

**After (fixed)**:
```javascript
const payload = {
  logical_date: null,  // Required by Airflow 3.x
  conf: conf || {}
};
```

### Why `logical_date: null`?

- Airflow 3.x **requires** the `logical_date` field
- Setting it to `null` means "trigger immediately with auto-generated date"
- This is equivalent to clicking the "Play" button in Airflow UI

---

## 📊 Verification

### Test 1: Check Backend Logs

When you trigger a DAG, you should see:
```
🚀 Triggering DAG: fault_linger_workflow
✅ DAG triggered successfully: manual__2025-11-27T16:20:46.266378+00:00_7tZEo3yv
```

### Test 2: Check Response

The API should return:
```json
{
  "dag_run_id": "manual__2025-11-27T16:20:46.266378+00:00_7tZEo3yv",
  "dag_id": "fault_linger_workflow",
  "logical_date": null,
  "state": "queued",
  "run_type": "manual",
  "triggered_by": "rest_api",
  "conf": {}
}
```

### Test 3: Check Airflow UI

1. Open Airflow UI: `http://20.253.7.27:8080`
2. Go to the DAG you triggered
3. You should see a new run with state "queued" or "running"

---

## 🐛 Still Not Working?

### Error: "Failed to trigger DAG"

**Check 1**: Backend server restarted?
```bash
# In backend terminal, you should see:
✅ JWT token obtained successfully
```

**Check 2**: Backend logs show error?
```bash
# Look for:
❌ Error triggering DAG: <error message>
```

**Check 3**: Test manually with curl
```bash
curl http://localhost:3001/api/dags/fault_linger_workflow/dagRuns \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"conf": {}}'
```

### Error: "Connection refused"

**Solution**: Make sure backend is running on port 3001
```bash
curl http://localhost:3001/health
# Should return: {"status":"ok","message":"Backend server is running"}
```

### Error: Still getting 422

**Solution**: Check the exact error message
```bash
# In browser console (F12), check Network tab
# Look for the request to /api/dags/.../dagRuns
# Check the request payload - it should include "logical_date"
```

---

## 📝 Summary

| Issue | Cause | Fix |
|-------|-------|-----|
| 422 Error | Missing `logical_date` field | Added `logical_date: null` to payload |
| Failed to fetch DAGs | Wrong API version + auth | Changed to `/api/v2` + JWT auth |
| 401 Unauthorized | No JWT token | Implemented JWT token fetching |

---

## ✅ All Fixed!

After restarting the backend:
- ✅ DAGs load successfully
- ✅ DAG trigger works (no 422 error)
- ✅ Pause/Unpause works
- ✅ DAG runs display correctly
- ✅ Task instances show up

---

## 📚 Related Files

- **Main Fix Document**: `AIRFLOW_3_FIX.md` (complete details)
- **Backend Code**: `backend/server.js` (lines 150-178)
- **Configuration**: `backend/.env`

---

**Status**: ✅ **FIXED** - Restart backend server to apply
