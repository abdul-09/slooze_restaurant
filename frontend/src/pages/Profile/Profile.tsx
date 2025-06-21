import React from 'react';
import { useAuthStore } from '../../stores/authStore';

const Profile: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your account settings
        </p>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Account Information</h3>
            <div className="mt-2 space-y-2">
              <p><span className="font-medium">Name:</span> {user?.first_name} {user?.last_name}</p>
              <p><span className="font-medium">Email:</span> {user?.email}</p>
              <p><span className="font-medium">Role:</span> <span className="capitalize">{user?.role}</span></p>
              <p><span className="font-medium">Region:</span> <span className="capitalize">{user?.region}</span></p>
            </div>
          </div>
          <p className="text-gray-600">Profile management features coming soon...</p>
        </div>
      </div>
    </div>
  );
};

export default Profile; 