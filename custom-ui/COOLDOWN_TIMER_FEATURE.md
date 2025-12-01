# Live Countdown Timer for Cooldown Period

## 🎯 Feature Overview

Added a **live countdown timer** to the cooldown banner that updates every second, showing users exactly how much time remains before they can trigger the next fault.

---

## ✨ What's New

### **Before**
```
⏳ Cooldown Period Active
Last fault "fault_A" completed 8 minutes ago
Wait 7 more minutes before triggering next fault
```
- Static text showing "7 more minutes"
- Only updates every 5 seconds (when status is polled)
- Not precise

### **After**
```
⏳ Cooldown Period Active
Last fault "fault_A" completed 8 minutes ago

┌─────────────────────────┐
│ Time Remaining: 6:42    │  ← Live countdown!
└─────────────────────────┘

(15-minute cooldown period after each fault completion)
```
- **Live countdown timer** in MM:SS format
- Updates **every second** in real-time
- Precise to the second
- Prominent blue box with animation
- Monospace font for easy reading

---

## 🎨 Visual Design

### Timer Display

**Format**: `MM:SS` (Minutes:Seconds)

**Examples**:
- `14:59` - 14 minutes, 59 seconds remaining
- `10:30` - 10 minutes, 30 seconds remaining
- `5:00` - 5 minutes exactly
- `0:45` - 45 seconds remaining
- `0:00` - Cooldown expired

### Styling

```css
.cooldown-timer {
  background: Blue gradient (#1976d2 → #2196f3)
  padding: 12px 20px
  border-radius: 8px
  box-shadow: Subtle blue shadow
  animation: Gentle pulse (1s)
}

.cooldown-timer strong {
  color: White
  font-size: 24px
  font-weight: 700
  letter-spacing: 2px
  font-family: 'Courier New', monospace
  text-shadow: Subtle shadow
}
```

**Animation**: Gentle pulsing effect (scales from 1.0 to 1.02 and back)

---

## 🔧 How It Works

### 1. **Timer Calculation**

```javascript
// Get the fault end time from backend
const endDate = new Date(runningStatus.cooldown_info.end_date);

// Calculate when cooldown expires (15 minutes after end)
const cooldownEndTime = new Date(endDate.getTime() + (15 * 60 * 1000));

// Calculate remaining time
const now = new Date();
const remainingMs = cooldownEndTime - now;

// Convert to minutes and seconds
const totalSeconds = Math.floor(remainingMs / 1000);
const minutes = Math.floor(totalSeconds / 60);
const seconds = totalSeconds % 60;
```

### 2. **Real-Time Updates**

```javascript
useEffect(() => {
  if (runningStatus?.in_cooldown) {
    // Update timer immediately
    updateTimer();
    
    // Then update every second
    const timerInterval = setInterval(updateTimer, 1000);
    
    // Cleanup on unmount
    return () => clearInterval(timerInterval);
  }
}, [runningStatus]);
```

### 3. **Auto-Refresh on Expiry**

When the timer reaches `0:00`, it automatically refreshes the status to clear the cooldown banner.

---

## 📊 User Experience

### Timeline Example

```
Fault completes at 10:00:00 AM
↓
Cooldown starts (15 minutes)
↓
10:00:05 - Timer shows: 14:55
10:00:10 - Timer shows: 14:50
10:01:00 - Timer shows: 14:00
10:05:00 - Timer shows: 10:00
10:10:00 - Timer shows: 5:00
10:14:00 - Timer shows: 1:00
10:14:30 - Timer shows: 0:30
10:14:59 - Timer shows: 0:01
10:15:00 - Timer shows: 0:00 → Auto-refresh → Cooldown cleared!
```

### Visual Feedback

1. **Timer updates every second** - Users see progress
2. **Monospace font** - Digits don't shift as numbers change
3. **Pulsing animation** - Draws attention to the timer
4. **Blue gradient** - Matches cooldown theme
5. **Large font (24px)** - Easy to read at a glance

---

## 🎯 Benefits

