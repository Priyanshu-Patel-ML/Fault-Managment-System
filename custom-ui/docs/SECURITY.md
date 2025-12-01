# Security Documentation - Complete Reference

## Table of Contents
1. [Security Overview](#security-overview)
2. [Authentication](#authentication)
3. [Authorization](#authorization)
4. [Data Protection](#data-protection)
5. [Network Security](#network-security)
6. [Security Best Practices](#security-best-practices)
7. [Security Checklist](#security-checklist)
8. [Common Vulnerabilities](#common-vulnerabilities)

## Security Overview

### Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: Network Security                                   │
│ - HTTPS/TLS encryption                                      │
│ - Firewall rules                                            │
│ - CORS configuration                                        │
└─────────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────────────┐
│ Layer 2: Application Security                               │
│ - Input validation                                          │
│ - Output encoding                                           │
│ - Error handling                                            │
└─────────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────────────┐
│ Layer 3: Authentication                                      │
│ - Airflow Basic Auth                                        │
│ - Credential management                                     │
│ - Session handling                                          │
└─────────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────────────┐
│ Layer 4: Data Security                                       │
│ - Environment variables                                     │
│ - Secrets management                                        │
│ - No sensitive data in logs                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Authentication

### Current Implementation

**Method**: HTTP Basic Authentication (proxied)
**Location**: Backend server
**Flow**:

```
Frontend → Backend → Airflow
  (no auth)  (Basic Auth)
```

### Backend Authentication Code

```javascript
// backend/server.js
import axios from 'axios';

const AIRFLOW_USERNAME = process.env.AIRFLOW_USERNAME || 'admin';
const AIRFLOW_PASSWORD = process.env.AIRFLOW_PASSWORD || 'admin';

const airflowAPI = axios.create({
  baseURL: `${AIRFLOW_BASE_URL}/api/v1`,
  auth: {
    username: AIRFLOW_USERNAME,
    password: AIRFLOW_PASSWORD
  },
  headers: {
    'Content-Type': 'application/json'
  }
});
```

### Security Implications

**✅ Advantages**:
- Credentials never exposed to frontend
- Single point of authentication
- Easy to manage credentials
- No client-side credential storage

**⚠️ Limitations**:
- No user-level authentication
- All users share same Airflow credentials
- No audit trail of individual users
- Backend must be trusted

### Improving Authentication

#### Option 1: Add Backend Authentication

**Implementation**:
```javascript
// backend/server.js
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Apply to all API routes
app.use('/api', authenticateToken);

// Login endpoint
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  // Verify credentials (implement your logic)
  if (verifyCredentials(username, password)) {
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});
```

**Frontend Changes**:
```javascript
// Store token
localStorage.setItem('token', token);

// Add to requests
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
```

#### Option 2: OAuth 2.0 Integration

**Implementation**:
```javascript
import passport from 'passport';
import { Strategy as OAuth2Strategy } from 'passport-oauth2';

passport.use(new OAuth2Strategy({
    authorizationURL: 'https://provider.com/oauth2/authorize',
    tokenURL: 'https://provider.com/oauth2/token',
    clientID: process.env.OAUTH_CLIENT_ID,
    clientSecret: process.env.OAUTH_CLIENT_SECRET,
    callbackURL: 'http://localhost:3001/auth/callback'
  },
  (accessToken, refreshToken, profile, cb) => {
    // Verify user
    return cb(null, profile);
  }
));
```

#### Option 3: API Keys

**Implementation**:
```javascript
// backend/server.js
const API_KEYS = process.env.API_KEYS?.split(',') || [];

const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey || !API_KEYS.includes(apiKey)) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  
  next();
};

app.use('/api', authenticateApiKey);
```

**Frontend**:
```javascript
axios.defaults.headers.common['X-API-Key'] = 'your-api-key';
```

---

## Authorization

### Current State

**No authorization implemented** - All authenticated users have full access.

### Implementing Role-Based Access Control (RBAC)

**Define Roles**:
```javascript
const ROLES = {
  ADMIN: 'admin',      // Full access
  OPERATOR: 'operator', // Trigger, pause/unpause
  VIEWER: 'viewer'     // Read-only
};

const PERMISSIONS = {
  VIEW_DAGS: ['admin', 'operator', 'viewer'],
  TRIGGER_DAG: ['admin', 'operator'],
  PAUSE_DAG: ['admin', 'operator'],
  DELETE_DAG: ['admin']
};
```

**Authorization Middleware**:
```javascript
const authorize = (permission) => {
  return (req, res, next) => {
    const userRole = req.user.role;
    
    if (PERMISSIONS[permission].includes(userRole)) {
      next();
    } else {
      res.status(403).json({ error: 'Insufficient permissions' });
    }
  };
};

// Usage
app.post('/api/dags/:dagId/dagRuns', 
  authenticateToken, 
  authorize('TRIGGER_DAG'), 
  async (req, res) => {
    // Handler
  }
);
```

---

## Data Protection

### Environment Variables Security

**❌ Bad Practice**:
```env
# Committed to git
AIRFLOW_PASSWORD=admin123
```

**✅ Good Practice**:
```bash
# Use .env.example for template
# backend/.env.example
AIRFLOW_BASE_URL=http://localhost:8080
AIRFLOW_USERNAME=your_username
AIRFLOW_PASSWORD=your_password

# Actual .env is in .gitignore
# backend/.env (not committed)
AIRFLOW_BASE_URL=http://localhost:8080
AIRFLOW_USERNAME=admin
AIRFLOW_PASSWORD=super_secure_password_here
```

**Verify .gitignore**:
```gitignore
# .gitignore
.env
.env.local
.env.production
*.env
```

### Secrets Management

#### Option 1: Environment Variables (Basic)
```bash
export AIRFLOW_PASSWORD="secure_password"
npm start
```

#### Option 2: Docker Secrets
```yaml
# docker-compose.yml
services:
  backend:
    secrets:
      - airflow_password

secrets:
  airflow_password:
    file: ./secrets/airflow_password.txt
```

```javascript
// Read secret
const fs = require('fs');
const password = fs.readFileSync('/run/secrets/airflow_password', 'utf8').trim();
```

#### Option 3: AWS Secrets Manager
```javascript
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

const client = new SecretsManagerClient({ region: "us-east-1" });

async function getSecret(secretName) {
  const command = new GetSecretValueCommand({ SecretId: secretName });
  const response = await client.send(command);
  return JSON.parse(response.SecretString);
}

// Usage
const secrets = await getSecret('airflow-credentials');
const AIRFLOW_PASSWORD = secrets.password;
```

#### Option 4: HashiCorp Vault
```javascript
import vault from 'node-vault';

const vaultClient = vault({
  endpoint: 'http://vault:8200',
  token: process.env.VAULT_TOKEN
});

async function getSecret(path) {
  const result = await vaultClient.read(path);
  return result.data;
}

// Usage
const secrets = await getSecret('secret/airflow');
const AIRFLOW_PASSWORD = secrets.password;
```

### Logging Security

**❌ Bad Practice**:
```javascript
console.log('Airflow credentials:', AIRFLOW_USERNAME, AIRFLOW_PASSWORD);
console.log('Request:', req.body); // May contain sensitive data
```

**✅ Good Practice**:
```javascript
// Mask sensitive data
console.log('Airflow user:', AIRFLOW_USERNAME);
console.log('Airflow password:', '***' + AIRFLOW_PASSWORD.slice(-3));

// Sanitize logs
const sanitizeLog = (obj) => {
  const sanitized = { ...obj };
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey'];
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '***REDACTED***';
    }
  }
  
  return sanitized;
};

console.log('Request:', sanitizeLog(req.body));
```

---

## Network Security

### HTTPS/TLS Configuration

**Production Setup with Nginx**:
```nginx
server {
    listen 443 ssl http2;
    server_name airflow-ui.example.com;

    ssl_certificate /etc/ssl/certs/airflow-ui.crt;
    ssl_certificate_key /etc/ssl/private/airflow-ui.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name airflow-ui.example.com;
    return 301 https://$server_name$request_uri;
}
```

### CORS Configuration

**Current (Development)**:
```javascript
app.use(cors()); // Allows all origins
```

**Production**:
```javascript
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || 'https://airflow-ui.example.com',
  methods: ['GET', 'POST', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));
```

**Environment Variable**:
```env
ALLOWED_ORIGINS=https://airflow-ui.example.com,https://admin.example.com
```

### Firewall Rules

**Backend Server**:
```bash
# Allow only from frontend server
sudo ufw allow from 192.168.1.10 to any port 3001

# Or allow from specific network
sudo ufw allow from 192.168.1.0/24 to any port 3001
```

**Airflow Server**:
```bash
# Allow only from backend server
sudo ufw allow from 192.168.1.20 to any port 8080
```
