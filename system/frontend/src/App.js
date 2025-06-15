
// import React, { useEffect, useState } from 'react';
// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import Navbar from './components/Navbar';
// import OAuthSuccess from './components/OAuthSuccess';
// import Home from './pages/Home';
// import Profile from './pages/Profile';
// import RequestOrganizer from './pages/RequestOrganizer';
// import AdminDashboard from './pages/AdminDashboard';
// import CreateEvent from './pages/CreateEvent';
// import EventsPage from './pages/EventsPage';
// import { getToken, parseJwt } from './utils';

// const App = () => {
//   const [loggedIn, setLoggedIn] = useState(!!getToken());
//   const [user, setUser] = useState(null);

//   useEffect(() => {
//     const token = getToken();
//     if (token) {
//       setUser(parseJwt(token));
//     } else {
//       setUser(null);
//     }
//   }, [loggedIn]);

//   return (
//     <Router>
//       <Navbar user={user} />
//       <Routes>
//         <Route path="/" element={loggedIn ? <Navigate to="/events" /> : <Home />} />
//         <Route path="/auth/success" element={<OAuthSuccess onLogin={() => setLoggedIn(true)} />} />
//         <Route path="/profile" element={loggedIn ? <Profile /> : <Navigate to="/" />} />

//         {/* Events page visible to all logged in */}
//         <Route path="/events" element={loggedIn ? <EventsPage /> : <Navigate to="/" />} />

//         {/* Request organizer only for attendees */}
//         <Route
//           path="/request-organizer"
//           element={
//             loggedIn && user?.role === 'attendee' ? (
//               <RequestOrganizer />
//             ) : (
//               <Navigate to="/events" />
//             )
//           }
//         />

//         {/* Create event only for organizers */}
//         <Route
//           path="/create-event"
//           element={
//             loggedIn && user?.role === 'organizer' ? (
//               <CreateEvent />
//             ) : (
//               <Navigate to="/events" />
//             )
//           }
//         />

//         {/* Admin dashboard only for admins */}
//         <Route
//           path="/admin"
//           element={loggedIn && user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/events" />}
//         />
//         <Route
//   path="/admin-events"
//   element={loggedIn && user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/" />}
// />

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
import ManageEvents from './pages/ManageEvents';
import EventsPage from './pages/EventsPage';

const App = () => {
  const [loggedIn, setLoggedIn] = useState(!!getToken());
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = getToken();
    setUser(token ? parseJwt(token) : null);
  }, [loggedIn]);

  return (
    <Router>
      <Navbar user={user} />
      <Routes>
        <Route path="/" element={loggedIn ? <Navigate to="/events" /> : <Home />} />
        <Route path="/auth/success" element={<OAuthSuccess onLogin={() => setLoggedIn(true)} />} />
        <Route path="/profile" element={loggedIn ? <Profile /> : <Navigate to="/" />} />
        <Route path="/events" element={loggedIn ? <EventsPage /> : <Navigate to="/" />} />
        <Route path="/request-organizer" element={loggedIn && user?.role === 'attendee' ? <RequestOrganizer /> : <Navigate to="/events" />} />
        <Route path="/create-event" element={loggedIn && user?.role === 'organizer' ? <CreateEvent /> : <Navigate to="/events" />} />
        <Route path="/manage-events" element={loggedIn && user?.role === 'organizer' ? <ManageEvents /> : <Navigate to="/events" />} />
        <Route path="/admin" element={loggedIn && user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/events" />} />
        <Route path="/admin-events" element={loggedIn && user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/" />} />
        <Route path="*" element={<div>404 Not Found</div>} />
      </Routes>
    </Router>
  );
};

export default App;