### For Users

✅ **Know exact time remaining** - No guessing
✅ **See progress in real-time** - Countdown ticking
✅ **Plan accordingly** - Know when to come back
✅ **No manual refresh needed** - Auto-updates

### For System

✅ **Better UX** - Professional, polished feel
✅ **Reduced confusion** - Clear visual feedback
✅ **Less support requests** - Users understand the wait
✅ **Auto-cleanup** - Refreshes when timer expires

---

## 📁 Files Modified

### 1. `frontend/src/components/DagList.jsx`

**Added**:
- `cooldownTimer` state to store minutes and seconds
- `useEffect` hook to update timer every second
- Timer calculation logic
- Auto-refresh when timer reaches 0:00

**Changes**:
```jsx
// New state
const [cooldownTimer, setCooldownTimer] = useState(null);

// New useEffect for timer
useEffect(() => {
  // Calculate and update timer every second
}, [runningStatus]);

// Updated banner with timer display
{cooldownTimer && (
  <div className="cooldown-timer">
    <strong>Time Remaining: {cooldownTimer.minutes}:{cooldownTimer.seconds.toString().padStart(2, '0')}</strong>
  </div>
)}
```

### 2. `frontend/src/components/DagList.css`

**Added**:
```css
.cooldown-timer {
  /* Blue gradient box with shadow */
}

.cooldown-timer strong {
  /* Large white monospace text */
}

@keyframes pulse-timer {
  /* Gentle pulsing animation */
}
```

---

## 🚀 Testing

### Step 1: Trigger a Fault

Trigger any fault and wait for it to complete.

### Step 2: Watch the Timer

After the fault completes, you should see:

1. ✅ Blue cooldown banner appears
2. ✅ Timer shows in format `14:59`
3. ✅ Timer counts down every second: `14:58`, `14:57`, `14:56`...
4. ✅ Timer has gentle pulsing animation
5. ✅ When timer reaches `0:00`, banner disappears

### Step 3: Verify Accuracy

- Timer should match the actual remaining time
- Should update smoothly every second
- Should not skip or jump

---

## 🎨 Visual Preview

```
┌─────────────────────────────────────────────────────────────┐
│ ⏳  Cooldown Period Active                                  │
│                                                             │
│ Last fault "fault_linger_workflow" completed 2 minutes ago  │
│                                                             │
│ ┌─────────────────────────┐                                │
│ │ Time Remaining: 13:00   │  ← Blue box, white text       │
│ └─────────────────────────┘                                │
│                                                             │
│ (15-minute cooldown period after each fault completion)     │
└─────────────────────────────────────────────────────────────┘
```

**Colors**:
- Banner background: Light blue gradient
- Timer box: Dark blue gradient
- Timer text: White, 24px, monospace
- Animation: Gentle pulse

---

## ⚙️ Configuration

### Change Timer Update Frequency

Edit `frontend/src/components/DagList.jsx`:

```javascript
// Current: Updates every 1 second
const timerInterval = setInterval(updateTimer, 1000);

// Change to 500ms for faster updates:
const timerInterval = setInterval(updateTimer, 500);
```

### Change Timer Format

```javascript
// Current format: MM:SS
<strong>Time Remaining: {cooldownTimer.minutes}:{cooldownTimer.seconds.toString().padStart(2, '0')}</strong>

// Alternative: Show hours if needed
<strong>Time Remaining: {Math.floor(cooldownTimer.minutes/60)}:{(cooldownTimer.minutes%60).toString().padStart(2, '0')}:{cooldownTimer.seconds.toString().padStart(2, '0')}</strong>
```

---

## ✨ Summary

✅ **Live countdown timer** updates every second
✅ **MM:SS format** (e.g., 13:45)
✅ **Prominent display** in blue gradient box
✅ **Monospace font** for stable display
✅ **Pulsing animation** for visual interest
✅ **Auto-refresh** when timer expires
✅ **Error handling** for invalid dates

**The timer makes the cooldown period much more user-friendly!** ⏳🎉
