
// const Event = require('../models/Event');

// exports.createEvent = async (req, res) => {
//   const { title, description, date } = req.body;
//   try {
//     const newEvent = await Event.create({
//       title,
//       description,
//       date,
//       status: 'active',
//       organizer: req.user.id
//     });
//     res.status(201).json({ event: newEvent });
//   } catch {
//     res.status(500).json({ error: 'Could not create event' });
//   }
// };

// exports.getAllEvents = async (req, res) => {
//   try {
//     const events = await Event.find().populate('organizer', 'name email');

//     const now = new Date();
//     for (let e of events) {
//       if (e.status === 'active' && new Date(e.date) < now) {
//         e.status = 'past';
//         await e.save();
//       }
//     }

//     const formatted = events.map(e => ({
//       _id: e._id,
//       title: e.title,
//       description: e.description,
//       date: e.date,
//       status: e.status,
//       attendeesCount: e.attendees.length,
//       organizerName: e.organizer?.name,
//       organizerEmail: e.organizer?.email
//     }));

//     res.json(formatted);
//   } catch {
//     res.status(500).json({ error: 'Could not fetch events' });
//   }
// };

// exports.getMyEvents = async (req, res) => {
//   try {
//     const events = await Event.find({ organizer: req.user.id });
//     res.json(events);
//   } catch {
//     res.status(500).json({ error: 'Could not fetch your events' });
//   }
// };

// exports.registerForEvent = async (req, res) => {
//   try {
//     const e = await Event.findById(req.params.id);
//     if (!e || e.status !== 'active') return res.status(400).json({ error: 'Event not available' });

//     if (e.attendees.includes(req.user.id)) {
//       return res.status(400).json({ error: 'Already registered' });
//     }

//     e.attendees = [...e.attendees, req.user.id];  // or use e.attendees.push(req.user.id);
//     await e.save();

//     res.json({ message: 'Registered successfully' });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Registration failed' });
//   }
// };


// exports.deregisterFromEvent = async (req, res) => {
//   try {
//     const e = await Event.findById(req.params.id);
//     if (!e || !e.attendees.includes(req.user.id)) return res.status(400).json({ error: 'Not registered' });

//     e.attendees.pull(req.user.id);
//     await e.save();
//     res.json({ message: 'Deregistered successfully' });
//   } catch {
//     res.status(500).json({ error: 'Deregistration failed' });
//   }
// };

// exports.cancelEvent = async (req, res) => {
//   try {
//     const e = await Event.findById(req.params.id);
//     if (!e) return res.status(404).json({ error: 'Event not found' });
//     if (e.organizer.toString() !== req.user.id) return res.status(403).json({ error: 'Not your event' });

//     e.status = 'cancelled';
//     await e.save();
//     res.json({ message: 'Event cancelled' });
//   } catch {
//     res.status(500).json({ error: 'Cancellation failed' });
//   }
// };
const Event = require('../models/Event');

exports.createEvent = async (req, res) => {
  const { title, description, date } = req.body;
  try {
    const newEvent = await Event.create({
      title,
      description,
      date,
      status: 'active',
      organizer: req.user.id
    });
    res.status(201).json({ event: newEvent });
  } catch (err) {
    console.error('Create event error:', err);
    res.status(500).json({ error: 'Could not create event' });
  }
};

exports.getAllEvents = async (req, res) => {
  try {
    // Step 1: Get all events (unpopulated)
    const rawEvents = await Event.find();
    const now = new Date();

    for (let e of rawEvents) {
      if (e.status === 'active' && new Date(e.date) < now) {
        e.status = 'past';
        await e.save();
      }
    }

    // ✅ Step 2: Fetch again with population
    const events = await Event.find()
      .populate('organizer', 'name email')
      .populate('attendees', 'name email');

    const formatted = events.map(e => ({
      _id: e._id,
      title: e.title,
      description: e.description,
      date: e.date,
      status: e.status,
      attendees: Array.isArray(e.attendees)
        ? e.attendees.map(u => ({ _id: u._id, name: u.name, email: u.email }))
        : [],
      attendeesCount: e.attendees?.length || 0,
      organizerName: e.organizer?.name,
      organizerEmail: e.organizer?.email
    }));
    console.log(formatted)
    res.json(formatted);
  } catch (err) {
    console.error('Get all events error:', err);
    res.status(500).json({ error: 'Could not fetch events' });
  }
};

exports.getMyEvents = async (req, res) => {
  try {
    const events = await Event.find({ organizer: req.user.id });
    res.json(events);
  } catch (err) {
    console.error('Get my events error:', err);
    res.status(500).json({ error: 'Could not fetch your events' });
  }
};

exports.registerForEvent = async (req, res) => {
  try {
    const e = await Event.findById(req.params.id);
    if (!e || e.status !== 'active') return res.status(400).json({ error: 'Event not available' });

    if (e.attendees.includes(req.user.id)) {
      return res.status(400).json({ error: 'Already registered' });
    }

    e.attendees.push(req.user.id);
    await e.save();

    res.json({ message: 'Registered successfully' });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
};

exports.deregisterFromEvent = async (req, res) => {
  try {
    const e = await Event.findById(req.params.id);
    if (!e || !e.attendees.includes(req.user.id)) return res.status(400).json({ error: 'Not registered' });

    e.attendees.pull(req.user.id);
    await e.save();
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
    if (e.organizer.toString() !== req.user.id) return res.status(403).json({ error: 'Not your event' });

    e.status = 'cancelled';
    await e.save();
    res.json({ message: 'Event cancelled' });
  } catch (err) {
    console.error('Cancel event error:', err);
    res.status(500).json({ error: 'Cancellation failed' });
  }
};
