const Event = require('../models/Event');

// Helper: Combine date and time into Date object
function getEventStartDateTime(event) {
  const [hours, minutes] = event.startTime.split(':').map(Number);
  const startDateTime = new Date(event.date);
  startDateTime.setHours(hours, minutes, 0, 0);
  return startDateTime;
}
function getEventEndDateTime(event) {
  const [hours, minutes] = event.endTime.split(':').map(Number);
  const endDateTime = new Date(event.endDate);
  endDateTime.setHours(hours, minutes, 0, 0);
  return endDateTime;
}

function formatEvent(e, includeAttendees = false, userId = null) {
  return {
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
    pendingAttendees: e.pendingApprovals?.map?.(u =>
  typeof u === 'object' ? { _id: u._id, name: u.name, email: u.email } : u
),

    waitlist: e.waitlist?.map?.(u =>
      typeof u === 'object' ? { _id: u._id, name: u.name, email: u.email } : u
    ),
    attendeesCount: e.attendees?.length || 0,
    organizerId: e.organizer?._id,
    organizerName: e.organizer?.name,
    organizerEmail: e.organizer?.email,
    registeredInfo: e.registeredInfo,
    ...(includeAttendees && {
      attendees: e.attendees?.map?.(u =>
        typeof u === 'object' ? { _id: u._id, name: u.name, email: u.email } : u
      )
    }),
    ...(userId && {
      isRegistered: e.attendees?.some(u => u.toString?.() === userId || u._id?.toString?.() === userId) || false,
      isPendingApproval: e.pendingApprovals?.some(u => u.toString?.() === userId || u._id?.toString?.() === userId) || false,
      isInWaitlist: e.waitlist?.some(u => u.toString?.() === userId || u._id?.toString?.() === userId) || false
    })
  };
}


// Helper: Populate registeredInfo when time condition is met
async function fillRegisteredInfoIfNeeded(event) {
  if (event.status === 'active' && event.registeredInfo.length === 0) {
    const startDateTime = getEventStartDateTime(event);
    const oneHourBefore = new Date(startDateTime.getTime() - 60 * 60 * 1000);
    const now = new Date();

    if (now >= oneHourBefore) {
      event.registeredInfo = event.attendees.map(userId => ({
        user: userId,
        registrationId: `${event.organizer.toString()}-${userId.toString()}-${event._id.toString()}`,
        marked: false
      }));
      await event.save();
    }
  }
}

exports.createEvent = async (req, res) => {
  try {
    const {
      title, description, category, tags, date,endDate, startTime, endTime,
      eventType, venueName, address, city, mapLink, onlineLink,
      contactEmail, contactPhone, website, posterImage, logoImage, promoVideo,
      maxAttendees, registrationDeadline, 
      requireApproval, enableWaitlist
    } = req.body;

    const newEvent = await Event.create({
      title,
      description,
      category,
      tags,
      date,
      endDate,
      startTime,
      endTime,
      eventType,
      venueName,
      address,
      city,
      mapLink,
      onlineLink,
      contactEmail,
      contactPhone,
      website,
      posterImage,
      logoImage,
      promoVideo,
      status: 'active',
      organizer: req.user.id,
      attendees: [],
      registeredInfo: [],
      maxAttendees,
      registrationDeadline,
      requireApproval,
      enableWaitlist
    });

    res.status(201).json({ event: newEvent });
  } catch (err) {
    console.error('Create event error:', err);
    res.status(500).json({ error: 'Could not create event' });
  }
};

exports.getAllEvents = async (req, res) => {
  try {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    yesterday.setHours(23, 59, 59, 999);

    const eventsToUpdate = await Event.find({ status: 'active' });

for (let e of eventsToUpdate) {
  const endDateTime = getEventEndDateTime(e);
  const now = new Date();

  if (now > endDateTime) {
    e.status = 'past';
    await e.save();
  }
}


    const events = await Event.find()
      .populate('organizer', 'name email')
      .populate('attendees', 'name email');

    for (let event of events) {
      await fillRegisteredInfoIfNeeded(event);
    }

    res.json(events.map(e => formatEvent(e, false, req.user?.id)));
 // attendees excluded
  } catch (err) {
    console.error('Get all events error:', err);
    res.status(500).json({ error: 'Could not fetch events' });
  }
};


exports.getMyEvents = async (req, res) => {
  try {
    const events = await Event.find({ organizer: req.user.id })
      .populate('organizer', 'name email')
      .populate('attendees', 'name email')
      .populate('pendingApprovals', 'name email')
      .populate('waitlist', 'name email');
    for (let event of events) {
      await fillRegisteredInfoIfNeeded(event);
    }

    res.json(events.map(e => formatEvent(e, false, req.user?.id)));
 // attendees included
  } catch (err) {
    console.error('Get my events error:', err);
    res.status(500).json({ error: 'Could not fetch your events' });
  }
};

