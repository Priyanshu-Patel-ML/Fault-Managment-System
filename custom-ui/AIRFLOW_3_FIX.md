# Airflow 3.x Compatibility Fix

## 🔍 Problems Identified

Your Airflow instance is running **Airflow 3.x**, which has breaking changes from Airflow 2.x:

### Problem 1: Failed to Fetch DAGs

1. **API Endpoint Changed**: `/api/v1` → `/api/v2`
2. **Authentication Changed**: Basic Auth → JWT Token Authentication

**Error Messages:**
```
"/api/v1 has been removed in Airflow 3, please use its upgraded version /api/v2 instead."
```

```
HTTP/1.1 401 Unauthorized
www-authenticate: Bearer
```

### Problem 2: Failed to Trigger DAG (Code 422)

3. **Trigger Payload Changed**: Airflow 3.x requires `logical_date` field

**Error Message:**
```json
{
  "detail": [{
    "type": "missing",
    "loc": ["body", "logical_date"],
    "msg": "Field required",
    "input": {"conf": {}}
  }]
}
```

---

## ✅ Solutions Applied

I've updated the backend server to support **Airflow 3.x** completely:

### Changes Made

1. **Updated API Version** (`backend/server.js`)
   - Changed from `/api/v1` to `/api/v2`
   - Made it configurable via `AIRFLOW_API_VERSION` environment variable

2. **Implemented JWT Token Authentication** (`backend/server.js`)
   - Added `getJWTToken()` function to fetch JWT tokens from `/auth/token`
   - Token is cached and auto-refreshed when expired (24-hour validity)
   - Added axios request interceptor to automatically include JWT token in all requests
   - Added axios response interceptor with retry logic for 401 errors
   - Auto-refresh token on expiry

3. **Fixed DAG Trigger Payload** (`backend/server.js`)
   - Added required `logical_date` field to trigger payload
   - Set `logical_date: null` to trigger immediately with auto-generated date
   - Added detailed logging for trigger operations

4. **Updated Configuration** (`backend/.env` and `backend/.env.example`)
   - Added `AIRFLOW_API_VERSION=v2` configuration option

---

## 🚀 How to Apply the Fix

### Step 1: Stop the Backend Server

In your terminal where backend is running, press `Ctrl+C` to stop it.

### Step 2: Restart the Backend Server

```bash
cd ~/custom-ui/backend
npm start
```

You should see:
```
Backend server running on port 3001
Proxying requests to Airflow at http://20.253.7.27:8080
🔑 Fetching new JWT token from Airflow...
✅ JWT token obtained successfully
```

### Step 3: Refresh Your Frontend

In your browser, refresh the page at `http://localhost:3000`

You should now see your DAGs:
- ✅ `fault_linger_workflow`
- ✅ `hs_search_service_container_restart`

---

## 📋 Verification

### Test 1: Check Backend Health

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{"status":"ok","message":"Backend server is running"}
```

### Test 2: Check DAGs Endpoint

```bash
curl http://localhost:3001/api/dags
```

Expected response: JSON with your DAGs

### Test 3: Check Frontend

Open browser: `http://localhost:3000`

You should see:
- List of DAGs
- Trigger buttons
- Pause/Unpause buttons
- No "Failed to fetch DAGs" error

---

## 🔧 Technical Details

### JWT Token Flow

```
1. Backend starts
   ↓
2. First API request comes in
   ↓
3. Backend calls POST /auth/token with username/password
   ↓
4. Airflow returns JWT token
   ↓
5. Backend caches token (valid for 24 hours)
   ↓
6. Backend adds "Authorization: Bearer <token>" to all API requests
   ↓
7. If token expires (401 error), backend auto-refreshes it
```

### Code Changes

#### Change 1: Authentication (Airflow 2.x → 3.x)

