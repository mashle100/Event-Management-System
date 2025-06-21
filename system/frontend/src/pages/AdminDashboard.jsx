
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
    setEvents(res.data);
  };

  const approve = async (id) => {
    await API.put(`/admin/approve-organizer/${id}`);
    fetchPending();
    fetchUsers();
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Admin Dashboard</h2>

      <section>
        <h3>Pending Organizer Requests</h3>
        {pending.length === 0 ? (
          <p>No pending requests.</p>
        ) : (
          pending.map(user => (
            <div key={user._id}>
              {user.name} - {user.email}
              <button onClick={() => approve(user._id)}>Approve</button>
            </div>
          ))
        )}
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
                border: '1px solid #ccc',
                borderRadius: 6,
                padding: 12,
                margin: '12px 0',
                backgroundColor:
                  e.status === 'cancelled'
                    ? '#f8d7da'
                    : e.status === 'active'
                    ? '#d4edda'
                    : '#fdfd96' // yellow for past
              }}
            >
              <strong>{e.title || 'Untitled Event'}</strong> <span>({e.status || 'unknown'})</span>
              <p>{e.description || 'No description provided.'}</p>
              <p>
                Dates: {new Date(e.date).toLocaleDateString()} to{' '}
                {e.endDate ? new Date(e.endDate).toLocaleDateString() : 'N/A'}
              </p>
              <p>
                Time: {e.startTime || 'N/A'} - {e.endTime || 'N/A'}
              </p>
              <p>Type: {e.eventType}</p>
              <p>Venue: {e.venueName || 'N/A'}, {e.city || ''}</p>
              <p>
                Max Attendees: {e.maxAttendees || 'Unlimited'}<br />
                Registration Deadline: {e.registrationDeadline ? new Date(e.registrationDeadline).toLocaleString() : 'N/A'}
              </p>
              <p>
                Organizer: {e.organizerName} ({e.organizerEmail})
              </p>

              <hr />

              <p><strong>Approved Attendees:</strong></p>
              {e.attendees?.length > 0 ? (
                <ul>
                  {e.attendees.map((attendee, idx) =>
                    attendee && typeof attendee === 'object' ? (
                      <li key={attendee._id || idx}>
                        {attendee.name || 'Unnamed'} ({attendee.email || 'No email'})
                      </li>
                    ) : (
                      <li key={idx}>Invalid attendee</li>
                    )
                  )}
                </ul>
              ) : (
                <p>No attendees.</p>
              )}

              {e.pendingApprovals?.length > 0 && (
                <>
                  <p><strong>Pending Approvals:</strong></p>
                  <ul>
                    {e.pendingApprovals.map((u, i) => (
                      <li key={u._id || i}>{u.name} ({u.email})</li>
                    ))}
                  </ul>
                </>
              )}

              {e.waitlist?.length > 0 && (
                <>
                  <p><strong>Waitlist:</strong></p>
                  <ul>
                    {e.waitlist.map((u, i) => (
                      <li key={u._id || i}>{u.name} ({u.email})</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          ))
        )}
      </section>
    </div>
  );
};

export default AdminDashboard;
