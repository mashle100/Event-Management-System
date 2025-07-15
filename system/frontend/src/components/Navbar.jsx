
// import React from 'react';
// import { Link } from 'react-router-dom';
// import { logout } from '../utils';

// const Navbar = ({ user }) => {
//   const links = [<Link key="events" to="/events">Events</Link>];

//   if (user) {
//     links.push(<Link key="registered" to="/registered-events">My Registered Events</Link>);

//     links.push(<Link key="profile" to="/profile">Profile</Link>);
//     if (user.role === 'attendee') {
//       links.push(<Link key="request" to="/request-organizer">Request Organizer</Link>);
//     }
//     if (user.role === 'organizer') {
//       links.push(<Link key="create" to="/create-event">Create Event</Link>);
//       links.push(<Link key="manage" to="/manage-events">Manage Events</Link>);
//     }
//     if (user.role === 'admin') {
//       links.push(<Link key="admin" to="/admin">Admin Dashboard</Link>);
//       links.push(<Link key="admin-events" to="/admin-events">Event Status</Link>);
//     }
//   }

//   return (
//     <nav style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>
//       {links.map((link, i) => (
//         <span key={i}>{i > 0 && ' | '}{link}</span>
//       ))}
//       {user && (
//         <>
//           {' | '}
//           <button onClick={logout} style={{ marginLeft: '10px' }}>Logout</button>
//         </>
//       )}
//     </nav>
//   );
// };

// export default Navbar;
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { logout } from '../utils';

const Navbar = ({ user }) => {
  const [theme, setTheme] = useState(() => {
    // Check localStorage first, then default to 'light'
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'light';
  });
  
  useEffect(() => {
    // Apply the theme to both document root and body for maximum compatibility
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  const links = [<Link key="events" to="/events">Events</Link>];

  if (user) {
    links.push(<Link key="registered" to="/registered-events">My Events</Link>);
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
    }
  }

  return (
    <nav className={`navbar ${theme}`}>
      <div className="container">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Link to="/" className="brand-logo">
            EventHub
          </Link>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {links}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={toggleTheme} 
            className="btn btn-icon theme-toggle"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              <span className="theme-icon">🌞</span>
            ) : (
              <span className="theme-icon">🌙</span>
            )}
          </button>
          
          {user ? (
            <>
              <span className="welcome-text">
                Welcome, {user.name}
              </span>
              <button onClick={logout} className="btn btn-secondary" style={{ padding: '8px 16px' }}>
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="btn btn-primary" style={{ padding: '8px 16px' }}>
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};


export default Navbar;
