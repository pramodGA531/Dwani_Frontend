import React, { useState } from 'react';

export default function Settings() {
  const [notifications, setNotifications] = useState({
    email: true,
    alerts: true,
    updates: false
  });

  const toggleNotification = (key) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Control your account behavior and system preferences.</p>
      </div>

      {/* Account Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-medium text-gray-900">Account</h2>
        </div>
        <div className="p-6 space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Current Password</label>
            <input 
              type="password" 
              placeholder="••••••••"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">New Password</label>
            <input 
              type="password" 
              placeholder="••••••••"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Confirm Password</label>
            <input 
              type="password" 
              placeholder="••••••••"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
            />
          </div>
          <div className="pt-2">
            <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
              Update Password
            </button>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-medium text-gray-900">Notifications</h2>
        </div>
        <div className="p-6 space-y-4">
          {[
            { id: 'email', label: 'Email Notifications', desc: 'Receive daily digests and system updates via email.' },
            { id: 'alerts', label: 'Interview Alerts', desc: 'Get notified when candidates complete their AI interviews.' },
            { id: 'updates', label: 'Candidate Updates', desc: 'Receive notifications for new candidate applications.' }
          ].map((item) => (
            <div key={item.id} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{item.label}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
              <button 
                onClick={() => toggleNotification(item.id)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${notifications[item.id] ? 'bg-blue-600' : 'bg-gray-200'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifications[item.id] ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Preference Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-medium text-gray-900">Preferences</h2>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Theme</label>
              <div className="flex items-center gap-4 mt-2">
                <button className="flex items-center gap-2 px-4 py-2 border border-blue-600 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium transition-all">
                  <span className="material-symbols-outlined text-[18px]">light_mode</span>
                  Light
                </button>
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-all">
                  <span className="material-symbols-outlined text-[18px]">dark_mode</span>
                  Dark
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Timezone</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-white">
                <option>UTC (GMT+0:00)</option>
                <option>Eastern Time (GMT-5:00)</option>
                <option>Pacific Time (GMT-8:00)</option>
                <option>India Standard Time (GMT+5:30)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Language</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-white">
                <option>English (US)</option>
                <option>English (UK)</option>
                <option>Spanish</option>
                <option>French</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
