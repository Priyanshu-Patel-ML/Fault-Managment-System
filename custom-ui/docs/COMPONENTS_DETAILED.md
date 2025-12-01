# React Components - Detailed Documentation

## Table of Contents
1. [App Component](#app-component)
2. [DagList Component](#daglist-component)
3. [DagDetails Component](#dagdetails-component)
4. [DagRuns Component](#dagruns-component)
5. [Component Lifecycle](#component-lifecycle)
6. [State Management](#state-management)
7. [Event Handlers](#event-handlers)

## App Component

**File**: `src/App.jsx`
**Purpose**: Main application component with routing
**Type**: Functional component

### Code Structure

```javascript
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import DagList from './components/DagList';
import DagDetails from './components/DagDetails';
import DagRuns from './components/DagRuns';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <header className="app-header">
          <div className="container">
            <h1>🚀 Custom Airflow UI</h1>
            <nav className="nav-menu">
              <Link to="/" className="nav-link">DAGs</Link>
              <Link to="/runs" className="nav-link">All Runs</Link>
            </nav>
          </div>
        </header>
        
        <main className="container">
          <Routes>
            <Route path="/" element={<DagList />} />
            <Route path="/dag/:dagId" element={<DagDetails />} />
            <Route path="/runs" element={<DagRuns />} />
          </Routes>
        </main>
        
        <footer className="app-footer">
          <div className="container">
            <p>Custom Airflow UI - Powered by Airflow REST API</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
```

### Component Breakdown

#### 1. Router Setup
```javascript
<Router>
  {/* All routing components */}
</Router>
```
- **Purpose**: Enable client-side routing
- **Type**: BrowserRouter (uses HTML5 history API)
- **Benefit**: Clean URLs without hash (#)

#### 2. Header Section
```javascript
<header className="app-header">
  <h1>🚀 Custom Airflow UI</h1>
  <nav className="nav-menu">
    <Link to="/" className="nav-link">DAGs</Link>
    <Link to="/runs" className="nav-link">All Runs</Link>
  </nav>
</header>
```

**Elements**:
- `h1`: Application title with emoji
- `nav`: Navigation menu
- `Link`: React Router navigation (no page reload)

**Navigation Links**:
- `/`: Home page (DAG list)
- `/runs`: All DAG runs page

#### 3. Main Content Area
```javascript
<main className="container">
  <Routes>
    <Route path="/" element={<DagList />} />
    <Route path="/dag/:dagId" element={<DagDetails />} />
    <Route path="/runs" element={<DagRuns />} />
  </Routes>
</main>
```

**Routes Defined**:
1. `/` → DagList component
2. `/dag/:dagId` → DagDetails component (with parameter)
3. `/runs` → DagRuns component

**Route Parameters**:
- `:dagId`: Dynamic parameter for DAG identifier
- Example: `/dag/example_dag` → dagId = "example_dag"

#### 4. Footer Section
```javascript
<footer className="app-footer">
  <p>Custom Airflow UI - Powered by Airflow REST API</p>
</footer>
```

### Styling

**File**: `src/App.css`

**Key Styles**:
```css
.App {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px 0;
}

main {
  flex: 1;  /* Takes remaining space */
  padding: 30px 20px;
}

.app-footer {
  margin-top: auto;  /* Pushes to bottom */
}
```

**Layout Strategy**:
- Flexbox for vertical layout
- Header at top (fixed height)
- Main content grows to fill space
- Footer at bottom

---

## DagList Component

**File**: `src/components/DagList.jsx`
**Purpose**: Display and manage list of all DAGs
**Type**: Functional component with hooks

### State Variables

```javascript
const [dags, setDags] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
const [successMessage, setSuccessMessage] = useState('');
const [searchTerm, setSearchTerm] = useState('');
const [triggeringDag, setTriggeringDag] = useState(null);
```

**State Breakdown**:

#### 1. dags
- **Type**: Array
- **Initial**: `[]`
- **Purpose**: Store list of DAGs from API
- **Structure**: 
```javascript
[
  {
    dag_id: "example_dag",
    is_paused: false,
    description: "Example DAG",
    owners: ["airflow"],
    schedule_interval: { value: "0 0 * * *" },
    tags: [{ name: "example" }]
  }
]
```

#### 2. loading
- **Type**: Boolean
- **Initial**: `true`
- **Purpose**: Show loading indicator
- **States**: 
  - `true`: Fetching data
  - `false`: Data loaded or error

#### 3. error
- **Type**: String or null
- **Initial**: `null`
- **Purpose**: Store error messages
- **Example**: `"Failed to fetch DAGs: Network error"`

#### 4. successMessage
- **Type**: String
- **Initial**: `''`
- **Purpose**: Show success notifications
- **Auto-clear**: After 5 seconds
- **Example**: `"Successfully triggered DAG: example_dag"`

#### 5. searchTerm
- **Type**: String
- **Initial**: `''`
- **Purpose**: Filter DAGs by name
- **Usage**: Real-time search

#### 6. triggeringDag
- **Type**: String or null
- **Initial**: `null`
- **Purpose**: Track which DAG is being triggered
- **Usage**: Disable button during trigger

### useEffect Hook

```javascript
useEffect(() => {
  fetchDags();
}, []);
```

**Purpose**: Fetch DAGs when component mounts
**Dependencies**: `[]` (empty = run once)
**Lifecycle**: Equivalent to componentDidMount

### Functions

#### 1. fetchDags()
```javascript
const fetchDags = async () => {
  try {
    setLoading(true);
    setError(null);
    const data = await getDags();
    setDags(data.dags || []);
  } catch (err) {
    setError(`Failed to fetch DAGs: ${err.message}`);
  } finally {
    setLoading(false);
  }
};
```

**Flow**:
1. Set loading to true
2. Clear previous errors
3. Call API (getDags from services/api.js)
4. Update dags state with response
5. Handle errors if any
6. Set loading to false (always)

**Error Handling**:
- Catches network errors
- Catches API errors
- Displays user-friendly message

#### 2. handleTriggerDag()
```javascript
const handleTriggerDag = async (dagId) => {
  if (!window.confirm(`Are you sure you want to trigger DAG: ${dagId}?`)) {
    return;
  }

  try {
    setTriggeringDag(dagId);
    setError(null);
    await triggerDag(dagId);
    setSuccessMessage(`Successfully triggered DAG: ${dagId}`);
    setTimeout(() => setSuccessMessage(''), 5000);
  } catch (err) {
    setError(`Failed to trigger DAG: ${err.message}`);
  } finally {
    setTriggeringDag(null);
  }
};
```

**Flow**:
1. Show confirmation dialog
2. If confirmed, set triggeringDag (disables button)
3. Clear previous errors
4. Call triggerDag API
5. Show success message
6. Auto-clear message after 5 seconds
7. Handle errors
8. Clear triggeringDag (re-enables button)

**User Experience**:
- Confirmation prevents accidental triggers
- Button shows loading state
- Success message auto-dismisses
- Errors persist until next action

#### 3. handlePauseUnpause()
```javascript
const handlePauseUnpause = async (dagId, currentPauseState) => {
  const action = currentPauseState ? 'unpause' : 'pause';

  if (!window.confirm(`Are you sure you want to ${action} DAG: ${dagId}?`)) {
    return;
  }

  try {
    setError(null);
    await pauseUnpauseDag(dagId, !currentPauseState);
    setSuccessMessage(`Successfully ${action}d DAG: ${dagId}`);
    setTimeout(() => setSuccessMessage(''), 5000);
    fetchDags(); // Refresh list
  } catch (err) {
    setError(`Failed to ${action} DAG: ${err.message}`);
  }
};
```

**Parameters**:
- `dagId`: DAG identifier
- `currentPauseState`: Current pause state (true/false)

**Logic**:
- Determines action based on current state
- Shows confirmation
- Calls API with opposite state
- Refreshes DAG list on success

#### 4. filteredDags
```javascript
const filteredDags = dags.filter(dag =>
  dag.dag_id.toLowerCase().includes(searchTerm.toLowerCase())
);
```

**Purpose**: Filter DAGs by search term
**Type**: Computed value (not state)
**Case-insensitive**: Converts both to lowercase
**Real-time**: Updates as user types

### JSX Structure

```javascript
return (
  <div className="dag-list">
    {/* Header */}
    <div className="page-header">
      <h2>📋 DAGs</h2>
      <button onClick={fetchDags}>🔄 Refresh</button>
    </div>

    {/* Search */}
    <div className="search-box">
      <input
        type="text"
        placeholder="Search DAGs..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>

    {/* Messages */}
    {error && <div className="error-message">{error}</div>}
    {successMessage && <div className="success-message">{successMessage}</div>}

    {/* Loading State */}
    {loading && <div className="loading">Loading DAGs...</div>}

    {/* DAG Grid */}
    {!loading && (
      <div className="dag-grid">
        {filteredDags.map(dag => (
          <div key={dag.dag_id} className="dag-card">
            {/* DAG content */}
          </div>
        ))}
      </div>
    )}
  </div>
);
```

**Conditional Rendering**:
- Error message: Shows if `error` is not null
- Success message: Shows if `successMessage` is not empty
- Loading: Shows if `loading` is true
- DAG grid: Shows if `loading` is false

### DAG Card Structure

```javascript
<div className="dag-card">
  {/* Header */}
  <div className="dag-header">
    <h3>
      <Link to={`/dag/${dag.dag_id}`}>{dag.dag_id}</Link>
    </h3>
    <span className={`status-badge ${dag.is_paused ? 'paused' : 'active'}`}>
      {dag.is_paused ? '⏸ Paused' : '▶ Active'}
    </span>
  </div>

  {/* Description */}
  <p className="dag-description">{dag.description || 'No description'}</p>

  {/* Metadata */}
  <div className="dag-meta">
    <div className="meta-item">
      <strong>Owner:</strong> {dag.owners?.join(', ') || 'N/A'}
    </div>
    <div className="meta-item">
      <strong>Schedule:</strong> {dag.schedule_interval?.value || 'None'}
    </div>
    <div className="meta-item">
      <strong>Tags:</strong> {dag.tags?.map(t => t.name).join(', ') || 'None'}
    </div>
  </div>

  {/* Actions */}
  <div className="dag-actions">
    <button
      onClick={() => handleTriggerDag(dag.dag_id)}
      disabled={triggeringDag === dag.dag_id}
      className="btn-trigger"
    >
      {triggeringDag === dag.dag_id ? '⏳ Triggering...' : '▶ Trigger'}
    </button>

    <button
      onClick={() => handlePauseUnpause(dag.dag_id, dag.is_paused)}
      className={dag.is_paused ? 'btn-unpause' : 'btn-pause'}
    >
      {dag.is_paused ? '▶ Unpause' : '⏸ Pause'}
    </button>
  </div>
</div>
```

**Key Features**:
- Link to details page
- Dynamic status badge
- Safe property access with `?.` operator
- Conditional button text
- Disabled state during trigger

---

## DagDetails Component

**File**: `src/components/DagDetails.jsx`
**Purpose**: Display detailed information about a specific DAG
**Type**: Functional component with hooks

### Imports and Setup

```javascript
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getDagDetails, getDagRuns, triggerDag, getTaskInstances } from '../services/api';
import './DagDetails.css';
```

**useParams Hook**:
```javascript
const { dagId } = useParams();
```
- Extracts `dagId` from URL
- Example: `/dag/example_dag` → `dagId = "example_dag"`

### State Variables

```javascript
const [dag, setDag] = useState(null);
const [dagRuns, setDagRuns] = useState([]);
const [selectedRun, setSelectedRun] = useState(null);
const [taskInstances, setTaskInstances] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
const [successMessage, setSuccessMessage] = useState('');
const [triggerConfig, setTriggerConfig] = useState('{}');
const [showConfigEditor, setShowConfigEditor] = useState(false);
```

**State Breakdown**:

#### 1. dag
- **Type**: Object or null
- **Purpose**: Store DAG metadata
- **Structure**:
```javascript
{
  dag_id: "example_dag",
  is_paused: false,
  description: "Example DAG",
  schedule_interval: { value: "0 0 * * *" },
  owners: ["airflow"],
  tags: [{ name: "example" }],
  file_token: "...",
  fileloc: "/path/to/dag.py"
}
```

#### 2. dagRuns
- **Type**: Array
- **Purpose**: Store recent DAG runs
- **Limit**: Usually 10 most recent

#### 3. selectedRun
- **Type**: String or null
- **Purpose**: Track which run is selected for task view
- **Value**: DAG run ID

#### 4. taskInstances
- **Type**: Array
- **Purpose**: Store tasks for selected run

#### 5. triggerConfig
- **Type**: String (JSON)
- **Purpose**: Store configuration for triggering
- **Default**: `'{}'` (empty JSON object)

#### 6. showConfigEditor
- **Type**: Boolean
- **Purpose**: Toggle configuration editor visibility

### useEffect Hooks

```javascript
// Fetch DAG details on mount
useEffect(() => {
  fetchDagDetails();
  fetchDagRuns();
}, [dagId]);

// Fetch tasks when run is selected
useEffect(() => {
  if (selectedRun) {
    fetchTaskInstances(selectedRun);
  }
}, [selectedRun]);
```

**Dependencies**:
- First effect: Runs when `dagId` changes
- Second effect: Runs when `selectedRun` changes

### Functions

#### 1. fetchDagDetails()
```javascript
const fetchDagDetails = async () => {
  try {
    setLoading(true);
    setError(null);
    const data = await getDagDetails(dagId);
    setDag(data);
  } catch (err) {
    setError(`Failed to fetch DAG details: ${err.message}`);
  } finally {
    setLoading(false);
  }
};
```

#### 2. fetchDagRuns()
```javascript
const fetchDagRuns = async () => {
  try {
    const data = await getDagRuns(dagId, 10); // Get 10 recent runs
    setDagRuns(data.dag_runs || []);
  } catch (err) {
    console.error('Failed to fetch DAG runs:', err);
  }
};
```

#### 3. fetchTaskInstances()
```javascript
const fetchTaskInstances = async (dagRunId) => {
  try {
    const data = await getTaskInstances(dagId, dagRunId);
    setTaskInstances(data.task_instances || []);
  } catch (err) {
    console.error('Failed to fetch task instances:', err);
    setTaskInstances([]);
  }
};
```

#### 4. handleTrigger()
```javascript
const handleTrigger = async () => {
  try {
    // Validate JSON
    const config = JSON.parse(triggerConfig);

    setError(null);
    await triggerDag(dagId, config);
    setSuccessMessage(`Successfully triggered DAG: ${dagId}`);
    setTimeout(() => setSuccessMessage(''), 5000);

    // Refresh runs
    fetchDagRuns();

    // Hide editor
    setShowConfigEditor(false);
    setTriggerConfig('{}');

  } catch (err) {
    if (err instanceof SyntaxError) {
      setError('Invalid JSON configuration');
    } else {
      setError(`Failed to trigger DAG: ${err.message}`);
    }
  }
};
```

**JSON Validation**:
- Uses `JSON.parse()` to validate
- Catches `SyntaxError` for invalid JSON
- Shows specific error message

#### 5. formatDuration()
```javascript
const formatDuration = (seconds) => {
  if (!seconds) return 'N/A';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};
```

**Examples**:
- 45 seconds → "45s"
- 125 seconds → "2m 5s"
- 3725 seconds → "1h 2m 5s"

#### 6. getStateColor()
```javascript
const getStateColor = (state) => {
  const colors = {
    'success': '#4caf50',
    'running': '#2196f3',
    'failed': '#f44336',
    'queued': '#ff9800',
    'scheduled': '#9e9e9e'
  };
  return colors[state] || '#9e9e9e';
};
```

**Purpose**: Return color for state badge
**Default**: Gray (#9e9e9e) for unknown states
