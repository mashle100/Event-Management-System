
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
    const userId = req.user.id;
    
    // Find all events where the user is registered, pending, or on waitlist
    const events = await Event.find({
      $or: [
        { attendees: userId },
        { pendingApprovals: userId },
        { waitlist: userId }
      ]
    }).populate('organizer', 'name email _id');

    // Add registration status for each event
    const eventsWithStatus = events.map(event => {
      let registrationStatus = 'registered';
      
      if (event.pendingApprovals.includes(userId)) {
        registrationStatus = 'pending';
      } else if (event.waitlist.includes(userId)) {
        registrationStatus = 'waitlist';
      }
      
      return {
        ...event.toObject(),
        registrationStatus,
        organizerId: event.organizer?._id,
        organizerName: event.organizer?.name,
        organizerEmail: event.organizer?.email,
        attendeesCount: event.attendees?.length || 0
      };
    });

    res.json(eventsWithStatus);
  } catch (err) {
    console.error('Get user registrations error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
