
import React from 'react';

const GoogleLoginButton = () => {
  const handleLogin = () => {
    window.location.href = 'http://localhost:5000/auth/google';
  };

  return <button onClick={handleLogin}>Sign in with Google</button>;
};

export default GoogleLoginButton;