exports.registerForEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event || event.status !== 'active') {
      return res.status(400).json({ error: 'Event not available' });
    }

    const userId = req.user.id;

    if (
      event.attendees.includes(userId) ||
      event.pendingApprovals.includes(userId) ||
      event.waitlist.includes(userId)
    ) {
      return res.status(400).json({ error: 'Already in process or registered' });
    }

    const isFull = event.attendees.length >= event.maxAttendees;

    // If approval required
    if (event.requireApproval) {
      event.pendingApprovals.push(userId);
      await event.save();
      return res.status(202).json({ 
        message: 'Registration pending approval',
        registrationStatus: 'pending'   // <-- send status here
      });
    }

    // If event is full
    if (isFull) {
      if (event.enableWaitlist) {
        event.waitlist.push(userId);
        await event.save();
        return res.status(200).json({ 
          message: 'Added to waitlist',
          registrationStatus: 'waitlist'  // <-- send status here
        });
      } else {
        return res.status(400).json({ error: 'Event is full' });
      }
    }

    // Regular registration
    event.attendees.push(userId);
    event.registeredInfo.push({
      user: userId,
      registrationId: `${event.organizer}-${userId}-${event._id}`,
      marked: false
    });

    await event.save();
    return res.json({ 
      message: 'Registered successfully',
      registrationStatus: 'registered'  // <-- send status here
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
};

exports.deregisterFromEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    const userId = req.user.id;

    if (!event) return res.status(404).json({ error: 'Event not found' });

    let modified = false;

    // Remove from attendees
    if (event.attendees.includes(userId)) {
      event.attendees.pull(userId);
      event.registeredInfo = event.registeredInfo.filter(
        entry => entry.user.toString() !== userId
      );
      modified = true;

      // Promote from waitlist if possible
      if (event.waitlist.length > 0) {
        const nextUser = event.waitlist.shift();
        event.attendees.push(nextUser);
        event.registeredInfo.push({
          user: nextUser,
          registrationId: `${event.organizer}-${nextUser}-${event._id}`,
          marked: false
        });
      }
    }

    // Remove from pending approvals or waitlist
    event.pendingApprovals = event.pendingApprovals.filter(u => u.toString() !== userId);
    event.waitlist = event.waitlist.filter(u => u.toString() !== userId);

    if (!modified && !event.pendingApprovals.includes(userId) && !event.waitlist.includes(userId)) {
      return res.status(400).json({ error: 'Not registered' });
    }

    await event.save();
    res.json({ message: 'Deregistered successfully' });
  } catch (err) {
    console.error('Deregister error:', err);
    res.status(500).json({ error: 'Deregistration failed' });
  }
};

exports.cancelEvent = async (req, res) => {
  try {
    const e = await Event.findById(req.params.id);
    if (!e) return res.status(404).json({ error: 'Event not found' });
    if (e.organizer.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not your event' });
    }

    e.status = 'cancelled';
    await e.save();
    res.json({ message: 'Event cancelled' });
  } catch (err) {
    console.error('Cancel event error:', err);
    res.status(500).json({ error: 'Cancellation failed' });
  }
};
exports.getMyRegisteredEvents = async (req, res) => {
  try {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    yesterday.setHours(23, 59, 59, 999);

    const eventsToUpdate = await Event.find({ status: 'active' });

for (let e of eventsToUpdate) {
  const endDateTime = getEventEndDateTime(e);
  const now = new Date();

  if (now > endDateTime) {
    e.status = 'past';
    await e.save();
  }
}

    const events = await Event.find({ attendees: req.user.id })
      .populate('organizer', 'name email');

    for (let event of events) {
      await fillRegisteredInfoIfNeeded(event);
    }

    res.json(events.map(e => formatEvent(e, false))); // attendees excluded
  } catch (err) {
    console.error('Get registered events error:', err);
    res.status(500).json({ error: 'Could not fetch registered events' });
  }
};

exports.approveAttendee = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    const userId = req.params.userId;

    if (!event || event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized or event not found' });
    }

    const index = event.pendingApprovals.findIndex(u =>
      (typeof u === 'object' ? u._id.toString() : u.toString()) === userId
    );

    if (index === -1) {
      return res.status(400).json({ error: 'User not in pending list' });
    }

    // Only check if maxAttendees is a positive number
    const hasMaxAttendees = typeof event.maxAttendees === 'number' && event.maxAttendees > 0;
    const isFull = hasMaxAttendees && event.attendees.length >= event.maxAttendees;


    if (isFull && !event.enableWaitlist) {
      // Return 400 with a clear message about max attendees reached
      return res.status(400).json({ error: 'Max attendees limit reached' });
    }

    // Remove user from pending approvals
    event.pendingApprovals.splice(index, 1);

    if (isFull && event.enableWaitlist) {
      event.waitlist.push(userId);
    } else {
      event.attendees.push(userId);
      event.registeredInfo.push({
        user: userId,
        registrationId: `${event.organizer}-${userId}-${event._id}`,
        marked: false
      });
    }

    await event.save();
    res.json({ message: 'User approved' });
  } catch (err) {
    console.error('Approve error:', err);
    res.status(500).json({ error: 'Approval failed' });
  }
};




exports.rejectAttendee = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    const userId = req.params.userId;

    if (!event || event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized or event not found' });
    }

    const index = event.pendingApprovals.findIndex(u =>
      (typeof u === 'object' ? u._id.toString() : u.toString()) === userId
    );
    if (index === -1) {
      return res.status(400).json({ error: 'User not in pending list' });
    }

    event.pendingApprovals.splice(index, 1);
    await event.save();
    res.json({ message: 'User rejected' });
  } catch (err) {
    console.error('Reject error:', err);
    res.status(500).json({ error: 'Rejection failed' });
  }
};
