import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDags, pauseUnpauseDag, triggerDag, getRunningStatus } from '../services/api';
import './DagList.css';

function DagList() {
  const [dags, setDags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [triggeringDag, setTriggeringDag] = useState(null);
  const [runningStatus, setRunningStatus] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterTargetSystem, setFilterTargetSystem] = useState('all');

  useEffect(() => {
    fetchDags();
    fetchRunningStatus();

    // Poll running status every 5 seconds
    const interval = setInterval(fetchRunningStatus, 5000);
    return () => clearInterval(interval);
  }, []);



  const fetchDags = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDags();
      setDags(data.dags || []);
    } catch (err) {
      setError(`Failed to fetch Faults: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchRunningStatus = async () => {
    try {
      const status = await getRunningStatus();
      setRunningStatus(status);
    } catch (err) {
      console.error('Failed to fetch running status:', err);
    }
  };

  const handleTriggerDag = async (dagId) => {
    console.log('🔘 Trigger clicked for:', dagId);
    console.log('📊 Running Status:', runningStatus);

    // Check if another Fault is running or in cooldown
    if (runningStatus?.has_running_dags) {
      console.log('⚠️ Has running dags or cooldown');

      // Check if it's cooldown period
      if (runningStatus.in_cooldown && runningStatus.cooldown_info) {
        console.log('⏳ Showing cooldown popup');
        const cooldown = runningStatus.cooldown_info;
        setPopupType('cooldown');
        setPopupMessage(
          `Last fault "${cooldown.last_dag_id}" completed ${cooldown.minutes_since_completion} minutes ago.\n\n` +
          `Please wait ${cooldown.remaining_cooldown_minutes} more minutes.\n\n` +
          `(15-minute cooldown period after each fault completion)`
        );
        setShowPopup(true);
        return;
      }

      // Otherwise, a fault is running
      if (runningStatus.running_dags && runningStatus.running_dags.length > 0) {
        console.log('🏃 Showing running fault popup');
        const runningDag = runningStatus.running_dags[0];
        setPopupType('running');
        setPopupMessage(`Another Fault is currently ${runningDag.state}:\n\n${runningDag.dag_id}\n\nOnly one fault can run at a time. Please wait for it to complete.`);
        setShowPopup(true);
        return;
      }
    }

    console.log('✅ Proceeding with trigger');

    try {
      setTriggeringDag(dagId);
      setError(null);
      setSuccessMessage('');
      await triggerDag(dagId);
      setSuccessMessage(`Successfully triggered Fault: ${dagId}`);
      setTimeout(() => setSuccessMessage(''), 5000);

      // Refresh running status immediately
      fetchRunningStatus();
    } catch (err) {
      // Handle 409 Conflict error (another Fault is running or cooldown)
      if (err.response?.status === 409) {
        const details = err.response.data.details;

        // Check if it's cooldown period
        if (details?.in_cooldown) {
          const cooldown = details.last_completed_fault;
          setPopupType('cooldown');
          setPopupMessage(
            `Last fault "${cooldown.dag_id}" completed ${cooldown.minutes_since_completion} minutes ago.\n\n` +
            `Please wait ${details.remaining_cooldown_minutes} more minutes.\n\n` +
            `(15-minute cooldown period after each fault completion)`
          );
        } else {
          // Fault is running
          const runningDag = details?.currently_running;
          setPopupType('running');
          setPopupMessage(
            `Another Fault is currently ${runningDag?.state || 'running'}: ${runningDag?.dag_id || 'unknown'}.\n\n` +
            `Only one Fault can run at a time. Please wait for it to complete.`
          );
        }
        setShowPopup(true);
        // Refresh running status
        fetchRunningStatus();
      } else {
        setError(`Failed to trigger Fault: ${err.response?.data?.message || err.message}`);
      }
    } finally {
      setTriggeringDag(null);
    }
  };

  const handlePauseUnpause = async (dagId, currentPausedState) => {
    try {
      setError(null);
      await pauseUnpauseDag(dagId, !currentPausedState);
      setSuccessMessage(`Successfully ${currentPausedState ? 'unpaused' : 'paused'} Fault: ${dagId}`);
      setTimeout(() => setSuccessMessage(''), 5000);
      fetchDags(); // Refresh the list
    } catch (err) {
      setError(`Failed to update Fault: ${err.message}`);
    }
  };

  const filteredDags = dags.filter(dag => {
    // Search filter
    const matchesSearch = dag.dag_id.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'active' && !dag.is_paused) ||
      (filterStatus === 'paused' && dag.is_paused);

    // Extract metadata from tags
    const tags = dag.tags?.map(tag => tag.name) || [];
    const severity = tags.find(tag => tag.toLowerCase().includes('severity:'))?.split(':')[1] ||
                     tags.find(tag => ['low', 'medium', 'high', 'critical'].includes(tag.toLowerCase())) ||
                     'N/A';
    const targetSystem = tags.find(tag => tag.toLowerCase().includes('target:'))?.split(':')[1] ||
                         tags.find(tag => tag.toLowerCase().includes('system:'))?.split(':')[1] ||
                         'N/A';

    // Severity filter
    const matchesSeverity = filterSeverity === 'all' ||
      severity.toLowerCase() === filterSeverity.toLowerCase();

    // Target System filter
    const matchesTargetSystem = filterTargetSystem === 'all' ||
      targetSystem.toLowerCase() === filterTargetSystem.toLowerCase();

    return matchesSearch && matchesStatus && matchesSeverity && matchesTargetSystem;
  });

  if (loading) {
    return <div className="loading">Loading Faults...</div>;
  }

  return (
    <div className="dag-list-container">
      <div className="card">
        <div className="dag-list-header">
          <h2>Faults</h2>
          <button onClick={fetchDags} className="btn-primary">
            🔄 Refresh
          </button>
        </div>

        {successMessage && <div className="success">{successMessage}</div>}

        <div className="filters-container">
          <div className="filters-left">
            <input
              type="text"
              placeholder="Search alerts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
            </select>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Severity</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <select
              value={filterTargetSystem}
              onChange={(e) => setFilterTargetSystem(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Target System</option>
            </select>
            <button onClick={fetchDags} className="btn-success">
              Refresh
            </button>
          </div>
          <div className="dag-count">
            {filteredDags.length} of {dags.length} faults
          </div>
        </div>

        {/* Table View */}
        {filteredDags.length > 0 ? (
          <div className="table-container">
            <table className="dag-table">
              <thead>
                <tr>
                  <th>Fault Name</th>
                  <th>Duration</th>
                  <th>Start Time - End Time</th>
                  <th>Severity</th>
                  <th>Target System</th>
                  <th>Status</th>
                  <th>Run Type</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDags.map((dag) => {
                  // Extract metadata from tags
                  const tags = dag.tags?.map(tag => tag.name) || [];
                  const severity = tags.find(tag => tag.toLowerCase().includes('severity:'))?.split(':')[1] ||
                                   tags.find(tag => ['low', 'medium', 'high', 'critical'].includes(tag.toLowerCase())) ||
                                   'N/A';
                  const targetSystem = tags.find(tag => tag.toLowerCase().includes('target:'))?.split(':')[1] ||
                                       tags.find(tag => tag.toLowerCase().includes('system:'))?.split(':')[1] ||
                                       'N/A';

                  // Determine run type
                  const schedule = dag.schedule_interval?.value || dag.timetable_description;
                  const runType = schedule && schedule !== 'None' && schedule !== 'null'
                    ? `Scheduled (${schedule})`
                    : 'Manual';

                  return (
                  <tr key={dag.dag_id}>
                    <td>
                      <Link to={`/dag/${dag.dag_id}`} className="dag-link">
                        {dag.dag_id}
                      </Link>
                    </td>
                    <td>N/A</td>
                    <td>
                      <span style={{ color: '#6b7280', fontSize: '12px' }}>N/A - N/A</span>
                    </td>
                    <td>{severity}</td>
                    <td>{targetSystem}</td>
                    <td>
                      <span className={`status-badge ${dag.is_paused ? 'status-paused' : 'status-active'}`}>
                        {dag.is_paused ? 'Paused' : 'Active'}
                      </span>
                    </td>
                    <td>{runType}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => handleTriggerDag(dag.dag_id)}
                          disabled={dag.is_paused || triggeringDag !== null}
                          className="btn-xs"
                          style={{
                            background: 'white',
                            backgroundColor: 'white',
                            backgroundImage: 'none',
                            border: '1px solid #ddd',
                            color: '#666',
                            padding: '4px 8px',
                            fontSize: '14px',
                            cursor: dag.is_paused || triggeringDag !== null ? 'not-allowed' : 'pointer',
                            opacity: dag.is_paused || triggeringDag !== null ? 0.3 : (runningStatus?.has_running_dags ? 0.5 : 1)
                          }}
                          title={
                            dag.is_paused
                              ? 'Fault is paused'
                              : runningStatus?.has_running_dags
                              ? 'Click to see why this is blocked'
                              : 'Trigger this Fault'
                          }
                        >
                          {triggeringDag === dag.dag_id ? 'Triggering...' : 'Trigger'}
                        </button>
                        <button
                          onClick={() => handlePauseUnpause(dag.dag_id, dag.is_paused)}
                          className="btn-xs"
                          style={{
                            background: 'white',
                            backgroundColor: 'white',
                            backgroundImage: 'none',
                            border: '1px solid #ddd',
                            color: '#666',
                            padding: '4px 8px',
                            fontSize: '14px',
                            cursor: 'pointer'
                          }}
                        >
                          {dag.is_paused ? 'Unpause' : 'Pause'}
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="no-dags">
            {searchTerm ? 'No Faults match your search.' : 'No Faults found.'}
          </div>
        )}
      </div>

      {/* Popup Modal */}
      {showPopup && (
        <div className="popup-overlay" onClick={() => setShowPopup(false)}>
          <div className="popup-modal" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <h3>
                {popupType === 'cooldown' ? '⏳ Cooldown Period Active' : '⚠️ Fault Already Running'}
              </h3>
              <button className="popup-close" onClick={() => setShowPopup(false)}>×</button>
            </div>
            <div className="popup-body">
              <p style={{ whiteSpace: 'pre-line' }}>{popupMessage}</p>
            </div>
            <div className="popup-footer">
              <button className="btn-primary" onClick={() => setShowPopup(false)}>OK</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DagList;

