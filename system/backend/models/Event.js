
const mongoose = require('mongoose');
const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: [
      'Tech', 
      'Sports', 
      'Cultural', 
      'Workshop', 
      'Seminar', 
      'Business', 
      'Education', 
      'Health', 
      'Music', 
      'Art', 
      'Food', 
      'Fashion', 
      'Gaming', 
      'Social', 
      'Networking',
      'Conference',
      'Training',
      'Other'
    ],
    default: 'Other'
  },
  tags: [String],

  date: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date // NEW: allows events to span multiple days
  },
  startTime: {
    type: String, // 'HH:mm'
    required: true
  },
  endTime: {
    type: String, // 'HH:mm'
    required: true
  },

  eventType: {
    type: String,
    enum: ['Online', 'In-person', 'Hybrid'],
    required: true
  },
  venueName: String,
  address: String,
  city: String,
  mapLink: String,
  onlineLink: String,

  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  contactEmail: String,
  contactPhone: String,
  website: String,

  status: {
    type: String,
    enum: ['active', 'cancelled', 'past'],
    default: 'active'
  },

  maxAttendees: Number,
  registrationDeadline: Date,
  requireApproval: {
    type: Boolean,
    default: false
  },
  enableWaitlist: {
    type: Boolean,
    default: false
  },

  pendingApprovals: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  waitlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  posterImage: String,
  logoImage: String,
  promoVideo: String,

  attendees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  registeredInfo: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    registrationId: {
      type: String,
      required: true
    },
    marked: {
      type: Boolean,
      default: false
    }
  }],

  createdAt: {
    type: Date,
    default: Date.now
  }
});
module.exports = mongoose.model('Event', eventSchema);