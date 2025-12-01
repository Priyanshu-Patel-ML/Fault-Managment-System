# Configuration - Complete Guide

## Table of Contents
1. [Environment Variables](#environment-variables)
2. [Backend Configuration](#backend-configuration)
3. [Frontend Configuration](#frontend-configuration)
4. [Network Configuration](#network-configuration)
5. [Security Configuration](#security-configuration)
6. [Production Configuration](#production-configuration)

## Environment Variables

### Backend Environment Variables

**File**: `backend/.env`

#### Complete .env Template

```env
# ============================================
# AIRFLOW CONFIGURATION
# ============================================

# Airflow Base URL
# The URL where your Airflow instance is running
# Default: http://localhost:8080
# Examples:
#   - Local: http://localhost:8080
#   - Remote: http://airflow.example.com
#   - With port: http://192.168.1.100:8080
AIRFLOW_BASE_URL=http://localhost:8080

# Airflow Username
# The username for Airflow authentication
# Default: admin
# Note: User must have API access permissions
AIRFLOW_USERNAME=admin

# Airflow Password
# The password for Airflow authentication
# Default: admin
# Security: Use strong password in production
AIRFLOW_PASSWORD=admin

# ============================================
# SERVER CONFIGURATION
# ============================================

# Backend Server Port
# The port where the backend server will run
# Default: 3001
# Note: Must be different from frontend port (3000)
PORT=3001

# Node Environment
# Determines the running environment
# Values: development | production | test
# Default: development
NODE_ENV=development

# ============================================
# OPTIONAL CONFIGURATIONS
# ============================================

# Request Timeout (milliseconds)
# How long to wait for Airflow responses
# Default: 30000 (30 seconds)
# REQUEST_TIMEOUT=30000

# Enable Debug Logging
# Show detailed logs for debugging
# Values: true | false
# Default: false
# DEBUG=false

# CORS Origin
# Allowed origins for CORS
# Default: * (all origins)
# Production: Specify exact origin
# CORS_ORIGIN=http://localhost:3000

# API Rate Limiting
# Maximum requests per minute
# Default: 100
# RATE_LIMIT=100
```

### Variable Details

#### AIRFLOW_BASE_URL

**Purpose**: Airflow instance location
**Format**: `http://[host]:[port]` or `https://[host]:[port]`
**Required**: Yes
**Default**: `http://localhost:8080`

**Examples**:
```env
# Local development
AIRFLOW_BASE_URL=http://localhost:8080

# Docker container
AIRFLOW_BASE_URL=http://airflow-webserver:8080

# Remote server
AIRFLOW_BASE_URL=https://airflow.company.com

# Custom port
AIRFLOW_BASE_URL=http://192.168.1.50:9090
```

**Validation**:
```javascript
// Check if URL is valid
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

if (!isValidUrl(AIRFLOW_BASE_URL)) {
  console.error('Invalid AIRFLOW_BASE_URL');
}
```

**Common Issues**:
- ❌ Missing protocol: `localhost:8080` → ✅ `http://localhost:8080`
- ❌ Trailing slash: `http://localhost:8080/` → ✅ `http://localhost:8080`
- ❌ Wrong port: `http://localhost:3000` → ✅ `http://localhost:8080`

#### AIRFLOW_USERNAME

**Purpose**: Airflow authentication username
**Format**: String
**Required**: Yes
**Default**: `admin`

**Requirements**:
- User must exist in Airflow
- User must have API access permissions
- Case-sensitive

**Airflow User Permissions**:
```python
# In Airflow, user needs these permissions:
# - can_read on DAG
# - can_edit on DAG
# - can_create on DAG Run
# - can_read on DAG Run
```

**Creating Airflow User**:
```bash
# Using Airflow CLI
airflow users create \
  --username api_user \
  --firstname API \
  --lastname User \
  --role Admin \
  --email api@example.com \
  --password secure_password
```

#### AIRFLOW_PASSWORD

**Purpose**: Airflow authentication password
**Format**: String
**Required**: Yes
**Default**: `admin`

**Security Best Practices**:
```env
# ❌ Weak passwords
AIRFLOW_PASSWORD=admin
AIRFLOW_PASSWORD=password
AIRFLOW_PASSWORD=12345

# ✅ Strong passwords
AIRFLOW_PASSWORD=Xy9$mK2#pL8@qR5
AIRFLOW_PASSWORD=correct-horse-battery-staple-2024
```

**Password Requirements**:
- Minimum 8 characters (recommended: 16+)
- Mix of uppercase, lowercase, numbers, symbols
- No common words or patterns
- Unique (not reused from other services)

**Storing Passwords Securely**:
```bash
# Use environment variable instead of .env file
export AIRFLOW_PASSWORD="your-secure-password"

# Or use secrets management
# AWS Secrets Manager
# HashiCorp Vault
# Kubernetes Secrets
```

#### PORT

**Purpose**: Backend server port
**Format**: Integer (1024-65535)
**Required**: No
**Default**: `3001`

**Valid Ranges**:
- System ports: 0-1023 (avoid, requires root)
- User ports: 1024-49151 (recommended)
- Dynamic ports: 49152-65535

**Examples**:
```env
# Default
PORT=3001

# Alternative ports
PORT=8000
PORT=5000
PORT=4000
```

**Port Conflicts**:
```bash
# Check if port is in use
lsof -i :3001

# Find process using port
netstat -tulpn | grep 3001

# Kill process on port
kill -9 $(lsof -t -i:3001)
```

#### NODE_ENV

**Purpose**: Application environment
**Format**: String
**Required**: No
**Default**: `development`

**Valid Values**:
- `development`: Development mode
- `production`: Production mode
- `test`: Testing mode

**Effects**:

**Development Mode**:
```env
NODE_ENV=development
```
- Detailed error messages
- Source maps enabled
- Hot reload enabled
- Verbose logging
- No caching

**Production Mode**:
```env
NODE_ENV=production
```
- Minimal error messages
- Optimized builds
- Caching enabled
- Compressed responses
- Security headers

**Usage in Code**:
```javascript
if (process.env.NODE_ENV === 'production') {
  // Production-specific code
  app.use(compression());
  app.use(helmet());
} else {
  // Development-specific code
  app.use(morgan('dev'));
}
```

### Loading Environment Variables

#### In Backend (server.js)

```javascript
import dotenv from 'dotenv';

// Load .env file
dotenv.config();

// Access variables
const AIRFLOW_BASE_URL = process.env.AIRFLOW_BASE_URL || 'http://localhost:8080';
const AIRFLOW_USERNAME = process.env.AIRFLOW_USERNAME || 'admin';
const AIRFLOW_PASSWORD = process.env.AIRFLOW_PASSWORD || 'admin';
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Validate required variables
const requiredEnvVars = ['AIRFLOW_BASE_URL', 'AIRFLOW_USERNAME', 'AIRFLOW_PASSWORD'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
  process.exit(1);
}

// Log configuration (hide sensitive data)
console.log('Configuration loaded:');
console.log('- Airflow URL:', AIRFLOW_BASE_URL);
console.log('- Airflow User:', AIRFLOW_USERNAME);
console.log('- Airflow Password:', '***' + AIRFLOW_PASSWORD.slice(-3));
console.log('- Server Port:', PORT);
console.log('- Environment:', NODE_ENV);
```

### Environment-Specific Configuration

#### Development (.env.development)
```env
AIRFLOW_BASE_URL=http://localhost:8080
AIRFLOW_USERNAME=admin
AIRFLOW_PASSWORD=admin
PORT=3001
NODE_ENV=development
DEBUG=true
```

#### Production (.env.production)
```env
AIRFLOW_BASE_URL=https://airflow.company.com
AIRFLOW_USERNAME=api_user
AIRFLOW_PASSWORD=${AIRFLOW_PASSWORD_SECRET}
PORT=3001
NODE_ENV=production
DEBUG=false
CORS_ORIGIN=https://ui.company.com
```

#### Testing (.env.test)
```env
AIRFLOW_BASE_URL=http://localhost:8080
AIRFLOW_USERNAME=test_user
AIRFLOW_PASSWORD=test_password
PORT=3002
NODE_ENV=test
```

### Loading Different Environments

```javascript
// Load environment-specific file
const envFile = `.env.${process.env.NODE_ENV || 'development'}`;
dotenv.config({ path: envFile });

// Or use dotenv-flow
import dotenvFlow from 'dotenv-flow';
dotenvFlow.config();
```
