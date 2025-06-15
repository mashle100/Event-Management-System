import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import QRGenerator from './components/QRGenerator';
import QRScanner from './components/QRScanner';
import Weather from './components/Weather';

const App = () => {
  return (
    <Router>
      <nav style={{ textAlign: 'center', marginBottom: '20px' }}>
        <Link to="/generate" style={{ margin: '10px' }}>Generate QR</Link>
        <Link to="/scan" style={{ margin: '10px' }}>Scan QR</Link>
        <Link to="/weather" style={{ margin: '10px' }}>Weather</Link>
      </nav>
      <Routes>
        <Route path="/generate" element={<QRGenerator />} />
        <Route path="/scan" element={<QRScanner />} />
        <Route path="/weather" element={<Weather />} />
      </Routes>
    </Router>
  );
};

export default App;
