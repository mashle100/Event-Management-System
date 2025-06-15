
import React from 'react';
import { Link } from 'react-router-dom';
import { logout } from '../utils';

const Navbar = ({ user }) => {
  const links = [<Link key="events" to="/events">Events</Link>];

  if (user) {
    links.push(<Link key="profile" to="/profile">Profile</Link>);
    if (user.role === 'attendee') {
      links.push(<Link key="request" to="/request-organizer">Request Organizer</Link>);
    }
    if (user.role === 'organizer') {
      links.push(<Link key="create" to="/create-event">Create Event</Link>);
      links.push(<Link key="manage" to="/manage-events">Manage Events</Link>);
    }
    if (user.role === 'admin') {
      links.push(<Link key="admin" to="/admin">Admin Dashboard</Link>);
      links.push(<Link key="admin-events" to="/admin-events">Event Status</Link>);
    }
  }

  return (
    <nav style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>
      {links.map((link, i) => (
        <span key={i}>{i > 0 && ' | '}{link}</span>
      ))}
      {user && (
        <>
          {' | '}
          <button onClick={logout} style={{ marginLeft: '10px' }}>Logout</button>
        </>
      )}
    </nav>
  );
};

export default Navbar;
