# Customization Guide - Complete Reference

## Table of Contents
1. [Adding New Features](#adding-new-features)
2. [Customizing UI](#customizing-ui)
3. [Adding New API Endpoints](#adding-new-api-endpoints)
4. [Custom Components](#custom-components)
5. [Theming](#theming)
6. [Advanced Integrations](#advanced-integrations)

## Adding New Features

### Example: Add DAG Run Deletion

#### Step 1: Add Backend Endpoint

**File**: `backend/server.js`

```javascript
// Delete a DAG run
app.delete('/api/dags/:dagId/dagRuns/:dagRunId', async (req, res) => {
  try {
    const { dagId, dagRunId } = req.params;
    
    const response = await airflowAPI.delete(
      `/dags/${dagId}/dagRuns/${dagRunId}`
    );
    
    res.json(response.data);
  } catch (error) {
    console.error('Error deleting DAG run:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data
    });
  }
});
```

#### Step 2: Add Frontend API Function

**File**: `frontend/src/services/api.js`

```javascript
// Delete a DAG run
export const deleteDagRun = async (dagId, dagRunId) => {
  const encodedRunId = encodeURIComponent(dagRunId);
  const response = await apiClient.delete(
    `/dags/${dagId}/dagRuns/${encodedRunId}`
  );
  return response.data;
};
```

#### Step 3: Add UI Button

**File**: `frontend/src/components/DagDetails.jsx`

```javascript
const handleDeleteRun = async (dagRunId) => {
  if (!window.confirm('Are you sure you want to delete this run?')) {
    return;
  }
  
  try {
    await deleteDagRun(dagId, dagRunId);
    setSuccessMessage('DAG run deleted successfully');
    fetchDagRuns(); // Refresh list
  } catch (err) {
    setError(`Failed to delete run: ${err.message}`);
  }
};

// In JSX
<button 
  onClick={() => handleDeleteRun(run.dag_run_id)}
  className="btn-delete"
>
  🗑️ Delete
</button>
```

---

### Example: Add DAG Statistics

#### Step 1: Backend Endpoint

```javascript
app.get('/api/dags/:dagId/stats', async (req, res) => {
  try {
    const { dagId } = req.params;
    
    // Get all runs
    const runsResponse = await airflowAPI.get(`/dags/${dagId}/dagRuns`);
    const runs = runsResponse.data.dag_runs;
    
    // Calculate statistics
    const stats = {
      total_runs: runs.length,
      successful: runs.filter(r => r.state === 'success').length,
      failed: runs.filter(r => r.state === 'failed').length,
      running: runs.filter(r => r.state === 'running').length,
      avg_duration: runs.reduce((sum, r) => sum + (r.duration || 0), 0) / runs.length
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.message
    });
  }
});
```

#### Step 2: Frontend Component

```javascript
function DagStats({ dagId }) {
  const [stats, setStats] = useState(null);
  
  useEffect(() => {
    const fetchStats = async () => {
      const response = await axios.get(`/api/dags/${dagId}/stats`);
      setStats(response.data);
    };
    fetchStats();
  }, [dagId]);
  
  if (!stats) return <div>Loading stats...</div>;
  
  return (
    <div className="dag-stats">
      <h3>Statistics</h3>
      <div className="stats-grid">
        <div className="stat-item">
          <span className="stat-label">Total Runs</span>
          <span className="stat-value">{stats.total_runs}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Successful</span>
          <span className="stat-value success">{stats.successful}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Failed</span>
          <span className="stat-value failed">{stats.failed}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Avg Duration</span>
          <span className="stat-value">{stats.avg_duration.toFixed(2)}s</span>
        </div>
      </div>
    </div>
  );
}
```

---

## Customizing UI

### Changing Colors

**File**: `frontend/src/index.css`

```css
:root {
  /* Primary colors */
  --primary-color: #667eea;      /* Change to your brand color */
  --secondary-color: #764ba2;
  
  /* Status colors */
  --success-color: #4caf50;
  --error-color: #f44336;
  --warning-color: #ff9800;
  --info-color: #2196f3;
  
  /* Background colors */
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f5;
  --bg-dark: #1a1a1a;
  
  /* Text colors */
  --text-primary: #333333;
  --text-secondary: #666666;
  --text-light: #999999;
  
  /* Border colors */
  --border-color: #e0e0e0;
  --border-radius: 8px;
  
  /* Shadows */
  --shadow-sm: 0 2px 4px rgba(0,0,0,0.1);
  --shadow-md: 0 4px 8px rgba(0,0,0,0.15);
  --shadow-lg: 0 8px 16px rgba(0,0,0,0.2);
}

/* Dark mode */
[data-theme="dark"] {
  --bg-primary: #1a1a1a;
  --bg-secondary: #2a2a2a;
  --text-primary: #ffffff;
  --text-secondary: #cccccc;
  --border-color: #444444;
}
```

### Adding Dark Mode

**Step 1: Create Theme Context**

**File**: `frontend/src/contexts/ThemeContext.jsx`

```javascript
import React, { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(
    localStorage.getItem('theme') || 'light'
  );
  
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };
  
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
```

**Step 2: Wrap App**

**File**: `frontend/src/main.jsx`

```javascript
import { ThemeProvider } from './contexts/ThemeContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
```

**Step 3: Add Toggle Button**

**File**: `frontend/src/App.jsx`

```javascript
import { useTheme } from './contexts/ThemeContext';

function App() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <div className="App">
      <header>
        <h1>Custom Airflow UI</h1>
        <button onClick={toggleTheme}>
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </header>
      {/* Rest of app */}
    </div>
  );
}
```

---

## Adding New API Endpoints

### Example: Add DAG Code Viewer

#### Backend Endpoint

```javascript
app.get('/api/dags/:dagId/code', async (req, res) => {
  try {
    const { dagId } = req.params;
    
    // Get DAG details to find file location
    const dagResponse = await airflowAPI.get(`/dags/${dagId}`);
    const fileToken = dagResponse.data.file_token;
    
    // Get DAG source code
    const codeResponse = await airflowAPI.get(`/dagSources/${fileToken}`);
    
    res.json({
      dag_id: dagId,
      file_path: dagResponse.data.fileloc,
      code: codeResponse.data.content
    });
  } catch (error) {
    console.error('Error fetching DAG code:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.message
    });
  }
});
```

#### Frontend Component

```javascript
function DagCodeViewer({ dagId }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchCode = async () => {
      try {
        const response = await axios.get(`/api/dags/${dagId}/code`);
        setCode(response.data.code);
      } catch (err) {
        console.error('Failed to fetch code:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCode();
  }, [dagId]);
  
  if (loading) return <div>Loading code...</div>;
  
  return (
    <div className="code-viewer">
      <h3>DAG Source Code</h3>
      <pre>
        <code className="language-python">{code}</code>
      </pre>
    </div>
  );
}
```

---

## Custom Components

### Example: Reusable Status Badge

**File**: `frontend/src/components/StatusBadge.jsx`

```javascript
import React from 'react';
import './StatusBadge.css';

const STATUS_CONFIG = {
  success: { icon: '✓', color: '#4caf50', label: 'Success' },
  failed: { icon: '✗', color: '#f44336', label: 'Failed' },
  running: { icon: '▶', color: '#2196f3', label: 'Running' },
  queued: { icon: '⏳', color: '#ff9800', label: 'Queued' },
  scheduled: { icon: '📅', color: '#9e9e9e', label: 'Scheduled' }
};

export function StatusBadge({ status, showLabel = true }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.scheduled;
  
  return (
    <span 
      className="status-badge"
      style={{ backgroundColor: config.color }}
    >
      <span className="status-icon">{config.icon}</span>
      {showLabel && <span className="status-label">{config.label}</span>}
    </span>
  );
}
```

**Usage**:
```javascript
<StatusBadge status="success" />
<StatusBadge status="failed" showLabel={false} />
```

---

## Theming

### Creating Custom Theme

**File**: `frontend/src/themes/custom.css`

```css
[data-theme="custom"] {
  /* Brand colors */
  --primary-color: #ff6b6b;
  --secondary-color: #4ecdc4;
  
  /* Backgrounds */
  --bg-primary: #f7f7f7;
  --bg-secondary: #ffffff;
  
  /* Gradients */
  --gradient-primary: linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 100%);
  
  /* Fonts */
  --font-primary: 'Inter', sans-serif;
  --font-mono: 'Fira Code', monospace;
}
```

---

## Advanced Integrations

### Example: Slack Notifications

**Backend**:
```javascript
import axios from 'axios';

const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK_URL;

async function sendSlackNotification(message) {
  if (!SLACK_WEBHOOK) return;
  
  await axios.post(SLACK_WEBHOOK, {
    text: message,
    username: 'Airflow UI',
    icon_emoji: ':rocket:'
  });
}

// Use in trigger endpoint
app.post('/api/dags/:dagId/dagRuns', async (req, res) => {
  try {
    const { dagId } = req.params;
    const response = await airflowAPI.post(/* ... */);
    
    // Send notification
    await sendSlackNotification(
      `DAG ${dagId} triggered successfully! Run ID: ${response.data.dag_run_id}`
    );
    
    res.json(response.data);
  } catch (error) {
    // Handle error
  }
});
```
