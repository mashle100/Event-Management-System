// import React, { useEffect, useState } from 'react';
// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import { getToken, parseJwt } from './utils';
// import Navbar from './components/Navbar';
// import OAuthSuccess from './components/OAuthSuccess';
// import Home from './pages/Home';
// import Profile from './pages/Profile';
// import RequestOrganizer from './pages/RequestOrganizer';
// import AdminDashboard from './pages/AdminDashboard';
// import CreateEvent from './pages/CreateEvent';
// import ManageEvents from './pages/ManageEvents';
// import EventsPage from './pages/EventsPage';
// import RegisteredEventsPage from './pages/RegisteredEventsPage';
// import QRScanner from './pages/QRScanner';

// const App = () => {
//   const [loggedIn, setLoggedIn] = useState(!!getToken());
//   const [user, setUser] = useState(null);

//   useEffect(() => {
//     const token = getToken();
//     setUser(token ? parseJwt(token) : null);
//   }, [loggedIn]);

//   return (
//     <Router>
//       <Navbar user={user} />
//       <Routes>
//         <Route path="/" element={loggedIn ? <Navigate to="/events" /> : <Home />} />

//         <Route path="/auth/success" element={
//           <OAuthSuccess onLogin={() => setLoggedIn(true)} />
//         }/>

//         <Route path="/profile" element={
//           loggedIn ? <Profile /> : <Navigate to="/" />
//         }/>

//         <Route path="/events" element={
//           loggedIn ? <EventsPage /> : <Navigate to="/" />
//         }/>

//         <Route path="/registered-events" element={
//           loggedIn ? <RegisteredEventsPage /> : <Navigate to="/" />
//         }/>

//         <Route path="/request-organizer" element={
//           loggedIn && user?.role === 'attendee'
//             ? <RequestOrganizer />
//             : <Navigate to="/events" />
//         }/>

//         <Route path="/create-event" element={
//           loggedIn && user?.role === 'organizer'
//             ? <CreateEvent />
//             : <Navigate to="/events" />
//         }/>

//         <Route path="/manage-events" element={
//           loggedIn && user?.role === 'organizer'
//             ? <ManageEvents />
//             : <Navigate to="/events" />
//         }/>

//         <Route path="/scan-attendees/:eventId/:organizerId" element={
//           loggedIn && user?.role === 'organizer'
//             ? <QRScanner />
//             : <Navigate to="/events" />
//         }/>

//         <Route path="/admin" element={
//           loggedIn && user?.role === 'admin'
//             ? <AdminDashboard />
//             : <Navigate to="/events" />
//         }/>

//         <Route path="/admin-events" element={
//           loggedIn && user?.role === 'admin'
//             ? <AdminDashboard />
//             : <Navigate to="/events" />
//         }/>

//         <Route path="*" element={<div>404 Not Found</div>} />
//       </Routes>
//     </Router>
//   );
// };

// export default App;
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { getToken, parseJwt } from './utils';
import Navbar from './components/Navbar';
import OAuthSuccess from './components/OAuthSuccess';
import Home from './pages/Home';
import Profile from './pages/Profile';
import RequestOrganizer from './pages/RequestOrganizer';
import AdminDashboard from './pages/AdminDashboard';
import CreateEvent from './pages/CreateEvent';
import EditEvent from './pages/EditEvent';
import ManageEvents from './pages/ManageEvents';
import EventsPage from './pages/EventsPage';
import RegisteredEventsPage from './pages/RegisteredEventsPage';
import QRScanner from './pages/QRScanner';
import './App.css';

const App = () => {
  const [loggedIn, setLoggedIn] = useState(!!getToken());
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    setUser(token ? parseJwt(token) : null);
    setLoading(false);
  }, [loggedIn]);

  // Initialize theme on app load
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.body.setAttribute('data-theme', savedTheme);
  }, []);

  return (
    <Router>
      <Navbar user={user} />
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/auth/success" element={
          <OAuthSuccess onLogin={() => setLoggedIn(true)} />
        }/>

        <Route path="/login" element={<Home />} />

        <Route path="/profile" element={
          loading ? <div>Loading...</div> : (
            loggedIn ? <Profile /> : <Navigate to="/login" />
          )
        }/>

        <Route path="/events" element={<EventsPage user={user} />} />

        <Route path="/registered-events" element={
          loading ? <div>Loading...</div> : (
            loggedIn ? <RegisteredEventsPage /> : <Navigate to="/login" />
          )
        }/>

        <Route path="/request-organizer" element={
          loading ? <div>Loading...</div> : (
            loggedIn && user?.role === 'attendee'
              ? <RequestOrganizer />
              : <Navigate to="/events" />
          )
        }/>

        <Route path="/create-event" element={
          loading ? <div>Loading...</div> : (
            loggedIn && user?.role === 'organizer'
              ? <CreateEvent />
              : <Navigate to="/events" />
          )
        }/>

        <Route path="/edit-event/:id" element={
          loading ? <div>Loading...</div> : (
            loggedIn && user?.role === 'organizer'
              ? <EditEvent />
              : <Navigate to="/events" />
          )
        }/>

        <Route path="/manage-events" element={
          loading ? <div>Loading...</div> : (
            loggedIn && user?.role === 'organizer'
              ? <ManageEvents />
              : <Navigate to="/events" />
          )
        }/>

        <Route path="/scan-attendees/:eventId/:organizerId" element={
          loading ? <div>Loading...</div> : (
            loggedIn && user?.role === 'organizer'
              ? <QRScanner />
              : <Navigate to="/events" />
          )
        }/>

        <Route path="/admin" element={
          loading ? <div>Loading...</div> : (
            loggedIn && user?.role === 'admin'
              ? <AdminDashboard />
              : <Navigate to="/events" />
          )
        }/>

        <Route path="/admin-events" element={
          loading ? <div>Loading...</div> : (
            loggedIn && user?.role === 'admin'
              ? <AdminDashboard />
              : <Navigate to="/events" />
          )
        }/>

        <Route path="*" element={<div>404 Not Found</div>} />
      </Routes>
    </Router>
  );
};

export default App;