**Before (Airflow 2.x)**:
```javascript
const airflowAPI = axios.create({
  baseURL: `${AIRFLOW_BASE_URL}/api/v1`,
  auth: {
    username: AIRFLOW_USERNAME,
    password: AIRFLOW_PASSWORD
  }
});
```

**After (Airflow 3.x)**:
```javascript
// Get JWT token
async function getJWTToken() {
  const response = await axios.post(`${AIRFLOW_BASE_URL}/auth/token`, {
    username: AIRFLOW_USERNAME,
    password: AIRFLOW_PASSWORD
  });
  return response.data.access_token;
}

// Use JWT token in requests
const airflowAPI = axios.create({
  baseURL: `${AIRFLOW_BASE_URL}/api/v2`
});

airflowAPI.interceptors.request.use(async (config) => {
  const token = await getJWTToken();
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

#### Change 2: Trigger DAG Payload (Airflow 2.x → 3.x)

**Before (Airflow 2.x)**:
```javascript
// Trigger DAG
const payload = {
  conf: conf || {}
};
await airflowAPI.post(`/dags/${dagId}/dagRuns`, payload);
```

**After (Airflow 3.x)**:
```javascript
// Trigger DAG - requires logical_date field
const payload = {
  logical_date: null,  // null = trigger immediately
  conf: conf || {}
};
await airflowAPI.post(`/dags/${dagId}/dagRuns`, payload);
```

---

## 🎯 Your DAGs

I verified that your Airflow has **2 DAGs**:

### 1. fault_linger_workflow
- **Status**: Active (not paused)
- **Schedule**: `0 0 * * *` (Daily at midnight)
- **Description**: Container restart workflow for search-service
- **Severity**: Medium
- **Next Run**: 2025-11-28 00:00:00

### 2. hs_search_service_container_restart
- **Status**: Active (not paused)
- **Schedule**: `@once` (Run once)
- **Description**: Container restart workflow for search-service
- **Severity**: Medium
- **Target**: search-service
- **Duration**: 300 seconds

---

## 📝 Configuration Reference

### Environment Variables

```env
# Airflow Configuration
AIRFLOW_BASE_URL=http://20.253.7.27:8080
AIRFLOW_USERNAME=admin
AIRFLOW_PASSWORD=admin
AIRFLOW_API_VERSION=v2  # v1 for Airflow 2.x, v2 for Airflow 3.x

# Server Configuration
PORT=3001
NODE_ENV=development
```

---

## 🐛 Troubleshooting

### Issue: Still getting "Failed to fetch DAGs"

**Solution**:
1. Make sure you restarted the backend server
2. Check backend logs for JWT token messages
3. Clear browser cache and refresh

### Issue: "Failed to get JWT token"

**Solution**:
1. Verify Airflow is running: `curl http://20.253.7.27:8080/api/v2/monitor/health`
2. Verify credentials in `backend/.env`
3. Check backend logs for error details

### Issue: Backend won't start

**Solution**:
```bash
cd ~/custom-ui/backend
npm install
npm start
```

### Issue: DAG trigger returns 422 error

**Cause**: Missing `logical_date` field in request payload

**Solution**: Already fixed! The backend now includes `logical_date: null` in all trigger requests.

If you still see this error:
1. Make sure you restarted the backend server
2. Check backend logs for the trigger request
3. Verify the payload includes `logical_date`

---

## ✅ Next Steps

1. **Restart backend server** (see Step 1-2 above)
2. **Refresh frontend** in browser
3. **Test triggering a DAG** from the UI
4. **Verify DAG runs** are created successfully

---

## 📚 References

- [Airflow 3.x API Authentication](https://airflow.apache.org/docs/apache-airflow/stable/security/api.html)
- [Airflow 3.x REST API Reference](https://airflow.apache.org/docs/apache-airflow/stable/stable-rest-api-ref.html)
- [JWT Token Authentication](https://jwt.io/)

---

**Status**: ✅ Fix Applied - Ready to restart backend server
