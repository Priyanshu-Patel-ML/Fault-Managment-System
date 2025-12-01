# Troubleshooting Guide - Complete Reference

## Table of Contents
1. [Installation Issues](#installation-issues)
2. [Backend Issues](#backend-issues)
3. [Frontend Issues](#frontend-issues)
4. [Connection Issues](#connection-issues)
5. [API Issues](#api-issues)
6. [Performance Issues](#performance-issues)
7. [Debugging Tools](#debugging-tools)

## Installation Issues

### Issue: npm command not found

**Symptoms**:
```bash
$ npm install
bash: npm: command not found
```

**Cause**: Node.js/npm not installed

**Solution**:

**Ubuntu/Debian**:
```bash
# Update package list
sudo apt update

# Install Node.js and npm
sudo apt install nodejs npm

# Verify installation
node --version
npm --version
```

**macOS**:
```bash
# Using Homebrew
brew install node

# Verify
node --version
npm --version
```

**Windows**:
1. Download installer from https://nodejs.org/
2. Run installer
3. Restart terminal
4. Verify: `node --version`

**Alternative - Using nvm (Node Version Manager)**:
```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Restart terminal

# Install Node.js
nvm install 18
nvm use 18

# Verify
node --version
npm --version
```

---

### Issue: Permission denied during npm install

**Symptoms**:
```bash
$ npm install
Error: EACCES: permission denied
```

**Cause**: Insufficient permissions

**Solution 1 - Fix npm permissions (Recommended)**:
```bash
# Create directory for global packages
mkdir ~/.npm-global

# Configure npm to use new directory
npm config set prefix '~/.npm-global'

# Add to PATH (add to ~/.bashrc or ~/.zshrc)
export PATH=~/.npm-global/bin:$PATH

# Reload shell configuration
source ~/.bashrc  # or source ~/.zshrc

# Try install again
npm install
```

**Solution 2 - Use sudo (Not Recommended)**:
```bash
sudo npm install
```

**Solution 3 - Change ownership**:
```bash
# Find npm directory
npm config get prefix

# Change ownership (replace /usr/local with your prefix)
sudo chown -R $(whoami) /usr/local/lib/node_modules
sudo chown -R $(whoami) /usr/local/bin
sudo chown -R $(whoami) /usr/local/share
```

---

### Issue: Package installation fails

**Symptoms**:
```bash
$ npm install
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
```

**Cause**: Dependency conflicts

**Solution 1 - Clear cache and retry**:
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

**Solution 2 - Use legacy peer deps**:
```bash
npm install --legacy-peer-deps
```

**Solution 3 - Update npm**:
```bash
npm install -g npm@latest
```

---

## Backend Issues

### Issue: Backend won't start

**Symptoms**:
```bash
$ npm start
Error: Cannot find module 'express'
```

**Cause**: Dependencies not installed

**Solution**:
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
npm start
```

---

### Issue: Port already in use

**Symptoms**:
```bash
Error: listen EADDRINUSE: address already in use :::3001
```

**Cause**: Another process using port 3001

**Solution 1 - Find and kill process**:

**Linux/macOS**:
```bash
# Find process using port 3001
lsof -i :3001

# Output example:
# COMMAND   PID   USER   FD   TYPE DEVICE SIZE/OFF NODE NAME
# node    12345  user   23u  IPv6  0x...      0t0  TCP *:3001

# Kill the process
kill -9 12345

# Or one-liner
kill -9 $(lsof -t -i:3001)
```

**Windows**:
```cmd
# Find process
netstat -ano | findstr :3001

# Output example:
# TCP    0.0.0.0:3001    0.0.0.0:0    LISTENING    12345

# Kill process (replace 12345 with actual PID)
taskkill /PID 12345 /F
```

**Solution 2 - Change port**:
```bash
# Edit backend/.env
PORT=3002

# Restart backend
npm start
```

---

### Issue: Cannot connect to Airflow

**Symptoms**:
```bash
Error: connect ECONNREFUSED 127.0.0.1:8080
```

**Cause**: Airflow not running or wrong URL

**Diagnosis**:
```bash
# Test Airflow connection
curl http://localhost:8080

# If this fails, Airflow is not running
```

**Solution 1 - Start Airflow**:
```bash
# Check if Airflow is running
ps aux | grep airflow

# Start Airflow webserver
airflow webserver -p 8080

# Start Airflow scheduler (in another terminal)
airflow scheduler
```

**Solution 2 - Check AIRFLOW_BASE_URL**:
```bash
# Edit backend/.env
AIRFLOW_BASE_URL=http://localhost:8080

# Verify URL is correct
curl $AIRFLOW_BASE_URL/health
```

**Solution 3 - Check firewall**:
```bash
# Allow port 8080
sudo ufw allow 8080

# Or disable firewall temporarily
sudo ufw disable
```

---

### Issue: Authentication failed (401)

**Symptoms**:
```json
{
  "error": "Request failed with status code 401",
  "details": {
    "title": "Unauthorized"
  }
}
```

**Cause**: Wrong credentials

**Diagnosis**:
```bash
# Test credentials manually
curl -u admin:admin http://localhost:8080/api/v1/dags

# If this fails, credentials are wrong
```

**Solution 1 - Verify credentials**:
```bash
# Check backend/.env
cat backend/.env | grep AIRFLOW

# Should show:
# AIRFLOW_USERNAME=admin
# AIRFLOW_PASSWORD=admin
```

**Solution 2 - Reset Airflow password**:
```bash
# Using Airflow CLI
airflow users list

# Reset password
airflow users reset-password -u admin
```

**Solution 3 - Create new user**:
```bash
airflow users create \
  --username api_user \
  --firstname API \
  --lastname User \
  --role Admin \
  --email api@example.com \
  --password your_password

# Update backend/.env
AIRFLOW_USERNAME=api_user
AIRFLOW_PASSWORD=your_password
```

---

### Issue: CORS errors

**Symptoms**:
```
Access to XMLHttpRequest at 'http://localhost:3001/api/dags' 
from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Cause**: CORS not configured properly

**Solution 1 - Verify CORS middleware**:

Check `backend/server.js`:
```javascript
import cors from 'cors';
app.use(cors());  // This should be present
```

**Solution 2 - Configure specific origin**:
```javascript
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

**Solution 3 - Check middleware order**:
```javascript
// CORS must be before routes
app.use(cors());  // ✅ Correct
app.use(bodyParser.json());
app.get('/api/dags', ...);  // Routes after middleware
```

---

## Frontend Issues

### Issue: Frontend won't start

**Symptoms**:
```bash
$ npm run dev
Error: Cannot find module 'vite'
```

**Cause**: Dependencies not installed

**Solution**:
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

### Issue: Blank page / White screen

**Symptoms**:
- Browser shows blank page
- No errors in terminal
- Console shows errors

**Diagnosis**:
```bash
# Open browser console (F12)
# Check for JavaScript errors
```

**Common Errors and Solutions**:

**Error 1: "Failed to fetch"**
```
Cause: Backend not running
Solution: Start backend server
```

**Error 2: "Unexpected token '<'"**
```
Cause: Wrong API endpoint
Solution: Check vite.config.js proxy settings
```

**Error 3: "Cannot read property of undefined"**
```
Cause: API response format changed
Solution: Check API response structure
```

**Solution - Check console**:
```javascript
// Open browser console (F12)
// Look for errors in Console tab
// Check Network tab for failed requests
```

---

### Issue: Changes not reflecting

**Symptoms**:
- Made code changes
- Changes don't appear in browser
- Old code still running

**Cause**: Cache or build issues

**Solution 1 - Hard refresh**:
```
Chrome/Firefox: Ctrl + Shift + R (Windows/Linux)
Chrome/Firefox: Cmd + Shift + R (macOS)
```

**Solution 2 - Clear cache**:
```bash
# Stop dev server (Ctrl+C)

# Clear Vite cache
rm -rf frontend/node_modules/.vite

# Restart
npm run dev
```

**Solution 3 - Rebuild**:
```bash
# Stop server
# Remove build artifacts
rm -rf frontend/dist

# Restart
npm run dev
```

---

### Issue: Module not found errors

**Symptoms**:
```
Error: Cannot find module './components/DagList'
```

**Cause**: Wrong import path or missing file

**Solution 1 - Check file exists**:
```bash
ls frontend/src/components/DagList.jsx
```

**Solution 2 - Check import path**:
```javascript
// ❌ Wrong
import DagList from './DagList';

// ✅ Correct
import DagList from './components/DagList';
```

**Solution 3 - Check file extension**:
```javascript
// ❌ Missing extension
import DagList from './components/DagList';

// ✅ With extension
import DagList from './components/DagList.jsx';
```
