// Test connection to Airflow
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config({ path: './backend/.env' });

const AIRFLOW_BASE_URL = process.env.AIRFLOW_BASE_URL || 'http://localhost:8080';
const AIRFLOW_USERNAME = process.env.AIRFLOW_USERNAME || 'admin';
const AIRFLOW_PASSWORD = process.env.AIRFLOW_PASSWORD || 'admin';

console.log('🔍 Testing Airflow Connection...\n');
console.log('Configuration:');
console.log('  Base URL:', AIRFLOW_BASE_URL);
console.log('  Username:', AIRFLOW_USERNAME);
console.log('  Password:', '*'.repeat(AIRFLOW_PASSWORD.length));
console.log('');

const airflowAPI = axios.create({
  baseURL: `${AIRFLOW_BASE_URL}/api/v1`,
  auth: {
    username: AIRFLOW_USERNAME,
    password: AIRFLOW_PASSWORD
  },
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

async function testConnection() {
  try {
    console.log('📡 Testing connection to:', `${AIRFLOW_BASE_URL}/api/v1/dags`);
    console.log('');
    
    const response = await airflowAPI.get('/dags');
    
    console.log('✅ SUCCESS! Connected to Airflow');
    console.log('');
    console.log('Response Status:', response.status);
    console.log('Total DAGs:', response.data.total_entries);
    console.log('');
    
    if (response.data.dags && response.data.dags.length > 0) {
      console.log('📋 Available DAGs:');
      response.data.dags.slice(0, 5).forEach(dag => {
        console.log(`  - ${dag.dag_id} (${dag.is_paused ? 'Paused' : 'Active'})`);
      });
      if (response.data.dags.length > 5) {
        console.log(`  ... and ${response.data.dags.length - 5} more`);
      }
    } else {
      console.log('⚠️  No DAGs found in Airflow');
    }
    
  } catch (error) {
    console.log('❌ FAILED to connect to Airflow\n');
    
    if (error.code === 'ECONNREFUSED') {
      console.log('Error: Connection Refused');
      console.log('Possible causes:');
      console.log('  1. Airflow is not running');
      console.log('  2. Wrong URL:', AIRFLOW_BASE_URL);
      console.log('  3. Firewall blocking the connection');
      console.log('  4. Network issue');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('Error: Connection Timeout');
      console.log('Possible causes:');
      console.log('  1. Airflow server is slow or unresponsive');
      console.log('  2. Network latency');
      console.log('  3. Firewall blocking the connection');
    } else if (error.response?.status === 401) {
      console.log('Error: Authentication Failed (401)');
      console.log('Possible causes:');
      console.log('  1. Wrong username or password');
      console.log('  2. Airflow authentication not configured');
    } else if (error.response?.status === 403) {
      console.log('Error: Forbidden (403)');
      console.log('Possible causes:');
      console.log('  1. User does not have permission');
      console.log('  2. RBAC restrictions');
    } else if (error.response?.status === 404) {
      console.log('Error: Not Found (404)');
      console.log('Possible causes:');
      console.log('  1. Wrong API endpoint');
      console.log('  2. Airflow REST API not enabled');
    } else {
      console.log('Error:', error.message);
      if (error.response) {
        console.log('Status:', error.response.status);
        console.log('Response:', error.response.data);
      }
    }
    
    console.log('\n🔧 Troubleshooting Steps:');
    console.log('  1. Verify Airflow is running:');
    console.log(`     curl ${AIRFLOW_BASE_URL}/health`);
    console.log('  2. Test API directly:');
    console.log(`     curl -u ${AIRFLOW_USERNAME}:${AIRFLOW_PASSWORD} ${AIRFLOW_BASE_URL}/api/v1/dags`);
    console.log('  3. Check backend/.env file');
    console.log('  4. Restart backend server');
    
    process.exit(1);
  }
}

testConnection();

