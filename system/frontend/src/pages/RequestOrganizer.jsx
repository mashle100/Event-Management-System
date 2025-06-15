
import React from 'react';
import API from '../api/axios';

const RequestOrganizer = () => {
  const handleRequest = () => {
    API.post('/user/request-organizer')
      .then(res => alert(res.data.message || 'Request sent'))
      .catch(err => alert(err.response?.data?.error || 'Error'));
  };

  return (
    <div>
      <h2>Request Organizer Role</h2>
      <button onClick={handleRequest}>Request Role</button>
    </div>
  );
};

export default RequestOrganizer;
