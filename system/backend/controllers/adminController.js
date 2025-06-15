
const User = require('../models/User');
const Event = require('../models/Event');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch {
    res.status(500).json({ message: 'Server error fetching users' });
  }
};

exports.getPendingOrganizers = async (req, res) => {
  try {
    const pending = await User.find({ role: 'attendee', organizerRequested: true });
    res.json(pending);
  } catch {
    res.status(500).json({ message: 'Server error fetching pending organizers' });
  }
};

exports.approveOrganizer = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    if (!user || user.role !== 'attendee' || !user.organizerRequested) {
      return res.status(400).json({ message: 'No valid organizer request found' });
    }
    user.role = 'organizer';
    user.organizerRequested = false;
    await user.save();
    res.json({ message: 'Organizer approved' });
  } catch {
    res.status(500).json({ message: 'Server error approving organizer' });
  }
};

exports.rejectOrganizer = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    if (!user || user.role !== 'attendee' || !user.organizerRequested) {
      return res.status(400).json({ message: 'No valid organizer request found' });
    }
    user.organizerRequested = false;
    await user.save();
    res.json({ message: 'Organizer request rejected' });
  } catch {
    res.status(500).json({ message: 'Server error rejecting organizer' });
  }
};

exports.getApprovedOrganizers = async (req, res) => {
  try {
    const organizers = await User.find({ role: 'organizer' });
    res.json(organizers);
  } catch {
    res.status(500).json({ message: 'Server error fetching organizers' });
  }
};

exports.getAllEvents = async (req, res) => {
  try {
    const events = await Event.find().populate('organizer', 'name email');
    const formatted = events.map(e => ({
      _id: e._id,
      title: e.title,
      description: e.description,
      date: e.date,
      status: e.status,
      attendeesCount: e.attendees.length,
      organizerName: e.organizer?.name,
      organizerEmail: e.organizer?.email
    }));
    res.json(formatted);
  } catch {
    res.status(500).json({ message: 'Could not fetch events' });
  }
};
