
import React, { useState } from 'react';
import API from '../api/axios';

const initialEventState = {
  title: '',
  description: '',
  category: 'Other',
  tags: '',
  date: '',
  endDate: '',
  startTime: '',
  endTime: '',
  eventType: 'In-person',
  venueName: '',
  address: '',
  city: '',
  mapLink: '',
  onlineLink: '',
  contactEmail: '',
  contactPhone: '',
  website: '',
  maxAttendees: '',
  registrationDeadline: '',
  requireApproval: false,
  enableWaitlist: false,
  posterImage: '',
  logoImage: '',
  promoVideo: '',
};

const CreateEvent = () => {
  const [event, setEvent] = useState(initialEventState);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEvent({
      ...event,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const startDateTime = new Date(`${event.date}T${event.startTime}`);
    const endDateTime = new Date(`${event.endDate}T${event.endTime}`);

    if (startDateTime >= endDateTime) {
      alert('Start date and time must be before end date and time.');
      return;
    }

    if (event.eventType !== 'Online' && !event.venueName.trim()) {
      alert('Venue name is required for In-person or Hybrid events.');
      return;
    }

    if (event.eventType !== 'In-person' && !event.onlineLink.trim()) {
      alert('Online meeting link is required for Online or Hybrid events.');
      return;
    }

    const payload = {
      ...event,
      tags: event.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      maxAttendees: event.maxAttendees ? parseInt(event.maxAttendees) : undefined,
    };

    setLoading(true);
    try {
      await API.post('/event', payload);
      alert('Event created!');
      setEvent(initialEventState);
    } catch (err) {
      alert(err.response?.data?.error || 'Error creating event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Create New Event</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <label>Event Name: *</label>
        <input
          name="title"
          value={event.title}
          onChange={handleChange}
          required
          style={styles.input}
          disabled={loading}
        />

        <label>Event Description: *</label>
        <textarea
          name="description"
          value={event.description}
          onChange={handleChange}
          required
          style={styles.textarea}
          disabled={loading}
        />

        <label>Category: *</label>
        <select
          name="category"
          value={event.category}
          onChange={handleChange}
          required
          style={styles.input}
          disabled={loading}
        >
          {['Tech', 'Sports', 'Cultural', 'Workshop', 'Seminar', 'Other'].map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <label>
          Tags (comma-separated): <i>(Optional)</i>
        </label>
        <input
          name="tags"
          value={event.tags}
          onChange={handleChange}
          style={styles.input}
          disabled={loading}
        />

        <label>Event Date: *</label>
        <input
          type="date"
          name="date"
          value={event.date}
          onChange={handleChange}
          required
          style={styles.input}
          disabled={loading}
        />

        <label>Start Time: *</label>
        <input
          type="time"
          name="startTime"
          value={event.startTime}
          onChange={handleChange}
          required
          style={styles.input}
          disabled={loading}
        />

        <label>Event End Date: *</label>
        <input
          type="date"
          name="endDate"
          value={event.endDate}
          onChange={handleChange}
          required
          style={styles.input}
          disabled={loading}
        />

        <label>End Time: *</label>
        <input
          type="time"
          name="endTime"
          value={event.endTime}
          onChange={handleChange}
          required
          style={styles.input}
          disabled={loading}
        />

        <label>Event Type: *</label>
        <select
          name="eventType"
          value={event.eventType}
          onChange={handleChange}
          required
          style={styles.input}
          disabled={loading}
        >
          {['Online', 'In-person', 'Hybrid'].map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        <label>
          Venue Name: <i>(Required for In-person/Hybrid)</i>
        </label>
        <input
          name="venueName"
          value={event.venueName}
          onChange={handleChange}
          style={styles.input}
          disabled={loading}
        />

        <label>
          Address: <i>(Optional)</i>
        </label>
        <input
          name="address"
          value={event.address}
          onChange={handleChange}
          style={styles.input}
          disabled={loading}
        />

        <label>
          City: <i>(Optional)</i>
        </label>
        <input
          name="city"
          value={event.city}
          onChange={handleChange}
          style={styles.input}
          disabled={loading}
        />

        <label>
          Google Map Link: <i>(Optional)</i>
        </label>
        <input
          name="mapLink"
          value={event.mapLink}
          onChange={handleChange}
          style={styles.input}
          disabled={loading}
        />

        <label>
          Online Meeting Link: <i>(Required for Online/Hybrid)</i>
        </label>
        <input
          name="onlineLink"
          value={event.onlineLink}
          onChange={handleChange}
          style={styles.input}
          disabled={loading}
        />

        <label>Contact Email: *</label>
        <input
          name="contactEmail"
          value={event.contactEmail}
          onChange={handleChange}
          required
          style={styles.input}
          disabled={loading}
        />

        <label>
          Contact Phone: <i>(Optional)</i>
        </label>
        <input
          name="contactPhone"
          value={event.contactPhone}
          onChange={handleChange}
          style={styles.input}
          disabled={loading}
        />

        <label>
          Website / Social Link: <i>(Optional)</i>
        </label>
        <input
          name="website"
          value={event.website}
          onChange={handleChange}
          style={styles.input}
          disabled={loading}
        />

        <label>
          Maximum Attendees: <i>(Optional)</i>
        </label>
        <input
          type="number"
          name="maxAttendees"
          value={event.maxAttendees}
          onChange={handleChange}
          style={styles.input}
          disabled={loading}
          min={1}
        />

        <label>Registration Deadline: *</label>
        <input
          type="date"
          name="registrationDeadline"
          value={event.registrationDeadline}
          onChange={handleChange}
          required
          style={styles.input}
          disabled={loading}
        />

        <label>
          <input
            type="checkbox"
            name="requireApproval"
            checked={event.requireApproval}
            onChange={handleChange}
            disabled={loading}
          />
          Require Approval Before Registration <i>(Optional)</i>
        </label>

        <label>
          <input
            type="checkbox"
            name="enableWaitlist"
            checked={event.enableWaitlist}
            onChange={handleChange}
            disabled={loading}
          />
          Enable Waitlist <i>(Optional)</i>
        </label>

        <label>
          Poster Image URL: <i>(Optional)</i>
        </label>
        <input
          name="posterImage"
          value={event.posterImage}
          onChange={handleChange}
          style={styles.input}
          disabled={loading}
        />

        <label>
          Logo Image URL: <i>(Optional)</i>
        </label>
        <input
          name="logoImage"
          value={event.logoImage}
          onChange={handleChange}
          style={styles.input}
          disabled={loading}
        />

        <label>
          Promo Video URL: <i>(Optional)</i>
        </label>
        <input
          name="promoVideo"
          value={event.promoVideo}
          onChange={handleChange}
          style={styles.input}
          disabled={loading}
        />

        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? 'Creating...' : 'Create Event'}
        </button>
      </form>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: 700,
    margin: '0 auto',
    padding: '20px 30px',
    background: '#fff',
    borderRadius: 10,
    boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
  },
  header: {
    textAlign: 'center',
    color: '#333',
    marginBottom: 20,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  input: {
    padding: '10px 14px',
    fontSize: '16px',
    borderRadius: 6,
    border: '1px solid #ccc',
  },
  textarea: {
    minHeight: 90,
    padding: '10px 14px',
    fontSize: '16px',
    borderRadius: 6,
    border: '1px solid #ccc',
  },
  button: {
    marginTop: 20,
    padding: '12px 18px',
    backgroundColor: '#28a745',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '16px',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
  },
};

export default CreateEvent;
