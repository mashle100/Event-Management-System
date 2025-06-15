const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/eventDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('✅ Connected to MongoDB');
}).catch(err => {
  console.error('❌ MongoDB connection error:', err);
});

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' })); // for handling large image data
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mongoose Schema & Model
const qrSchema = new mongoose.Schema({
  qrId: String,
  imagePath: String,
  marked: {
    type: Boolean,
    default: false
  }
});
const QRCode = mongoose.model('QRCode', qrSchema);

// Routes

// 1️⃣ Generate QR - save image and record
app.post('/api/qr/generate', async (req, res) => {
  const { qrId, image } = req.body;
  if (!qrId || !image) return res.status(400).json({ msg: 'Missing qrId or image' });

  const imageBuffer = Buffer.from(image.split(',')[1], 'base64');
  const filePath = `uploads/${qrId}.png`;

  fs.writeFile(filePath, imageBuffer, async (err) => {
    if (err) return res.status(500).json({ msg: 'Failed to save image' });

    try {
      await QRCode.create({ qrId, imagePath: filePath });
      res.json({ msg: 'QR code saved successfully', path: filePath });
    } catch (dbErr) {
      res.status(500).json({ msg: 'Database error', error: dbErr });
    }
  });
});

// 2️⃣ Verify QR - check and update marked status
app.post('/api/qr/verify', async (req, res) => {
  const { qrId } = req.body;
  if (!qrId) return res.status(400).json({ msg: 'Missing qrId' });

  const qr = await QRCode.findOne({ qrId });
  if (!qr) return res.status(404).json({ msg: 'QR not found' });

  if (qr.marked) {
    return res.status(400).json({ msg: 'QR already marked' });
  }

  qr.marked = true;
  await qr.save();
  res.json({ msg: 'QR marked successfully' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
