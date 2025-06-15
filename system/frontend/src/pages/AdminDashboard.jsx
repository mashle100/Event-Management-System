
import React, { useEffect, useState } from 'react';
import API from '../api/axios';

const AdminDashboard = () => {
  const [pending, setPending] = useState([]);
  const [organizers, setOrganizers] = useState([]);
  const [attendees, setAttendees] = useState([]);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetchPending();
    fetchUsers();
    fetchEvents();
  }, []);

  const fetchPending = async () => {
    const res = await API.get('/admin/pending-organizers');
    setPending(res.data);
  };

  const fetchUsers = async () => {
    const res = await API.get('/admin/users');
    const users = res.data;
    setOrganizers(users.filter(u => u.role === 'organizer'));
    setAttendees(users.filter(u => ['attendee', 'organizer', 'admin'].includes(u.role)));
  };

  const fetchEvents = async () => {
    const res = await API.get('/admin/events');
    console.log('Events response:', JSON.stringify(res.data, null, 2));
    setEvents(res.data);
  };

  const approve = async (id) => {
    await API.put(`/admin/approve-organizer/${id}`);
    fetchPending();
    fetchUsers();
  };

  return (
    <div>
      <h2>Admin Dashboard</h2>

      <section>
        <h3>Pending Organizer Requests</h3>
        {pending.length === 0 ? <p>No pending requests.</p> : pending.map(user => (
          <div key={user._id}>
            {user.name} - {user.email}
            <button onClick={() => approve(user._id)}>Approve</button>
          </div>
        ))}
      </section>

      <section>
        <h3>Organizers</h3>
        {organizers.map(user => (
          <div key={user._id}>{user.name} - {user.email}</div>
        ))}
      </section>

      <section>
        <h3>Attendees</h3>
        {attendees.map(user => (
          <div key={user._id}>{user.name} - {user.email}</div>
        ))}
      </section>

<section>
  <h3>All Events</h3>
  {events.length === 0 ? (
    <p>No events available.</p>
  ) : (
    events.map(e => (
      <div
        key={e._id}
        style={{
          border: '1px solid',
          padding: 10,
          margin: 10,
          backgroundColor:
            e.status === 'cancelled'
              ? '#f8d7da'
              : e.status === 'active'
              ? '#d4edda'
              : '#fff',
        }}
      >
        <strong>{e.title}</strong> <span>({e.status})</span>
        <p>{e.description}</p>
        <p>Date: {new Date(e.date).toLocaleDateString()}</p>
        <p>
          Organizer: {e.organizerName} ({e.organizerEmail})
        </p>
<p>
  typeof e.attendees: {typeof e.attendees}<br />
  isArray: {Array.isArray(e.attendees) ? 'Yes' : 'No'}<br />
  Length: {Array.isArray(e.attendees) ? e.attendees.length : 'N/A'}
</p>

<p><strong>Attendees:</strong></p>
{Array.isArray(e.attendees) && e.attendees.length > 0 ? (
  <ul>
    {e.attendees.map((attendee, idx) =>
      attendee && typeof attendee === 'object' ? (
        <li key={attendee._id || idx}>
          {attendee.name} ({attendee.email})
        </li>
      ) : (
        <li key={idx}>Invalid attendee data</li>
      )
    )}
  </ul>
) : (
  <p>No attendees yet.</p>
)}


      </div>
    ))
  )}
</section>


    </div>
  );
};

export default AdminDashboard;
