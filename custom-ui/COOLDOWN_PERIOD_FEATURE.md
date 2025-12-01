# 15-Minute Cooldown Period Feature

## 🎯 Feature Overview

**Requirement**: After one fault finishes, other faults should only be available for triggering after 15 minutes from the previous fault's completion.

**Implementation**: Added a 15-minute cooldown period that starts when any fault completes (success, failed, skipped, etc.).

---

## 🔧 How It Works

### 1. **Fault Execution Rules**

| Scenario | Can Trigger New Fault? | Reason |
|----------|------------------------|--------|
| **No faults running** | ✅ YES (if cooldown expired) | System is idle |
| **Fault is running** | ❌ NO | Only one fault at a time |
| **Fault is queued** | ❌ NO | Only one fault at a time |
| **Fault completed < 15 min ago** | ❌ NO | Cooldown period active |
| **Fault completed ≥ 15 min ago** | ✅ YES | Cooldown period expired |

### 2. **Cooldown Period Logic**

```
Fault Completes (success/failed/skipped)
         ↓
    [Start Timer]
         ↓
   Wait 15 minutes
         ↓
  [Cooldown Expires]
         ↓
  Next Fault Can Trigger
```

### 3. **Terminal States (Trigger Cooldown)**

These fault states trigger the 15-minute cooldown:
- ✅ **success** - Fault completed successfully
- ❌ **failed** - Fault failed
- ⏭️ **skipped** - Fault was skipped
- 🔗 **upstream_failed** - Upstream dependency failed

### 4. **Active States (Block Immediately)**

These states block new triggers immediately (no cooldown needed):
- 🏃 **running** - Fault is currently executing
- ⏳ **queued** - Fault is waiting to execute

---

## 📋 Backend Implementation

### File: `backend/server.js`

#### Updated Function: `isAnyDagRunning()`

**New Logic**:
1. **Check for running/queued faults** (immediate block)
2. **Check for recently completed faults** (cooldown check)
3. **Calculate time since completion**
4. **Return cooldown status if < 15 minutes**

**Key Code**:
```javascript
// Check for cooldown period (15 minutes after last completed DAG)
const completedDagRuns = allDagRuns.filter(dagRun =>
  dagRun.state === 'success' || 
  dagRun.state === 'failed' || 
  dagRun.state === 'skipped' ||
  dagRun.state === 'upstream_failed'
);

if (completedDagRuns.length > 0) {
  const mostRecentCompleted = completedDagRuns[0];
  const endDate = mostRecentCompleted.end_date;
  
  if (endDate) {
    const endTime = new Date(endDate);
    const now = new Date();
    const timeSinceCompletion = now - endTime;
    const cooldownPeriod = 15 * 60 * 1000; // 15 minutes
    
    if (timeSinceCompletion < cooldownPeriod) {
      const remainingTime = Math.ceil((cooldownPeriod - timeSinceCompletion) / 1000 / 60);
      return {
        isRunning: true,
        inCooldown: true,
        cooldownInfo: {
          last_dag_id: mostRecentCompleted.dag_id,
          last_dag_state: mostRecentCompleted.state,
          end_date: endDate,
          minutes_since_completion: Math.floor(timeSinceCompletion / 1000 / 60),
          remaining_cooldown_minutes: remainingTime
        },
        reason: 'cooldown'
      };
    }
  }
}
```

#### Updated Endpoint: `POST /api/dags/:dagId/dagRuns`

**New Response (409 Conflict - Cooldown)**:
```json
{
  "error": "Conflict",
  "message": "Cannot trigger Fault. Cooldown period active...",
  "details": {
    "reason": "Cooldown period - must wait 15 minutes after previous fault completion",
    "in_cooldown": true,
    "last_completed_fault": {
      "dag_id": "fault_linger_workflow",
      "state": "success",
      "end_date": "2025-11-28T10:30:00Z",
      "minutes_since_completion": 8
    },
    "remaining_cooldown_minutes": 7,
    "cooldown_period_minutes": 15
  }
}
```

---

## 🎨 Frontend Implementation

### File: `frontend/src/components/DagList.jsx`

#### 1. **Cooldown Banner**

New blue banner displays when cooldown is active:

```jsx
{runningStatus?.in_cooldown && (
  <div className="cooldown-banner">
    <div className="cooldown-banner-content">
      <span className="cooldown-icon">⏳</span>
      <div className="cooldown-text">
        <strong>Cooldown Period Active</strong>
        <br />
        <small>
          Last fault "{runningStatus.cooldown_info.last_dag_id}" 
          completed {runningStatus.cooldown_info.minutes_since_completion} minutes ago |
          Wait {runningStatus.cooldown_info.remaining_cooldown_minutes} more minutes
          (15-minute cooldown period)
        </small>
      </div>
    </div>
  </div>
)}
```

#### 2. **Disabled Trigger Buttons**

