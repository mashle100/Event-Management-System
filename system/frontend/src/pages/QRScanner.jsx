
import { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useParams } from 'react-router-dom';
import API from '../api/axios';

const QRScanner = () => {
  const { eventId, organizerId } = useParams();
  const [scanResults, setScanResults] = useState([]);
  const [isScanning, setIsScanning] = useState(true);
  const scannerRef = useRef(null);
  const [scannerKey, setScannerKey] = useState(0);

  useEffect(() => {
    if (!eventId || !organizerId || organizerId === 'undefined') {
      setIsScanning(false);
      return;
    }

    if (!isScanning) return;

    const newScanner = new Html5QrcodeScanner(
      'reader',
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    scannerRef.current = newScanner;

    newScanner.render(
      async (decodedText) => {
        try {
          // Check if this QR code was already scanned
          const alreadyScanned = scanResults.some(result => result.qrId === decodedText);
          if (alreadyScanned) {
            setScanResults(prev => [...prev, {
              qrId: decodedText,
              timestamp: new Date().toLocaleTimeString(),
              status: 'duplicate',
              message: 'QR code already scanned'
            }]);
            return; // Don't send duplicate requests
          }

          const res = await API.post('/qr/verify', {
            qrId: decodedText,
            eventId,
            organizerId,
          });
          
          // Add successful scan to results
          setScanResults(prev => [...prev, {
            qrId: decodedText,
            timestamp: new Date().toLocaleTimeString(),
            status: 'success',
            message: res.data.msg
          }]);
          
        } catch (err) {
          console.error('QR verification error:', err);
          
          // Add failed scan to results
          setScanResults(prev => [...prev, {
            qrId: decodedText,
            timestamp: new Date().toLocaleTimeString(),
            status: 'error',
            message: err.response?.data?.msg || 'Verification failed'
          }]);
        }
        // Don't clear the scanner - keep scanning for more QR codes
      },
      (error) => {
        console.warn(`QR Scan Error: ${error}`);
      }
    );

    return () => {
      newScanner.clear().catch(console.error);
    };
  }, [eventId, organizerId, isScanning, scannerKey]);

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error);
      setIsScanning(false);
    }
  };

  const startScanning = () => {
    setIsScanning(true);
    // Force re-render of scanner by changing key
    setScannerKey(prev => prev + 1);
  };

  const clearResults = () => {
    setScanResults([]);
  };

  // Show error state if parameters are missing
  if (!eventId || !organizerId || organizerId === 'undefined') {
    return (
      <div className="page-container">
        <div className="container">
          <div className="page-header">
            <h1 className="page-title">QR Code Scanner</h1>
            <p className="page-subtitle">Error: Missing required parameters</p>
          </div>
          <div className="error-message">
            <p>Cannot initialize QR scanner. Missing event ID or organizer ID.</p>
            <p>Event ID: {eventId || 'Missing'}</p>
            <p>Organizer ID: {organizerId || 'Missing'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">QR Code Scanner</h1>
          <p className="page-subtitle">Scan attendee QR codes for event verification</p>
        </div>

        {/* Scanner Controls */}
        <div className="scanner-controls">
          <div className="control-buttons">
            {isScanning ? (
              <button onClick={stopScanning} className="btn btn-danger">
                Stop Scanning
              </button>
            ) : (
              <button onClick={startScanning} className="btn btn-success">
                Start Scanning
              </button>
            )}
            {scanResults.length > 0 && (
              <button onClick={clearResults} className="btn btn-secondary">
                Clear Results
              </button>
            )}
          </div>
        </div>
        
        <div className="qr-scanner-container">
          {isScanning && <div key={scannerKey} id="reader" className="qr-reader"></div>}
        </div>

        {/* Scan Results */}
        {scanResults.length > 0 && (
          <div className="scan-results">
            <div className="results-header">
              <h3 className="page-title">Scan Results</h3>
              <div className="scan-stats">
                <span className="stat-item">
                  <span className="stat-label">Total:</span>
                  <span className="stat-value">{scanResults.length}</span>
                </span>
                <span className="stat-item">
                  <span className="stat-label">✅ Success:</span>
                  <span className="stat-value">{scanResults.filter(r => r.status === 'success').length}</span>
                </span>
                <span className="stat-item">
                  <span className="stat-label">❌ Failed:</span>
                  <span className="stat-value">{scanResults.filter(r => r.status === 'error').length}</span>
                </span>
                <span className="stat-item">
                  <span className="stat-label">🔁 Duplicate:</span>
                  <span className="stat-value">{scanResults.filter(r => r.status === 'duplicate').length}</span>
                </span>
              </div>
            </div>
            <div className="results-list">
              {scanResults.slice().reverse().map((result, index) => (
                <div key={index} className={`result-item ${result.status}`}>
                  <div className="result-header">
                    <span className="result-time">{result.timestamp}</span>
                    <span className={`result-status ${result.status}`}>
                      {result.status === 'success' ? '✅' : result.status === 'duplicate' ? '🔁' : '❌'}
                    </span>
                  </div>
                  <div className="result-message">{result.message}</div>
                  <div className="result-qr">QR: {result.qrId}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRScanner;
