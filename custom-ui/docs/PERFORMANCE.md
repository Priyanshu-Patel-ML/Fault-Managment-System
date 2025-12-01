# Performance Optimization Guide

## Table of Contents
1. [Performance Overview](#performance-overview)
2. [Frontend Optimization](#frontend-optimization)
3. [Backend Optimization](#backend-optimization)
4. [Network Optimization](#network-optimization)
5. [Caching Strategies](#caching-strategies)
6. [Monitoring and Profiling](#monitoring-and-profiling)

## Performance Overview

### Performance Metrics

**Target Metrics**:
- **Page Load Time**: < 2 seconds
- **Time to Interactive**: < 3 seconds
- **API Response Time**: < 500ms
- **First Contentful Paint**: < 1 second

### Current Architecture Performance

```
Request Flow:
Frontend → Backend → Airflow
  ~10ms     ~50ms     ~200ms

Total: ~260ms (typical)
```

---

## Frontend Optimization

### 1. Code Splitting

**Problem**: Large bundle size slows initial load

**Solution**: Split code by route

```javascript
// App.jsx
import React, { lazy, Suspense } from 'react';

// Lazy load components
const DagList = lazy(() => import('./components/DagList'));
const DagDetails = lazy(() => import('./components/DagDetails'));
const DagRuns = lazy(() => import('./components/DagRuns'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route path="/" element={<DagList />} />
        <Route path="/dag/:dagId" element={<DagDetails />} />
        <Route path="/runs" element={<DagRuns />} />
      </Routes>
    </Suspense>
  );
}
```

**Benefits**:
- Smaller initial bundle
- Faster first load
- Components loaded on demand

### 2. Memoization

**Problem**: Unnecessary re-renders

**Solution**: Use React.memo and useMemo

```javascript
import React, { memo, useMemo } from 'react';

// Memoize component
const DagCard = memo(({ dag, onTrigger, onPause }) => {
  return (
    <div className="dag-card">
      {/* Component content */}
    </div>
  );
});

// Memoize expensive calculations
function DagList() {
  const [dags, setDags] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredDags = useMemo(() => {
    return dags.filter(dag =>
      dag.dag_id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [dags, searchTerm]);
  
  return (
    <div>
      {filteredDags.map(dag => (
        <DagCard key={dag.dag_id} dag={dag} />
      ))}
    </div>
  );
}
```

### 3. Virtualization

**Problem**: Rendering hundreds of DAGs is slow

**Solution**: Use react-window for virtual scrolling

```bash
npm install react-window
```

```javascript
import { FixedSizeList } from 'react-window';

function DagList() {
  const [dags, setDags] = useState([]);
  
  const Row = ({ index, style }) => (
    <div style={style}>
      <DagCard dag={dags[index]} />
    </div>
  );
  
  return (
    <FixedSizeList
      height={600}
      itemCount={dags.length}
      itemSize={200}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
}
```

### 4. Debouncing Search

**Problem**: API call on every keystroke

**Solution**: Debounce search input

```javascript
import { useState, useEffect } from 'react';

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

// Usage
function DagList() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  useEffect(() => {
    if (debouncedSearchTerm) {
      // Perform search
    }
  }, [debouncedSearchTerm]);
}
```

### 5. Image Optimization

**Problem**: Large images slow page load

**Solution**: Optimize and lazy load images

```javascript
// Lazy load images
<img 
  src={dag.icon} 
  loading="lazy" 
  alt={dag.dag_id}
/>

// Use WebP format
<picture>
  <source srcSet="icon.webp" type="image/webp" />
  <img src="icon.png" alt="DAG icon" />
</picture>
```

---

## Backend Optimization

### 1. Response Compression

**Install gzip compression**:
```bash
npm install compression
```

**Implementation**:
```javascript
import compression from 'compression';

app.use(compression({
  level: 6, // Compression level (0-9)
  threshold: 1024, // Only compress responses > 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));
```

**Benefits**:
- 60-80% size reduction
- Faster data transfer
- Lower bandwidth usage

### 2. Request Caching

**Install node-cache**:
```bash
npm install node-cache
```

**Implementation**:
```javascript
import NodeCache from 'node-cache';

const cache = new NodeCache({
  stdTTL: 60, // 60 seconds default TTL
  checkperiod: 120 // Check for expired keys every 2 minutes
});

// Cache middleware
const cacheMiddleware = (duration) => {
  return (req, res, next) => {
    const key = req.originalUrl;
    const cachedResponse = cache.get(key);
    
    if (cachedResponse) {
      console.log('Cache hit:', key);
      return res.json(cachedResponse);
    }
    
    // Store original res.json
    const originalJson = res.json.bind(res);
    
    // Override res.json
    res.json = (body) => {
      cache.set(key, body, duration);
      return originalJson(body);
    };
    
    next();
  };
};

// Usage
app.get('/api/dags', cacheMiddleware(60), async (req, res) => {
  // Handler
});
```

### 3. Connection Pooling

**Configure axios with keep-alive**:
```javascript
import axios from 'axios';
import http from 'http';
import https from 'https';

const airflowAPI = axios.create({
  baseURL: `${AIRFLOW_BASE_URL}/api/v1`,
  auth: {
    username: AIRFLOW_USERNAME,
    password: AIRFLOW_PASSWORD
  },
  httpAgent: new http.Agent({ 
    keepAlive: true,
    maxSockets: 50
  }),
  httpsAgent: new https.Agent({ 
    keepAlive: true,
    maxSockets: 50
  })
});
```

**Benefits**:
- Reuse TCP connections
- Reduce connection overhead
- Faster subsequent requests

### 4. Request Timeout

**Set appropriate timeouts**:
```javascript
const airflowAPI = axios.create({
  baseURL: `${AIRFLOW_BASE_URL}/api/v1`,
  timeout: 30000, // 30 seconds
  auth: {
    username: AIRFLOW_USERNAME,
    password: AIRFLOW_PASSWORD
  }
});
```

### 5. Parallel Requests

**Problem**: Sequential requests are slow

**Solution**: Use Promise.all for parallel requests

```javascript
// ❌ Sequential (slow)
const dags = await getDags();
const runs = await getDagRuns();
const tasks = await getTaskInstances();
// Total: 600ms

// ✅ Parallel (fast)
const [dags, runs, tasks] = await Promise.all([
  getDags(),
  getDagRuns(),
  getTaskInstances()
]);
// Total: 200ms (fastest request)
```

---

## Network Optimization

### 1. HTTP/2

**Enable HTTP/2 in production**:

**With Express + SPDY**:
```bash
npm install spdy
```

```javascript
import spdy from 'spdy';
import fs from 'fs';

const options = {
  key: fs.readFileSync('./ssl/server.key'),
  cert: fs.readFileSync('./ssl/server.crt')
};

spdy.createServer(options, app).listen(3001, () => {
  console.log('Server running with HTTP/2');
});
```

**Benefits**:
- Multiplexing (multiple requests over single connection)
- Header compression
- Server push

### 2. CDN for Static Assets

**Use CDN for production**:

**Vite configuration**:
```javascript
// vite.config.js
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    }
  },
  base: 'https://cdn.example.com/airflow-ui/'
});
```

### 3. Prefetching

**Prefetch critical resources**:
```html
<!-- index.html -->
<link rel="prefetch" href="/api/dags" />
<link rel="preconnect" href="http://localhost:3001" />
```

---

## Caching Strategies

### Browser Caching

**Set cache headers**:
```javascript
// For static assets
app.use('/assets', express.static('public', {
  maxAge: '1y',
  immutable: true
}));

// For API responses
app.get('/api/dags', (req, res) => {
  res.set('Cache-Control', 'public, max-age=60'); // Cache for 60 seconds
  // Handler
});
```

### Service Worker Caching

**Create service worker**:
```javascript
// public/sw.js
const CACHE_NAME = 'airflow-ui-v1';
const urlsToCache = [
  '/',
  '/assets/main.js',
  '/assets/main.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
```

**Register service worker**:
```javascript
// main.jsx
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
```
