
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
      await API.post('/events', payload);
      alert('Event created!');
      setEvent(initialEventState);
    } catch (err) {
      alert(err.response?.data?.error || 'Error creating event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Create New Event</h1>
          <p className="page-subtitle">Fill out the form below to create and publish your event</p>
        </div>
        <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Event Name *</label>
                <input
                  name="title"
                  value={event.title}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  placeholder="Enter event name"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select 
                  name="category" 
                  value={event.category} 
                  onChange={handleChange} 
                  disabled={loading}
                >
                  <option value="Education">Education</option>
                  <option value="Business">Business</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Event Description *</label>
              <textarea
                name="description"
                value={event.description}
                onChange={handleChange}
                required
                disabled={loading}
                placeholder="Describe your event"
                rows="4"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Tags (comma-separated)</label>
              <input
                name="tags"
                value={event.tags}
                onChange={handleChange}
                disabled={loading}
                placeholder="e.g., networking, workshop, conference"
              />
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Start Date *</label>
                <input
                  name="date"
                  type="date"
                  value={event.date}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label">End Date *</label>
                <input
                  name="endDate"
                  type="date"
                  value={event.endDate}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Start Time *</label>
                <input
                  name="startTime"
                  type="time"
                  value={event.startTime}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label">End Time *</label>
                <input
                  name="endTime"
                  type="time"
                  value={event.endTime}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Event Type</label>
              <select name="eventType" value={event.eventType} onChange={handleChange} disabled={loading}>
                <option value="In-person">In-person</option>
                <option value="Online">Online</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>

            {event.eventType !== 'Online' && (
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Venue Name *</label>
                  <input
                    name="venueName"
                    value={event.venueName}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="Enter venue name"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">City *</label>
                  <input
                    name="city"
                    value={event.city}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="Enter city"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Address</label>
                  <input
                    name="address"
                    value={event.address}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="Enter full address"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Map Link</label>
                  <input
                    name="mapLink"
                    value={event.mapLink}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="Google Maps link"
                  />
                </div>
              </div>
            )}

            {event.eventType !== 'In-person' && (
              <div className="form-group">
                <label className="form-label">Online Meeting Link *</label>
                <input
                  name="onlineLink"
                  value={event.onlineLink}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="Zoom, Google Meet, etc."
                />
              </div>
            )}

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Contact Email</label>
                <input
                  name="contactEmail"
                  type="email"
                  value={event.contactEmail}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="contact@event.com"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contact Phone</label>
                <input
                  name="contactPhone"
                  value={event.contactPhone}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Max Attendees</label>
                <input
                  name="maxAttendees"
                  type="number"
                  value={event.maxAttendees}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="Leave empty for unlimited"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Registration Deadline</label>
                <input
                  name="registrationDeadline"
                  type="datetime-local"
                  value={event.registrationDeadline}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label checkbox-label">
                  <input
                    name="requireApproval"
                    type="checkbox"
                    checked={event.requireApproval}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  Require organizer approval
                </label>
              </div>

              <div className="form-group">
                <label className="form-label checkbox-label">
                  <input
                    name="enableWaitlist"
                    type="checkbox"
                    checked={event.enableWaitlist}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  Enable waitlist when full
                </label>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Poster Image URL</label>
              <input
                name="posterImage"
                value={event.posterImage}
                onChange={handleChange}
                disabled={loading}
                placeholder="https://example.com/poster.jpg"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Website</label>
              <input
                name="website"
                value={event.website}
                onChange={handleChange}
                disabled={loading}
                placeholder="https://your-event-website.com"
              />
            </div>

            <div className="form-actions">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-large"
              >
                {loading ? 'Creating Event...' : 'Create Event'}
              </button>
            </div>
          </form>
      </div>
    </div>
  );
};

export default CreateEvent;
