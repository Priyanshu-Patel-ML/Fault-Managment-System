import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import DagList from './components/DagList';
import DagDetails from './components/DagDetails';
import DagRuns from './components/DagRuns';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <header className="app-header">
          <div className="container">
            <h1>Fault Management System</h1>
            <nav className="nav-menu">
              <Link to="/" className="nav-link">Faults</Link>
            </nav>
          </div>
        </header>

        <main className="container">
          <Routes>
            <Route path="/" element={<DagList />} />
            <Route path="/dag/:dagId" element={<DagDetails />} />
            <Route path="/runs" element={<DagRuns />} />
          </Routes>
        </main>

        <footer className="app-footer">
          <div className="container">
            <p>Fault Management System - Powered by XORIANT</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;

