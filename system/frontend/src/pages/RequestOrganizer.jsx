
import React from 'react';
import API from '../api/axios';

const RequestOrganizer = () => {
  const handleRequest = () => {
    API.post('/user/request-organizer')
      .then(res => alert(res.data.message || 'Request sent'))
      .catch(err => alert(err.response?.data?.error || 'Error'));
  };

  return (
    <div className="page-container">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Request Organizer Role</h1>
          <p className="page-subtitle">Become an event organizer and start creating events</p>
        </div>
        
        <div className="card" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
          <div className="card-content">
            <h3 style={{ marginBottom: '20px' }}>Organizer Benefits</h3>
            <ul style={{ 
              listStyle: 'none', 
              padding: 0, 
              marginBottom: '30px',
              textAlign: 'left'
            }}>
              <li style={{ padding: '8px 0', borderBottom: '1px solid #333' }}>
                ✨ Create and manage unlimited events
              </li>
              <li style={{ padding: '8px 0', borderBottom: '1px solid #333' }}>
                📊 Access to event analytics and attendee management
              </li>
              <li style={{ padding: '8px 0', borderBottom: '1px solid #333' }}>
                🎯 Customize event settings and approval processes
              </li>
              <li style={{ padding: '8px 0', borderBottom: '1px solid #333' }}>
                📱 QR code scanning for attendee check-ins
              </li>
              <li style={{ padding: '8px 0' }}>
                🌟 Enhanced visibility for your events
              </li>
            </ul>
            
            <button onClick={handleRequest} className="btn btn-primary" style={{ 
              padding: '16px 32px', 
              fontSize: '16px' 
            }}>
              Request Organizer Role
            </button>
            
            <p style={{ marginTop: '20px', fontSize: '0.875rem', color: '#a0a0a0' }}>
              Your request will be reviewed by our admin team and you'll be notified once approved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestOrganizer;
