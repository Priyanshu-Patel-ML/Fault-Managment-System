# Features Documentation

## Overview

The Custom Airflow UI provides a modern, user-friendly interface to interact with Apache Airflow through its REST API. This document details all available features and how to use them.

## Core Features

### 1. DAG Management

#### View All DAGs
- **Location**: Home page (http://localhost:3000)
- **Features**:
  - Grid view of all DAGs
  - Search functionality to filter DAGs by name
  - Status badges (Active/Paused)
  - DAG metadata display (owner, schedule, tags)
  - Real-time refresh capability

#### DAG Information Display
Each DAG card shows:
- DAG ID (clickable link to details)
- Status (Active/Paused)
- Description
- Owner(s)
- Schedule interval
- Tags

#### Search and Filter
- Real-time search as you type
- Case-insensitive search
- Shows count of filtered vs total DAGs

### 2. DAG Operations

#### Trigger DAG
- **How**: Click "▶️ Trigger" button on any DAG card
- **Features**:
  - Confirmation dialog before triggering
  - Disabled for paused DAGs
  - Loading state while triggering
  - Success/error notifications
  - Option to pass custom configuration (JSON)

#### Pause/Unpause DAG
- **How**: Click "⏸️ Pause" or "▶️ Unpause" button
- **Features**:
  - Instant status update
  - Visual feedback
  - Automatic list refresh

### 3. DAG Details View

#### Access
- Click on DAG name or "📊 Details" button

#### Information Displayed
- Full DAG metadata
- File location
- Schedule information
- Current status
- Owner information

#### Trigger with Configuration
- JSON editor for custom configuration
- Syntax validation
- Example: `{"param1": "value1", "param2": "value2"}`
- Useful for parameterized DAGs

#### Recent DAG Runs
- Table view of recent runs (up to 20)
- Columns:
  - Run ID
  - State (with color-coded badges)
  - Start Date
  - End Date
  - Actions

#### Task Instance Viewer
- Click "View Tasks" on any DAG run
- Shows all tasks in the run
- Task-level information:
  - Task ID
  - State
  - Start/End dates
  - Duration

### 4. DAG Runs Monitoring

#### All DAG Runs View
- **Location**: Click "All Runs" in navigation
- **Features**:
  - Cross-DAG run monitoring
  - Configurable limit (10, 25, 50, 100 runs)
  - Sortable by execution date
  - Real-time refresh

#### Run Information
- DAG ID (clickable link)
- Run ID
- State (color-coded)
- Run Type (manual, scheduled, etc.)
- Start/End timestamps
- Duration calculation
- Quick navigation to DAG details

### 5. Status Indicators

#### State Colors
- 🟢 **Green (Success)**: Completed successfully
- 🔵 **Blue (Running)**: Currently executing
- 🔴 **Red (Failed)**: Failed execution
- 🟠 **Orange (Queued)**: Waiting to execute
- ⚪ **Gray (Paused)**: DAG is paused

### 6. User Interface Features

#### Responsive Design
- Works on desktop, tablet, and mobile
- Adaptive grid layouts
- Touch-friendly buttons

#### Navigation
- Clean header with navigation menu
- Breadcrumb navigation on detail pages
- Quick links throughout the interface

#### Real-time Updates
- Manual refresh buttons
- Auto-refresh capability (can be extended)
- Loading states for all operations

#### Error Handling
- User-friendly error messages
- Detailed error information for debugging
- Automatic error dismissal

#### Success Notifications
- Confirmation messages for actions
- Auto-dismiss after 5 seconds
- Clear visual feedback

## Advanced Features

### 1. Custom Configuration for DAG Triggers

You can pass custom configuration when triggering DAGs:

```json
{
  "environment": "production",
  "date_range": {
    "start": "2024-01-01",
    "end": "2024-01-31"
  },
  "parameters": {
    "batch_size": 1000,
    "retry_count": 3
  }
}
```

This configuration is passed to the DAG and can be accessed in your Airflow tasks.

### 2. Pagination Support

- DAG Runs view supports pagination
- Configurable page size
- Efficient loading of large datasets

### 3. Search Functionality

- Real-time search on DAG list
- Filters by DAG ID
- Case-insensitive matching
- Shows filtered count

## API Integration

All features interact with Airflow REST API endpoints:

### DAG Operations
- `GET /api/v1/dags` - List DAGs
- `GET /api/v1/dags/{dag_id}` - Get DAG details
- `POST /api/v1/dags/{dag_id}/dagRuns` - Trigger DAG
- `PATCH /api/v1/dags/{dag_id}` - Update DAG (pause/unpause)

### DAG Run Operations
- `GET /api/v1/dags/{dag_id}/dagRuns` - Get DAG runs
- `GET /api/v1/dagRuns/list` - Get all DAG runs

### Task Operations
- `GET /api/v1/dags/{dag_id}/dagRuns/{dag_run_id}/taskInstances` - Get tasks

## Planned Features (Future Enhancements)

### Short-term
- [ ] Auto-refresh for DAG runs
- [ ] Task log viewer
- [ ] DAG run cancellation
- [ ] Task retry functionality
- [ ] Export DAG run data (CSV/JSON)

### Medium-term
- [ ] DAG dependency graph visualization
- [ ] Advanced filtering and sorting
- [ ] Custom date range for DAG runs
- [ ] Bulk operations (pause/unpause multiple DAGs)
- [ ] User preferences and settings

### Long-term
- [ ] Real-time WebSocket updates
- [ ] Custom dashboards
- [ ] Metrics and analytics
- [ ] Role-based access control
- [ ] Multi-Airflow instance support

## Usage Tips

### Best Practices

1. **Before Triggering**: Always check if the DAG is active and not paused
2. **Configuration**: Validate JSON before triggering with custom config
3. **Monitoring**: Use the "All Runs" view to monitor multiple DAGs
4. **Refresh**: Click refresh after triggering to see new runs
5. **Details**: Use the details view for in-depth DAG analysis

### Keyboard Shortcuts (Future)
- `Ctrl/Cmd + R` - Refresh current view
- `Ctrl/Cmd + F` - Focus search box
- `Esc` - Close modals/dialogs

### Performance Tips
- Use pagination for large numbers of runs
- Limit the number of runs displayed
- Refresh only when needed

## Troubleshooting Features

### DAG Not Triggering
1. Check if DAG is paused
2. Verify Airflow is running
3. Check browser console for errors
4. Verify backend connectivity

### Runs Not Showing
1. Click refresh button
2. Check if DAG has any runs in Airflow UI
3. Verify API permissions
4. Check backend logs

### Search Not Working
1. Clear search box and try again
2. Check for typos in DAG ID
3. Refresh the page

## Customization

You can customize features by modifying:

- **Components**: `frontend/src/components/`
- **API calls**: `frontend/src/services/api.js`
- **Styling**: Component-specific CSS files
- **Backend**: `backend/server.js`

## Support

For feature requests or issues:
1. Check this documentation
2. Review API_DOCUMENTATION.md
3. Check Airflow REST API docs
4. Review browser console for errors

