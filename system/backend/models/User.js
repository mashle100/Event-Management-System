
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  googleId: String,
  name: String,
  email: String,
  role: {
    type: String,
    enum: ['admin', 'organizer', 'attendee'],
    default: 'attendee'
  },
  organizerRequested: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('User', userSchema);
