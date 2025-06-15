import { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import axios from 'axios';

const QRScanner = () => {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'reader',
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    scanner.render(
      async (decodedText) => {
        try {
          const res = await axios.post('http://localhost:5000/api/qr/verify', {
            qrId: decodedText,
          });
          alert(`✅ ${res.data.msg}`);
        } catch (err) {
          alert(`❌ ${err.response?.data?.msg || 'Verification failed'}`);
        }
        scanner.clear(); // Stop scanning after success
      },
      (error) => {
        console.warn(`QR error: ${error}`);
      }
    );

    return () => {
      scanner.clear().catch(console.error);
    };
  }, []);

  return (
    <div>
      <h2>Scan QR Code</h2>
      <div id="reader" style={{ width: '300px', margin: 'auto' }}></div>
    </div>
  );
};

export default QRScanner;
