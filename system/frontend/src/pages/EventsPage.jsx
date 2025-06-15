
import React, { useEffect, useState } from 'react';
import API from '../api/axios';

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [registered, setRegistered] = useState([]);

  useEffect(() => {
    API.get('/event').then(res => setEvents(res.data));
    API.get('/user/registrations').then(res => setRegistered(res.data.map(e => e._id)));
  }, []);

  const handleRegister = async (eventId) => {
    await API.post(`/event/register/${eventId}`);
    const res = await API.get('/user/registrations');
    setRegistered(res.data.map(e => e._id));
  };

  const handleDeregister = async (eventId) => {
    await API.delete(`/event/deregister/${eventId}`);
    const res = await API.get('/user/registrations');
    setRegistered(res.data.map(e => e._id));
  };

  return (
    <div>
      <h2>All Events</h2>
{events.filter(event => event.status === 'active').length === 0 ? (
  <p>No active events found.</p>
) : (
  events
    .filter(event => event.status === 'active')
    .map(event => (
      <div key={event._id} style={{
        border: '1px solid #ccc',
        margin: '10px 0',
        padding: '10px',
        backgroundColor: '#fff'
      }}>
        <h3>{event.title}</h3>
        <p>{event.description}</p>
        <p><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
        <p><strong>Created by:</strong> {event.createdByName || 'Unknown'}</p>
        <p><strong>Status:</strong> {event.status}</p>

        {registered.includes(event._id) ? (
          <button onClick={() => handleDeregister(event._id)}>Deregister</button>
        ) : (
          <button onClick={() => handleRegister(event._id)}>Register</button>
        )}
      </div>
    ))
)}

    </div>
  );
};

export default EventsPage;
