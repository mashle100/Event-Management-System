
import React, { useEffect, useState } from 'react';
import API from '../api/axios';

const ManageEvents = () => {
  const [myEvents, setMyEvents] = useState([]);

  useEffect(() => {
    API.get('/event/my-events')
      .then(res => setMyEvents(res.data))
      .catch(console.error);
  }, []);

  const cancelEvent = async (id) => {
    await API.put(`/event/cancel/${id}`);
    const updated = await API.get('/event/my-events');
    setMyEvents(updated.data);
  };

  return (
    <div>
      <h2>My Events</h2>
      {myEvents.length === 0 ? <p>You have no events.</p> : myEvents.map(e => (
        <div key={e._id}>
          <strong>{e.title}</strong> - {e.status}
          <p>{e.description}</p>
          <p>Date: {new Date(e.date).toLocaleDateString()}</p>
          {e.status === 'active' && (
            <button onClick={() => cancelEvent(e._id)}>Cancel</button>
          )}
        </div>
      ))}
    </div>
  );
};

export default ManageEvents;
