

import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const OAuthSuccess = ({ onLogin }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      localStorage.setItem('token', token);
      onLogin();  // notify App.js of login
      navigate('/events');
    } else {
      navigate('/');
    }
  }, [searchParams, navigate, onLogin]);

  return <div>Logging in...</div>;
};

export default OAuthSuccess;
