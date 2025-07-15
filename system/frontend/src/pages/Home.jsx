
import React from 'react';
import GoogleLoginButton from '../components/GoogleLoginButton';

const Home = () => (
  <div className="page-container">
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Welcome to EventHub</h1>
        <p className="page-subtitle">
          Discover, create, and manage events with our modern event management platform. 
          Connect with like-minded people and never miss an exciting event again.
        </p>
      </div>
      
      <div className="home-content">
        <div className="card auth-card">
          <h3 className="auth-title">Get Started</h3>
          <p className="auth-subtitle">
            Sign in with Google to start exploring events in your area
          </p>
          <GoogleLoginButton />
        </div>
      </div>
    </div>
  </div>
);

export default Home;
