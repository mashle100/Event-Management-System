
const User = require('../models/User');
const Event = require('../models/Event');

exports.requestOrganizerRole = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.role === 'organizer') {
      return res.status(400).json({ message: 'You are already an organizer' });
    }

    if (user.organizerRequested) {
      return res.status(400).json({ message: 'Organizer request already sent' });
    }

    user.organizerRequested = true;
    await user.save();

    res.json({ message: 'Organizer role requested. Awaiting admin approval.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-__v -googleId');
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json(user);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getUserRegistrations = async (req, res) => {
  try {
    const events = await Event.find({ attendees: req.user.id });
    res.json(events);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
};
