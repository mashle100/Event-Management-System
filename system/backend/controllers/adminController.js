
const User = require('../models/User');
const Event = require('../models/Event');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (err) {
    console.error('Get all users error:', err);
    res.status(500).json({ message: 'Server error fetching users' });
  }
};

exports.getPendingOrganizers = async (req, res) => {
  try {
    const pending = await User.find({ role: 'attendee', organizerRequested: true });
    res.json(pending);
  } catch (err) {
    console.error('Get pending organizers error:', err);
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
  } catch (err) {
    console.error('Approve organizer error:', err);
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
  } catch (err) {
    console.error('Reject organizer error:', err);
    res.status(500).json({ message: 'Server error rejecting organizer' });
  }
};

exports.getApprovedOrganizers = async (req, res) => {
  try {
    const organizers = await User.find({ role: 'organizer' });
    res.json(organizers);
  } catch (err) {
    console.error('Get approved organizers error:', err);
    res.status(500).json({ message: 'Server error fetching organizers' });
  }
};

exports.getAllEvents = async (req, res) => {
  try {
    const events = await Event.find()
      .populate('organizer', 'name email')
      .populate('attendees', 'name email');

    const formatted = events.map(e => ({
      _id: e._id,
      title: e.title,
      description: e.description,
      category: e.category,
      tags: e.tags,
      date: e.date,
      endDate: e.endDate,
      startTime: e.startTime,
      endTime: e.endTime,
      eventType: e.eventType,
      venueName: e.venueName,
      address: e.address,
      city: e.city,
      mapLink: e.mapLink,
      onlineLink: e.onlineLink,
      contactEmail: e.contactEmail,
      contactPhone: e.contactPhone,
      website: e.website,
      posterImage: e.posterImage,
      logoImage: e.logoImage,
      promoVideo: e.promoVideo,
      status: e.status,
      maxAttendees: e.maxAttendees,
      registrationDeadline: e.registrationDeadline,
      requireApproval: e.requireApproval,
      enableWaitlist: e.enableWaitlist,
      attendees: Array.isArray(e.attendees)
        ? e.attendees.map(u => ({ _id: u._id, name: u.name, email: u.email }))
        : [],
      attendeesCount: e.attendees?.length || 0,
      organizerName: e.organizer?.name,
      organizerEmail: e.organizer?.email,
      registeredInfo: e.registeredInfo,
      createdAt: e.createdAt
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Get all events error:', err);
    res.status(500).json({ message: 'Could not fetch events' });
  }
};