Buttons are disabled during cooldown with tooltip:

```jsx
disabled={
  dag.is_paused ||
  triggeringDag === dag.dag_id ||
  (runningStatus?.has_running_dags && ...) ||
  runningStatus?.in_cooldown  // ← New condition
}

title={
  runningStatus?.in_cooldown
    ? `Cooldown period: Wait ${runningStatus.cooldown_info.remaining_cooldown_minutes} more minutes`
    : ...
}
```

#### 3. **Enhanced Error Handling**

```javascript
if (details?.in_cooldown) {
  const cooldown = details.last_completed_fault;
  setError(
    `Cannot trigger Fault - Cooldown Period Active. ` +
    `Last fault "${cooldown.dag_id}" completed ${cooldown.minutes_since_completion} minutes ago. ` +
    `Please wait ${details.remaining_cooldown_minutes} more minutes.`
  );
}
```

---

## 🎨 Visual Design

### Cooldown Banner Styling

**File**: `frontend/src/components/DagList.css`

```css
.cooldown-banner {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  border: 2px solid #2196f3;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
  animation: pulse-cooldown 2s ease-in-out infinite;
}
```

**Colors**:
- Background: Light blue gradient (`#e3f2fd` → `#bbdefb`)
- Border: Blue (`#2196f3`)
- Text: Dark blue (`#0d47a1`)
- Animation: Pulsing blue glow

---

## 📊 User Experience Flow

### Scenario 1: Fault Just Completed

```
1. User triggers "fault_A" → Starts running
2. "fault_A" completes (success) at 10:00 AM
3. User tries to trigger "fault_B" at 10:05 AM
   ❌ BLOCKED - Cooldown banner shows:
   "Wait 10 more minutes (15-minute cooldown)"
4. User waits until 10:15 AM
5. User triggers "fault_B" at 10:16 AM
   ✅ ALLOWED - Cooldown expired
```

### Scenario 2: Fault Failed

```
1. "fault_A" fails at 2:00 PM
2. Cooldown period starts (15 minutes)
3. User tries to trigger "fault_B" at 2:10 PM
   ❌ BLOCKED - "Wait 5 more minutes"
4. At 2:15 PM, cooldown expires
5. User can trigger any fault
   ✅ ALLOWED
```

---

## 🚀 Testing the Feature

### Step 1: Restart Backend

```bash
cd ~/custom-ui/backend
# Stop current backend (Ctrl+C)
npm start
```

### Step 2: Refresh Frontend

```bash
# Frontend should already be running
# Just refresh browser: F5
```

### Step 3: Test Cooldown

1. **Trigger a fault** (any fault)
2. **Wait for it to complete** (success or failed)
3. **Try to trigger another fault immediately**
   - ❌ Should see blue cooldown banner
   - ❌ Trigger buttons should be disabled
   - ℹ️ Tooltip shows remaining time
4. **Wait 15 minutes**
   - ✅ Cooldown banner disappears
   - ✅ Trigger buttons become enabled

---

## 🔍 Backend Logs

### During Cooldown

```
🔍 Checking for running DAGs before triggering fault_B...
⏳ Cooldown period active. Last DAG completed 8 minutes ago.
   DAG: fault_A (success)
   Ended: 2025-11-28T10:00:00Z
   Remaining cooldown: 7 minutes
❌ Cannot trigger Fault. Cooldown period active...
```

### After Cooldown Expires

```
🔍 Checking for running DAGs before triggering fault_B...
✅ No DAGs currently running or in cooldown period
🚀 Triggering DAG: fault_B (no other DAGs running)
✅ DAG triggered successfully: manual__2025-11-28T10:16:00Z
```

---

## ⚙️ Configuration

### Change Cooldown Duration

Edit `backend/server.js` line ~220:

```javascript
const cooldownPeriod = 15 * 60 * 1000; // 15 minutes in milliseconds

// Examples:
// 5 minutes:  5 * 60 * 1000
// 10 minutes: 10 * 60 * 1000
// 30 minutes: 30 * 60 * 1000
// 1 hour:     60 * 60 * 1000
```

After changing, restart the backend server.

---

## 📄 Files Modified

1. ✅ `backend/server.js` - Cooldown logic in `isAnyDagRunning()` and trigger endpoint
2. ✅ `frontend/src/components/DagList.jsx` - Cooldown banner, button states, error handling
3. ✅ `frontend/src/components/DagList.css` - Cooldown banner styling

---

## ✨ Summary

✅ **15-minute cooldown** after fault completion
✅ **Blue cooldown banner** with countdown
✅ **Disabled trigger buttons** during cooldown
✅ **Tooltips** show remaining time
✅ **Real-time updates** (polls every 5 seconds)
✅ **Clear error messages** explaining cooldown
✅ **Backend validation** prevents API abuse
✅ **Detailed logging** for debugging

**The cooldown feature is now fully implemented and ready to use!** 🎉
