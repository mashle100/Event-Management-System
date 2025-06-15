import React, { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import axios from 'axios';

const QRGenerator = () => {
  const [qrId, setQrId] = useState('');
  const [saved, setSaved] = useState(false);

  const generateQR = () => {
    const newQrId = Date.now().toString();
    setQrId(newQrId);
    setSaved(false);
  };

  const saveQR = async () => {
    try {
      const canvas = document.getElementById('qr-code');
      const imageData = canvas.toDataURL('image/png');
      await axios.post('http://localhost:5000/api/qr/generate', {
        qrId,
        image: imageData,
      });
      setSaved(true);
      alert('QR Code saved successfully!');
    } catch (error) {
      console.error('Error saving QR code:', error);
      alert('Failed to save QR code.');
    }
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <h2>Generate QR Code</h2>
      <button onClick={generateQR}>Generate New QR Code</button>
      {qrId && (
        <>
          <div style={{ margin: '20px' }}>
            <QRCodeCanvas id="qr-code" value={qrId} size={256} />
          </div>
          <button onClick={saveQR} disabled={saved}>
            {saved ? 'Saved!' : 'Save QR Code to Backend'}
          </button>
        </>
      )}
    </div>
  );
};

export default QRGenerator;
