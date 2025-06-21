
import { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useParams } from 'react-router-dom';
import API from '../api/axios';

const QRScanner = () => {
  const { eventId, organizerId } = useParams();
  console.log("this is :",organizerId);
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'reader',
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    scanner.render(
      async (decodedText) => {
        try {
          console.log('✅ QR scanned:', decodedText);
          const res = await API.post('/qr/verify', {
            qrId: decodedText,
            eventId,
            organizerId,
          });
          alert(`✅ ${res.data.msg}`);
        } catch (err) {
          alert(`❌ ${err.response?.data?.msg || 'Verification failed'}`);
        }
        scanner.clear(); // Optional: stop after one scan
      },
      (error) => {
        console.warn(`QR Scan Error: ${error}`);
      }
    );

    return () => {
      scanner.clear().catch(console.error);
    };
  }, [eventId, organizerId]);

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>Scan Attendee QR Code</h2>
      <div id="reader" style={{ width: '300px', margin: 'auto' }}></div>
    </div>
  );
};

export default QRScanner;
