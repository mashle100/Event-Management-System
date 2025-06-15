
import React, { useState } from 'react';
import API from '../api/axios';

const CreateEvent = () => {
  const [event, setEvent] = useState({ title: '', description: '', date: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setEvent({ ...event, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/event', event);
      alert('Event created!');
      setEvent({ title: '', description: '', date: '' });
    } catch (err) {
      alert(err.response?.data?.error || 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Create Event</h2>
      <form onSubmit={handleSubmit}>
        <input name="title" placeholder="Title" value={event.title} onChange={handleChange} required />
        <textarea name="description" placeholder="Description" value={event.description} onChange={handleChange} required />
        <input type="date" name="date" value={event.date} onChange={handleChange} required />
        <button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create'}</button>
      </form>
    </div>
  );
};

export default CreateEvent;
