import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getDagDetails, getDagRuns, triggerDag, getTaskInstances } from '../services/api';
import './DagDetails.css';

function DagDetails() {
  const { dagId } = useParams();
  const [dag, setDag] = useState(null);
  const [dagRuns, setDagRuns] = useState([]);
  const [selectedRun, setSelectedRun] = useState(null);
  const [taskInstances, setTaskInstances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [triggerConfig, setTriggerConfig] = useState('{}');

  useEffect(() => {
    fetchDagDetails();
    fetchDagRuns();
  }, [dagId]);

  const fetchDagDetails = async () => {
    try {
      setLoading(true);
      const data = await getDagDetails(dagId);
      setDag(data);
    } catch (err) {
      setError(`Failed to fetch DAG details: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchDagRuns = async () => {
    try {
      const data = await getDagRuns(dagId, 20);
      setDagRuns(data.dag_runs || []);
    } catch (err) {
      console.error('Failed to fetch DAG runs:', err);
    }
  };

  const handleTriggerDag = async () => {
    try {
      setError(null);
      let conf = {};
      if (triggerConfig.trim()) {
        conf = JSON.parse(triggerConfig);
      }
      await triggerDag(dagId, conf);
      setSuccessMessage('DAG triggered successfully!');
      setTimeout(() => setSuccessMessage(''), 5000);
      setTimeout(fetchDagRuns, 2000); // Refresh runs after 2 seconds
    } catch (err) {
      setError(`Failed to trigger DAG: ${err.message}`);
    }
  };

  const handleViewTasks = async (dagRunId) => {
    try {
      setSelectedRun(dagRunId);
      const data = await getTaskInstances(dagId, dagRunId);
      setTaskInstances(data.task_instances || []);
    } catch (err) {
      setError(`Failed to fetch task instances: ${err.message}`);
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

  if (loading) {
    return <div className="loading">Loading DAG details...</div>;
  }

  if (!dag) {
    return <div className="error">DAG not found</div>;
  }

  return (
    <div className="dag-details-container">
      <div className="breadcrumb">
        <Link to="/">DAGs</Link> / {dagId}
      </div>

      {error && <div className="error">{error}</div>}
      {successMessage && <div className="success">{successMessage}</div>}

      <div className="card">
        <h2>{dag.dag_id}</h2>
        {dag.description && <p className="description">{dag.description}</p>}
        
        <div className="dag-metadata">
          <div className="metadata-item">
            <strong>Status:</strong>
            <span className={`status-badge ${dag.is_paused ? 'status-paused' : 'status-success'}`}>
              {dag.is_paused ? 'Paused' : 'Active'}
            </span>
          </div>
          <div className="metadata-item">
            <strong>Owner:</strong> {dag.owners?.join(', ') || 'N/A'}
          </div>
          <div className="metadata-item">
            <strong>Schedule:</strong> {dag.schedule_interval?.value || dag.timetable_description || 'None'}
          </div>
          <div className="metadata-item">
            <strong>File Location:</strong> {dag.fileloc || 'N/A'}
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Trigger DAG</h3>
        <div className="trigger-section">
          <textarea
            value={triggerConfig}
            onChange={(e) => setTriggerConfig(e.target.value)}
            placeholder='{"key": "value"}'
            rows="4"
            className="config-input"
          />
          <button onClick={handleTriggerDag} className="btn-success" disabled={dag.is_paused}>
            ▶️ Trigger DAG Run
          </button>
        </div>
      </div>

      <div className="card">
        <h3>Recent DAG Runs ({dagRuns.length})</h3>
        <div className="dag-runs-table">
          <table>
            <thead>
              <tr>
                <th>Run ID</th>
                <th>State</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {dagRuns.map((run) => (
                <tr key={run.dag_run_id}>
                  <td>{run.dag_run_id}</td>
                  <td>
                    <span className={`status-badge ${getStateClass(run.state)}`}>
                      {run.state}
                    </span>
                  </td>
                  <td>{run.start_date ? new Date(run.start_date).toLocaleString() : 'N/A'}</td>
                  <td>{run.end_date ? new Date(run.end_date).toLocaleString() : 'Running...'}</td>
                  <td>
                    <button
                      onClick={() => handleViewTasks(run.dag_run_id)}
                      className="btn-secondary btn-small"
                    >
                      View Tasks
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedRun && taskInstances.length > 0 && (
        <div className="card">
          <h3>Task Instances for Run: {selectedRun}</h3>
          <div className="task-instances-table">
            <table>
              <thead>
                <tr>
                  <th>Task ID</th>
                  <th>State</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                {taskInstances.map((task) => (
                  <tr key={task.task_id}>
                    <td>{task.task_id}</td>
                    <td>
                      <span className={`status-badge ${getStateClass(task.state)}`}>
                        {task.state || 'N/A'}
                      </span>
                    </td>
                    <td>{task.start_date ? new Date(task.start_date).toLocaleString() : 'N/A'}</td>
                    <td>{task.end_date ? new Date(task.end_date).toLocaleString() : 'Running...'}</td>
                    <td>{task.duration ? `${task.duration.toFixed(2)}s` : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default DagDetails;

