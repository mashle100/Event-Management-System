
import React, { useState, useEffect } from 'react';
import API from '../api/axios';

const RequestOrganizer = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  // Fetch user profile to check organizer request status
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await API.get('/user/profile');
        setUser(response.data);
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleRequest = async () => {
    setRequesting(true);
    try {
      const response = await API.post('/user/request-organizer');
      alert(response.data.message || 'Request sent');
      
      // Update user state to reflect the change
      setUser(prevUser => ({
        ...prevUser,
        organizerRequested: true
      }));
    } catch (error) {
      alert(error.response?.data?.error || 'Error sending request');
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="container">
          <div className="page-header">
            <h1 className="page-title">Request Organizer Role</h1>
            <p className="page-subtitle">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

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
            
            {user?.organizerRequested ? (
              <div className="waiting-approval">
                <div className="status-badge status-pending" style={{ 
                  display: 'inline-block',
                  padding: '12px 24px',
                  fontSize: '16px',
                  borderRadius: '8px',
                  marginBottom: '20px'
                }}>
                  ⏳ Waiting for Approval
                </div>
                <p style={{ marginTop: '20px', fontSize: '0.875rem', color: '#a0a0a0' }}>
                  Your organizer request has been submitted and is being reviewed by our admin team. 
                  You'll be notified once your request is approved.
                </p>
              </div>
            ) : (
              <>
                <button 
                  onClick={handleRequest} 
                  disabled={requesting}
                  className="btn btn-primary" 
                  style={{ 
                    padding: '16px 32px', 
                    fontSize: '16px' 
                  }}
                >
                  {requesting ? 'Sending Request...' : 'Request Organizer Role'}
                </button>
                
                <p style={{ marginTop: '20px', fontSize: '0.875rem', color: '#a0a0a0' }}>
                  Your request will be reviewed by our admin team and you'll be notified once approved.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestOrganizer;
