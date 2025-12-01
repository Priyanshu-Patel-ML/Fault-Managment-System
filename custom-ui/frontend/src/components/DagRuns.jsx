import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllDagRuns } from '../services/api';
import './DagRuns.css';

function DagRuns() {
  const [dagRuns, setDagRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [limit, setLimit] = useState(25);

  useEffect(() => {
    fetchDagRuns();
  }, [limit]);

  const fetchDagRuns = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllDagRuns(limit);
      setDagRuns(data.dag_runs || []);
    } catch (err) {
      setError(`Failed to fetch DAG runs: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getStateClass = (state) => {
    const stateMap = {
      'success': 'status-success',
      'running': 'status-running',
      'failed': 'status-failed',
      'queued': 'status-queued',
      'up_for_retry': 'status-warning',
      'up_for_reschedule': 'status-warning',
      'scheduled': 'status-queued'
    };
    return stateMap[state] || 'status-paused';
  };

  const calculateDuration = (startDate, endDate) => {
    if (!startDate) return 'N/A';
    if (!endDate) return 'Running...';
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const durationMs = end - start;
    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  if (loading) {
    return <div className="loading">Loading DAG runs...</div>;
  }

  return (
    <div className="dag-runs-container">
      <div className="card">
        <div className="dag-runs-header">
          <h2>All DAG Runs</h2>
          <div className="header-controls">
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="limit-select"
            >
              <option value={10}>10 runs</option>
              <option value={25}>25 runs</option>
              <option value={50}>50 runs</option>
              <option value={100}>100 runs</option>
            </select>
            <button onClick={fetchDagRuns} className="btn-primary">
              🔄 Refresh
            </button>
          </div>
        </div>

        {error && <div className="error">{error}</div>}

        <div className="runs-count">
          Showing {dagRuns.length} recent DAG runs
        </div>

        <div className="runs-table">
          <table>
            <thead>
              <tr>
                <th>DAG ID</th>
                <th>Run ID</th>
                <th>State</th>
                <th>Run Type</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Duration</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {dagRuns.map((run) => (
                <tr key={`${run.dag_id}-${run.dag_run_id}`}>
                  <td>
                    <Link to={`/dag/${run.dag_id}`} className="dag-link">
                      {run.dag_id}
                    </Link>
                  </td>
                  <td className="run-id">{run.dag_run_id}</td>
                  <td>
                    <span className={`status-badge ${getStateClass(run.state)}`}>
                      {run.state}
                    </span>
                  </td>
                  <td>{run.run_type || 'N/A'}</td>
                  <td>{run.start_date ? new Date(run.start_date).toLocaleString() : 'N/A'}</td>
                  <td>{run.end_date ? new Date(run.end_date).toLocaleString() : 'Running...'}</td>
                  <td>{calculateDuration(run.start_date, run.end_date)}</td>
                  <td>
                    <Link to={`/dag/${run.dag_id}`} className="btn-secondary btn-small">
                      View DAG
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {dagRuns.length === 0 && (
          <div className="no-runs">
            No DAG runs found.
          </div>
        )}
      </div>
    </div>
  );
}

export default DagRuns;

