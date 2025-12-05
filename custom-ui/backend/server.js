import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3009

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Airflow configuration
const AIRFLOW_BASE_URL = process.env.AIRFLOW_BASE_URL || 'http://localhost:8080';
const AIRFLOW_USERNAME = process.env.AIRFLOW_USERNAME || 'admin';
const AIRFLOW_PASSWORD = process.env.AIRFLOW_PASSWORD || 'admin';
const AIRFLOW_API_VERSION = process.env.AIRFLOW_API_VERSION || 'v1';
const USE_JWT_AUTH = process.env.USE_JWT_AUTH === 'true'; // true for Airflow 3.x, false for Airflow 2.x

console.log(`Proxying requests to Airflow at ${AIRFLOW_BASE_URL}`);
console.log(`Using API version: ${AIRFLOW_API_VERSION}`);
console.log(`Authentication method: ${USE_JWT_AUTH ? 'JWT (Airflow 3.x)' : 'Basic Auth (Airflow 2.x)'}`);

// JWT token storage (only for Airflow 3.x)
let jwtToken = null;
let tokenExpiry = null;

// Function to get JWT token for Airflow 3.x
async function getJWTToken() {
  try {
    // Check if we have a valid token
    if (jwtToken && tokenExpiry && Date.now() < tokenExpiry) {
      return jwtToken;
    }

    console.log('🔑 Fetching new JWT token from Airflow...');
    const response = await axios.post(
      `${AIRFLOW_BASE_URL}/auth/token`,
      {
        username: AIRFLOW_USERNAME,
        password: AIRFLOW_PASSWORD
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    jwtToken = response.data.access_token;
    // Set expiry to 23 hours from now (tokens typically last 24 hours)
    tokenExpiry = Date.now() + (23 * 60 * 60 * 1000);
    console.log('✅ JWT token obtained successfully');
    return jwtToken;
  } catch (error) {
    console.error('❌ Failed to get JWT token:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
}

// Create axios instance for Airflow API
const airflowAPI = axios.create({
  baseURL: `${AIRFLOW_BASE_URL}/api/${AIRFLOW_API_VERSION}`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include authentication
airflowAPI.interceptors.request.use(
  async (config) => {
    try {
      if (USE_JWT_AUTH) {
        // Airflow 3.x: Use JWT Bearer token
        const token = await getJWTToken();
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        // Airflow 2.x: Use HTTP Basic Auth
        const credentials = Buffer.from(`${AIRFLOW_USERNAME}:${AIRFLOW_PASSWORD}`).toString('base64');
        config.headers.Authorization = `Basic ${credentials}`;
      }
      return config;
    } catch (error) {
      console.error('Failed to add authentication to request:', error.message);
      return Promise.reject(error);
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token expiry
airflowAPI.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If we get 401 and haven't retried yet, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Clear existing token
      jwtToken = null;
      tokenExpiry = null;

      try {
        const token = await getJWTToken();
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return airflowAPI(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend server is running' });
});

// Check if any DAG is currently running (for UI to display status)
app.get('/api/status/running', async (req, res) => {
  try {
    const runningStatus = await isAnyDagRunning();
    res.json({
      has_running_dags: runningStatus.isRunning,
      count: runningStatus.count,
      running_dags: runningStatus.runningDags || [],
      in_cooldown: runningStatus.inCooldown || false,
      cooldown_info: runningStatus.cooldownInfo || null
    });
  } catch (error) {
    console.error('Error checking running status:', error.message);
    res.status(500).json({
      error: error.message,
      details: error.response?.data
    });
  }
});

// Get all DAGs
app.get('/api/dags', async (req, res) => {
  try {
    const response = await airflowAPI.get('/dags');
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching DAGs:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data
    });
  }
});

// Get specific DAG details
app.get('/api/dags/:dagId', async (req, res) => {
  try {
    const { dagId } = req.params;
    const response = await airflowAPI.get(`/dags/${dagId}`);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching DAG details:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data
    });
  }
});

// Helper function to check if any DAG is currently running or in cooldown period
async function isAnyDagRunning() {
  try {
    // Get recent DAG runs and filter by state
    // Airflow 3.x may not properly filter by state parameter, so we fetch and filter manually
    const response = await airflowAPI.get('/dags/~/dagRuns', {
      params: {
        limit: 100,  // Get recent runs to check
        order_by: '-start_date'  // Most recent first
      }
    });

    const allDagRuns = response.data.dag_runs || [];

    // Filter to only include truly active states (running or queued)
    // Exclude: failed, success, skipped, upstream_failed, etc.
    const activeDagRuns = allDagRuns.filter(dagRun =>
      dagRun.state === 'running' || dagRun.state === 'queued'
    );

    const runningCount = activeDagRuns.length;

    if (runningCount > 0) {
      console.log(`⚠️  Found ${runningCount} running/queued DAG(s)`);
      activeDagRuns.forEach((dagRun, index) => {
        if (index < 3) {  // Show first 3
          console.log(`   ${index + 1}. ${dagRun.dag_id} (${dagRun.state}) - started: ${dagRun.start_date || 'not started'}`);
        }
      });
      return {
        isRunning: true,
        count: runningCount,
        runningDags: activeDagRuns,
        reason: 'running'
      };
    }

    // Check for cooldown period (15 minutes after last completed DAG)
    // Find the most recent completed DAG run (success, failed, skipped, etc.)
    const completedDagRuns = allDagRuns.filter(dagRun =>
      dagRun.state === 'success' ||
      dagRun.state === 'failed' ||
      dagRun.state === 'skipped' ||
      dagRun.state === 'upstream_failed'
    );

    if (completedDagRuns.length > 0) {
      const mostRecentCompleted = completedDagRuns[0]; // Already sorted by start_date desc
      const endDate = mostRecentCompleted.end_date;

      if (endDate) {
        const endTime = new Date(endDate);
        const now = new Date();
        const timeSinceCompletion = now - endTime; // milliseconds
        const cooldownPeriod = 15 * 60 * 1000; // 15 minutes in milliseconds

        if (timeSinceCompletion < cooldownPeriod) {
          const remainingTime = Math.ceil((cooldownPeriod - timeSinceCompletion) / 1000 / 60); // minutes
          console.log(`⏳ Cooldown period active. Last DAG completed ${Math.floor(timeSinceCompletion / 1000 / 60)} minutes ago.`);
          console.log(`   DAG: ${mostRecentCompleted.dag_id} (${mostRecentCompleted.state})`);
          console.log(`   Ended: ${endDate}`);
          console.log(`   Remaining cooldown: ${remainingTime} minutes`);

          return {
            isRunning: true,
            count: 0,
            runningDags: [],
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

    console.log(`✅ No DAGs currently running or in cooldown period`);
    return {
      isRunning: false,
      count: 0,
      runningDags: [],
      inCooldown: false
    };
  } catch (error) {
    console.error('❌ Error checking running DAGs:', error.message);
    if (error.response) {
      console.error('   Response status:', error.response.status);
      console.error('   Response data:', JSON.stringify(error.response.data, null, 2));
    }
    // If we can't check, allow the trigger (fail open)
    return {
      isRunning: false,
      count: 0,
      runningDags: [],
      inCooldown: false
    };
  }
}

// Trigger a DAG (with single execution enforcement)
app.post('/api/dags/:dagId/dagRuns', async (req, res) => {
  try {
    const { dagId } = req.params;
    const { conf, logical_date } = req.body;

    // Check if any DAG is currently running
    console.log(`🔍 Checking for running DAGs before triggering ${dagId}...`);
    const runningStatus = await isAnyDagRunning();

    if (runningStatus.isRunning) {
      // Check if it's due to cooldown period
      if (runningStatus.inCooldown) {
        const cooldown = runningStatus.cooldownInfo;
        const errorMessage = `Cannot trigger Fault. Cooldown period active. Last fault "${cooldown.last_dag_id}" completed ${cooldown.minutes_since_completion} minutes ago. Please wait ${cooldown.remaining_cooldown_minutes} more minutes.`;
        console.log(`❌ ${errorMessage}`);

        return res.status(409).json({
          error: 'Conflict',
          message: errorMessage,
          details: {
            reason: 'Cooldown period - must wait 15 minutes after previous fault completion',
            in_cooldown: true,
            last_completed_fault: {
              dag_id: cooldown.last_dag_id,
              state: cooldown.last_dag_state,
              end_date: cooldown.end_date,
              minutes_since_completion: cooldown.minutes_since_completion
            },
            remaining_cooldown_minutes: cooldown.remaining_cooldown_minutes,
            cooldown_period_minutes: 15
          }
        });
      }

      // Otherwise, a fault is currently running
      const runningDag = runningStatus.runningDags[0];
      const errorMessage = `Cannot trigger Fault. Another Fault is currently ${runningDag.state}: ${runningDag.dag_id}`;
      console.log(`❌ ${errorMessage}`);

      return res.status(409).json({
        error: 'Conflict',
        message: errorMessage,
        details: {
          reason: 'Only one Fault can run at a time',
          currently_running: {
            dag_id: runningDag.dag_id,
            dag_run_id: runningDag.dag_run_id,
            state: runningDag.state,
            start_date: runningDag.start_date,
            logical_date: runningDag.logical_date
          },
          total_running: runningStatus.count
        }
      });
    }

    // No DAGs running, proceed with trigger
    // Build payload based on Airflow version
    let payload;
    if (USE_JWT_AUTH) {
      // Airflow 3.x: Use logical_date (can be null for auto-generation)
      payload = {
        logical_date: logical_date || null,
        conf: conf || {}
      };
    } else {
      // Airflow 2.x: Don't send logical_date/execution_date for immediate trigger
      // Only send conf if provided
      payload = {};
      if (conf && Object.keys(conf).length > 0) {
        payload.conf = conf;
      }
    }

    console.log(`🚀 Triggering DAG: ${dagId} (no other DAGs running)`);
    console.log(`   Payload:`, JSON.stringify(payload));
    const response = await airflowAPI.post(`/dags/${dagId}/dagRuns`, payload);
    console.log(`✅ DAG triggered successfully: ${response.data.dag_run_id}`);
    res.json(response.data);
  } catch (error) {
    console.error('❌ Error triggering DAG:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data
    });
  }
});

// Get DAG runs for a specific DAG
app.get('/api/dags/:dagId/dagRuns', async (req, res) => {
  try {
    const { dagId } = req.params;
    const { limit = 10, offset = 0 } = req.query;
    
    const response = await airflowAPI.get(`/dags/${dagId}/dagRuns`, {
      params: { limit, offset, order_by: '-execution_date' }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching DAG runs:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data
    });
  }
});

// Get all DAG runs (across all DAGs)
app.get('/api/dagRuns', async (req, res) => {
  try {
    const { limit = 25, offset = 0 } = req.query;
    // In Airflow 3.x, use /dags/~/dagRuns to get runs from all DAGs
    const response = await airflowAPI.get('/dags/~/dagRuns', {
      params: {
        limit,
        offset,
        order_by: '-start_date'  // Changed from execution_date to start_date
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching all DAG runs:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data
    });
  }
});

// Get task instances for a DAG run
app.get('/api/dags/:dagId/dagRuns/:dagRunId/taskInstances', async (req, res) => {
  try {
    const { dagId, dagRunId } = req.params;
    const response = await airflowAPI.get(`/dags/${dagId}/dagRuns/${dagRunId}/taskInstances`);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching task instances:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data
    });
  }
});

// Pause/Unpause a DAG
app.patch('/api/dags/:dagId', async (req, res) => {
  try {
    const { dagId } = req.params;
    const { is_paused } = req.body;
    
    const response = await airflowAPI.patch(`/dags/${dagId}`, { is_paused });
    res.json(response.data);
  } catch (error) {
    console.error('Error updating DAG:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`Proxying requests to Airflow at ${AIRFLOW_BASE_URL}`);
});

