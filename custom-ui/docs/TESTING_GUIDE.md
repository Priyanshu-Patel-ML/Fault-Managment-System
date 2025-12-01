# Testing Guide - Complete Reference

## Table of Contents
1. [Manual Testing](#manual-testing)
2. [API Testing](#api-testing)
3. [Frontend Testing](#frontend-testing)
4. [Integration Testing](#integration-testing)
5. [Performance Testing](#performance-testing)
6. [Security Testing](#security-testing)

## Manual Testing

### Testing Checklist

#### Backend Tests
- [ ] Server starts successfully
- [ ] Health endpoint responds
- [ ] Can connect to Airflow
- [ ] Authentication works
- [ ] All API endpoints respond
- [ ] Error handling works
- [ ] CORS is configured
- [ ] Environment variables load

#### Frontend Tests
- [ ] Application loads
- [ ] Navigation works
- [ ] DAG list displays
- [ ] Search functionality works
- [ ] Trigger button works
- [ ] Pause/unpause works
- [ ] DAG details page loads
- [ ] Task instances display
- [ ] All runs page works
- [ ] Error messages display
- [ ] Loading states show
- [ ] Responsive design works

### Step-by-Step Manual Testing

#### Test 1: Backend Health Check

**Steps**:
1. Start backend: `cd backend && npm start`
2. Open browser or use curl
3. Navigate to: `http://localhost:3001/health`

**Expected Result**:
```json
{
  "status": "ok",
  "message": "Backend server is running"
}
```

**Pass Criteria**: Status 200, JSON response received

---

#### Test 2: List DAGs

**Steps**:
1. Ensure backend is running
2. Use curl or browser
3. Request: `http://localhost:3001/api/dags`

**Expected Result**:
```json
{
  "dags": [...],
  "total_entries": 5
}
```

**Pass Criteria**: 
- Status 200
- Array of DAGs returned
- Each DAG has required fields (dag_id, is_paused, etc.)

---

#### Test 3: Trigger DAG

**Steps**:
1. Choose a DAG ID (e.g., "example_dag")
2. Send POST request:
```bash
curl -X POST http://localhost:3001/api/dags/example_dag/dagRuns \
  -H "Content-Type: application/json" \
  -d '{"conf": {}}'
```

**Expected Result**:
```json
{
  "dag_run_id": "manual__2024-01-01T...",
  "state": "queued",
  "dag_id": "example_dag"
}
```

**Pass Criteria**:
- Status 200
- DAG run created
- Run ID returned
- State is "queued"

**Verification**:
- Check Airflow UI for new run
- Check run appears in DAG runs list

---

#### Test 4: Frontend Navigation

**Steps**:
1. Start frontend: `cd frontend && npm run dev`
2. Open browser: `http://localhost:3000`
3. Click "DAGs" link
4. Click "All Runs" link
5. Click on a DAG name
6. Click back button

**Expected Result**:
- All pages load without errors
- Navigation is smooth
- No console errors
- URLs update correctly

**Pass Criteria**:
- No JavaScript errors
- All pages render
- Navigation works both ways

---

## API Testing

### Using cURL

#### Test All Endpoints

**1. Health Check**:
```bash
curl -v http://localhost:3001/health
```

**2. List DAGs**:
```bash
curl -v http://localhost:3001/api/dags
```

**3. Get DAG Details**:
```bash
curl -v http://localhost:3001/api/dags/example_dag
```

**4. Trigger DAG**:
```bash
curl -v -X POST http://localhost:3001/api/dags/example_dag/dagRuns \
  -H "Content-Type: application/json" \
  -d '{"conf": {"test": true}}'
```

**5. Pause DAG**:
```bash
curl -v -X PATCH http://localhost:3001/api/dags/example_dag \
  -H "Content-Type: application/json" \
  -d '{"is_paused": true}'
```

**6. Unpause DAG**:
```bash
curl -v -X PATCH http://localhost:3001/api/dags/example_dag \
  -H "Content-Type: application/json" \
  -d '{"is_paused": false}'
```

**7. Get DAG Runs**:
```bash
curl -v "http://localhost:3001/api/dags/example_dag/dagRuns?limit=10"
```

**8. Get All DAG Runs**:
```bash
curl -v "http://localhost:3001/api/dagRuns?limit=25"
```

**9. Get Task Instances**:
```bash
# URL encode the dag_run_id
DAG_RUN_ID="manual__2024-01-01T00:00:00+00:00"
ENCODED_ID=$(echo -n "$DAG_RUN_ID" | jq -sRr @uri)

curl -v "http://localhost:3001/api/dags/example_dag/dagRuns/${ENCODED_ID}/taskInstances"
```

### Using Postman

#### Setup Postman Collection

**1. Create Collection**:
- Name: "Custom Airflow UI"
- Base URL: `http://localhost:3001`

**2. Add Requests**:

**Health Check**:
```
GET {{baseUrl}}/health
```

**List DAGs**:
```
GET {{baseUrl}}/api/dags
```

**Trigger DAG**:
```
POST {{baseUrl}}/api/dags/{{dagId}}/dagRuns
Headers:
  Content-Type: application/json
Body (raw JSON):
{
  "conf": {
    "environment": "test",
    "batch_size": 100
  }
}
```

**3. Create Environment**:
```json
{
  "baseUrl": "http://localhost:3001",
  "dagId": "example_dag"
}
```

**4. Run Collection**:
- Click "Run Collection"
- Select all requests
- Click "Run Custom Airflow UI"

---

### Automated API Testing Script

**File**: `test-api.sh`
```bash
#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3001"
PASSED=0
FAILED=0

# Function to test endpoint
test_endpoint() {
  local name=$1
  local method=$2
  local endpoint=$3
  local data=$4
  
  echo -n "Testing $name... "
  
  if [ -z "$data" ]; then
    response=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$endpoint")
  else
    response=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$endpoint" \
      -H "Content-Type: application/json" \
      -d "$data")
  fi
  
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')
  
  if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
    echo -e "${GREEN}PASS${NC} (HTTP $http_code)"
    ((PASSED++))
  else
    echo -e "${RED}FAIL${NC} (HTTP $http_code)"
    echo "Response: $body"
    ((FAILED++))
  fi
}

echo "Starting API Tests..."
echo "===================="

# Run tests
test_endpoint "Health Check" "GET" "/health"
test_endpoint "List DAGs" "GET" "/api/dags"
test_endpoint "Get DAG Details" "GET" "/api/dags/example_dag"
test_endpoint "Trigger DAG" "POST" "/api/dags/example_dag/dagRuns" '{"conf":{}}'
test_endpoint "Get DAG Runs" "GET" "/api/dags/example_dag/dagRuns"
test_endpoint "Get All Runs" "GET" "/api/dagRuns"

echo "===================="
echo "Results: $PASSED passed, $FAILED failed"

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}Some tests failed!${NC}"
  exit 1
fi
```

**Usage**:
```bash
chmod +x test-api.sh
./test-api.sh
```

---

### Python Testing Script

**File**: `test_api.py`
```python
import requests
import sys

BASE_URL = "http://localhost:3001"
passed = 0
failed = 0

def test_endpoint(name, method, endpoint, data=None):
    global passed, failed
    
    print(f"Testing {name}... ", end="")
    
    try:
        url = f"{BASE_URL}{endpoint}"
        
        if method == "GET":
            response = requests.get(url)
        elif method == "POST":
            response = requests.post(url, json=data)
        elif method == "PATCH":
            response = requests.patch(url, json=data)
        
        if 200 <= response.status_code < 300:
            print(f"\033[92mPASS\033[0m (HTTP {response.status_code})")
            passed += 1
        else:
            print(f"\033[91mFAIL\033[0m (HTTP {response.status_code})")
            print(f"Response: {response.text}")
            failed += 1
            
    except Exception as e:
        print(f"\033[91mERROR\033[0m ({str(e)})")
        failed += 1

print("Starting API Tests...")
print("=" * 40)

# Run tests
test_endpoint("Health Check", "GET", "/health")
test_endpoint("List DAGs", "GET", "/api/dags")
test_endpoint("Get DAG Details", "GET", "/api/dags/example_dag")
test_endpoint("Trigger DAG", "POST", "/api/dags/example_dag/dagRuns", {"conf": {}})
test_endpoint("Get DAG Runs", "GET", "/api/dags/example_dag/dagRuns")
test_endpoint("Get All Runs", "GET", "/api/dagRuns")

print("=" * 40)
print(f"Results: {passed} passed, {failed} failed")

if failed == 0:
    print("\033[92mAll tests passed!\033[0m")
    sys.exit(0)
else:
    print("\033[91mSome tests failed!\033[0m")
    sys.exit(1)
```

**Usage**:
```bash
python test_api.py
```
