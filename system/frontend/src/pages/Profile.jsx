
import React, { useEffect, useState } from 'react';
import API from '../api/axios';

const Profile = () => {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    API.get('/user/profile')
      .then(res => setProfile(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div>
      <h2>Your Profile</h2>
      {profile ? <pre>{JSON.stringify(profile, null, 2)}</pre> : <p>Loading...</p>}
    </div>
  );
};

export default Profile;
