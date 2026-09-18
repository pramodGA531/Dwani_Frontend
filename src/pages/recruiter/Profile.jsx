import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export default function Profile() {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Profile Information State
  const [profile, setProfile] = useState({
    fullName: '',
    email: localStorage.getItem('email') || '',
    role: '',
    company: '',
    department: '',
    phone: '',
    location: '',
  });

  // Dynamic initials avatar
  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  // Preferences State
  const [preferences, setPreferences] = useState({
    defaultDuration: '45 mins',
    defaultDifficulty: 'Medium',
    emailNotifications: true,
    interviewReminders: true,
    candidateAlerts: false,
  });

  // Change Password Modal States
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    localStorage.removeItem('role');
    navigate('/');
  };

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('access');
        const res = await fetch(`${API_BASE}/auth/me/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.email) localStorage.setItem('email', data.email);
          setProfile({
            fullName:   data.full_name    || '',
            email:      data.email        || localStorage.getItem('email') || '',
            role:       data.title        || '',
            company:    data.company_name || '',
            department: data.department   || '',
            phone:      data.phone ? String(data.phone) : '',
            location:   data.location     || '',
          });
        }
      } catch (err) {
        console.error('Failed to load user profile', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);


  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handlePrefChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPreferences(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = async () => {
    // --- Optimistic update: apply values to UI immediately ---
    const optimisticProfile = { ...profile };
    setProfile(optimisticProfile);
    setIsEditing(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);

    setIsSaving(true);
    try {
      const token = localStorage.getItem('access');
      const res = await fetch(`${API_BASE}/auth/me/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          full_name:    profile.fullName,
          title:        profile.role,
          company_name: profile.company,
          department:   profile.department,
          phone:        profile.phone ? parseInt(profile.phone, 10) : null,
          location:     profile.location,
        })
      });
      if (res.ok) {
        // Reconcile with the authoritative server response
        const data = await res.json();
        setProfile(prev => ({
          ...prev,
          fullName:   data.full_name    || '',
          role:       data.title        || '',
          company:    data.company_name || '',
          department: data.department   || '',
          phone:      data.phone ? String(data.phone) : '',
          location:   data.location     || '',
        }));
      } else {
        // Revert to server state if save failed
        console.error('Profile save failed:', res.status);
      }
    } catch (err) {
      console.error('Failed to update profile', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChangeSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (passwordForm.new !== passwordForm.confirm) {
      setPasswordError("New passwords do not match");
      return;
    }
    if (passwordForm.new.length < 8) {
      setPasswordError("New password must be at least 8 characters");
      return;
    }

    setIsChangingPassword(true);
    try {
      const token = localStorage.getItem('access');
      const res = await fetch(`${API_BASE}/auth/change-password/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          current_password: passwordForm.current,
          new_password: passwordForm.new
        })
      });

      const data = await res.json();
      if (res.ok) {
        setPasswordSuccess(true);
        setPasswordForm({ current: '', new: '', confirm: '' });
        setTimeout(() => {
          setShowChangePasswordModal(false);
          setPasswordSuccess(false);
        }, 2000);
      } else {
        setPasswordError(data.error || "Failed to change password");
      }
    } catch (err) {
      console.error("Password change failed:", err);
      setPasswordError("A network error occurred. Please try again.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-pulse">
        {/* Page Title */}
        <div>
          <div className="h-8 bg-gray-200 rounded-lg w-48"></div>
          <div className="h-4 bg-gray-200 rounded-lg w-80 mt-2"></div>
        </div>

        {/* 1. TOP PROFILE SUMMARY CARD */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 md:p-6 flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="h-24 w-24 bg-gray-200 rounded-2xl shrink-0"></div>
          <div className="flex-1 space-y-3 w-full pt-2">
            <div className="h-6 bg-gray-200 rounded-lg w-2/3 md:w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded-lg w-1/2 md:w-1/4"></div>
            <div className="flex gap-4 pt-2">
              <div className="h-4 bg-gray-200 rounded-lg w-24"></div>
              <div className="h-4 bg-gray-200 rounded-lg w-24"></div>
            </div>
          </div>
        </div>

        {/* 2. PERSONAL INFORMATION */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 h-14 bg-gray-50 flex items-center">
            <div className="h-4 bg-gray-200 rounded-lg w-36"></div>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 bg-gray-200 rounded-lg w-20"></div>
                <div className="h-10 bg-gray-100/80 rounded-lg w-full"></div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. RECRUITER PREFERENCES */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 h-14 bg-gray-50 flex items-center">
            <div className="h-4 bg-gray-200 rounded-lg w-40"></div>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded-lg w-28"></div>
                  <div className="h-10 bg-gray-100/80 rounded-lg w-full"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* BOTTOM: Change Password & Logout skeletons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1 h-[74px] bg-white rounded-2xl border border-gray-200"></div>
          <div className="w-full sm:w-32 h-[74px] bg-white rounded-2xl border border-gray-200"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 relative animate-in fade-in duration-300">
      {/* Success Notification */}
      {showSuccess && (
        <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-top-4 duration-300">
          <div className="bg-gray-900 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3">
            <span className="material-symbols-outlined text-emerald-400">check_circle</span>
            <span className="font-semibold text-sm">Settings saved successfully</span>
          </div>
        </div>
      )}

      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your professional recruiter identity and preferences.</p>
      </div>

      {/* 1. TOP PROFILE SUMMARY CARD */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 md:p-6 flex flex-col md:flex-row items-center md:items-start gap-6">
        <div className="relative group shrink-0">
          <div className="h-24 w-24 rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
            <span className="text-white text-2xl font-bold select-none">{getInitials(profile.fullName)}</span>
          </div>
        </div>

        <div className="flex-1 text-center md:text-left space-y-1.5">
          <h2 className="text-xl font-bold text-gray-900 leading-tight">
            {profile.fullName || 'New Recruiter (Please fill details)'}
          </h2>
          <p className="text-sm font-medium text-gray-600">
            {profile.role || 'Role not set'} at {profile.company || 'Company not set'}
          </p>
          <div className="flex flex-wrap justify-center md:justify-start items-center gap-x-4 gap-y-2 pt-2 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-gray-400">mail</span>
              {profile.email || 'Email not set'}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-gray-400">location_on</span>
              {profile.location || 'Location not set'}
            </div>
          </div>
        </div>

        <div className="w-full md:w-auto shrink-0 mt-4 md:mt-0">
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">
              {isEditing ? 'close' : 'edit'}
            </span>
            {isEditing ? 'Cancel Edit' : 'Edit Profile'}
          </button>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div className="space-y-6">
          
          {/* 2. PERSONAL INFORMATION */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-4 md:px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <span className="material-symbols-outlined text-gray-400">person</span>
              <h3 className="text-sm font-bold text-gray-900">Personal Information</h3>
            </div>
            <div className="p-4 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500">Full Name</label>
                  <input 
                    type="text" 
                    name="fullName"
                    value={profile.fullName}
                    onChange={handleProfileChange}
                    disabled={!isEditing}
                    placeholder="ex: Alex Thompson"
                    className={`w-full px-3 py-2 border rounded-lg text-sm transition-all focus:outline-none ${isEditing ? 'bg-white border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500' : 'bg-gray-50 text-gray-600 border-gray-200'}`}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500">Email Address (Registered)</label>
                  <input 
                    type="email" 
                    name="email"
                    value={profile.email}
                    disabled={true}
                    placeholder="ex: alex.thompson@company.com"
                    className="w-full px-3 py-2 border rounded-lg text-sm transition-all focus:outline-none bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed"
                    title="Registered email address cannot be changed."
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500">Phone Number</label>
                  <input 
                    type="text" 
                    name="phone"
                    value={profile.phone}
                    onChange={handleProfileChange}
                    disabled={!isEditing}
                    placeholder="ex: 9876543210"
                    className={`w-full px-3 py-2 border rounded-lg text-sm transition-all focus:outline-none ${isEditing ? 'bg-white border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500' : 'bg-gray-50 text-gray-600 border-gray-200'}`}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500">Location</label>
                  <input 
                    type="text" 
                    name="location"
                    value={profile.location}
                    onChange={handleProfileChange}
                    disabled={!isEditing}
                    placeholder="ex: San Francisco, CA"
                    className={`w-full px-3 py-2 border rounded-lg text-sm transition-all focus:outline-none ${isEditing ? 'bg-white border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500' : 'bg-gray-50 text-gray-600 border-gray-200'}`}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500">Company Name</label>
                  <input 
                    type="text" 
                    name="company"
                    value={profile.company}
                    onChange={handleProfileChange}
                    disabled={!isEditing}
                    placeholder="ex: TechFlow Inc."
                    className={`w-full px-3 py-2 border rounded-lg text-sm transition-all focus:outline-none ${isEditing ? 'bg-white border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500' : 'bg-gray-50 text-gray-600 border-gray-200'}`}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500">Job Title</label>
                  <input 
                    type="text" 
                    name="role"
                    value={profile.role}
                    onChange={handleProfileChange}
                    disabled={!isEditing}
                    placeholder="ex: Senior Technical Recruiter"
                    className={`w-full px-3 py-2 border rounded-lg text-sm transition-all focus:outline-none ${isEditing ? 'bg-white border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500' : 'bg-gray-50 text-gray-600 border-gray-200'}`}
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-gray-500">Department</label>
                  <input 
                    type="text" 
                    name="department"
                    value={profile.department}
                    onChange={handleProfileChange}
                    disabled={!isEditing}
                    placeholder="ex: Human Resources"
                    className={`w-full px-3 py-2 border rounded-lg text-sm transition-all focus:outline-none ${isEditing ? 'bg-white border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500' : 'bg-gray-50 text-gray-600 border-gray-200'}`}
                  />
                </div>
              </div>

              {isEditing && (
                <div className="mt-8 flex justify-end">
                  <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors flex items-center gap-2 disabled:opacity-70"
                  >
                    {isSaving ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : 'Save Profile'}
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* 3. RECRUITER PREFERENCES */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-4 md:px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <span className="material-symbols-outlined text-gray-400">tune</span>
              <h3 className="text-sm font-bold text-gray-900">Recruiter Preferences</h3>
            </div>
            <div className="p-4 md:p-6 space-y-6">
              
              {/* Dropdowns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500">Default Interview Duration</label>
                  <select 
                    name="defaultDuration"
                    value={preferences.defaultDuration}
                    onChange={handlePrefChange}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  >
                    <option>15 mins</option>
                    <option>30 mins</option>
                    <option>45 mins</option>
                    <option>60 mins</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500">Default Difficulty</label>
                  <select 
                    name="defaultDifficulty"
                    value={preferences.defaultDifficulty}
                    onChange={handlePrefChange}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  >
                    <option>Entry Level</option>
                    <option>Medium</option>
                    <option>Senior/Expert</option>
                  </select>
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Toggles */}
              <div className="space-y-4">
                {/* Email Notifications */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">Email Notifications</h4>
                    <p className="text-xs text-gray-500">Receive daily summaries of candidate activities.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" name="emailNotifications" checked={preferences.emailNotifications} onChange={handlePrefChange} className="sr-only peer" />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
                
                {/* Interview Reminders */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">Interview Reminders</h4>
                    <p className="text-xs text-gray-500">Get notified 15 minutes before an interview starts.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" name="interviewReminders" checked={preferences.interviewReminders} onChange={handlePrefChange} className="sr-only peer" />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {/* Candidate Alerts */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">Candidate Status Alerts</h4>
                    <p className="text-xs text-gray-500">Instant alerts when a candidate completes an interview.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" name="candidateAlerts" checked={preferences.candidateAlerts} onChange={handlePrefChange} className="sr-only peer" />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>

            </div>
          </section>

          {/* BOTTOM: Change Password & Logout */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <button 
              type="button"
              onClick={() => setShowChangePasswordModal(true)}
              className="flex-1 flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-gray-200 hover:border-indigo-500/50 hover:shadow-sm transition-all duration-200 text-left group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                  <span className="material-symbols-outlined text-[20px]">lock</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Change Password</p>
                  <p className="text-xs text-gray-500 mt-0.5">Update your password to keep your account secure</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all">chevron_right</span>
            </button>

            <button 
              type="button"
              onClick={handleLogout}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all duration-200 text-sm font-semibold shadow-sm sm:h-[74px] shrink-0 cursor-pointer animate-in fade-in"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              <span>Log Out</span>
            </button>
          </div>

        </div>
      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div>
                <h3 className="text-base font-bold text-gray-900">Change Password</h3>
                <p className="text-xs text-gray-500 mt-0.5">Update your password to keep your account secure</p>
              </div>
              <button 
                onClick={() => {
                  setShowChangePasswordModal(false);
                  setPasswordForm({ current: '', new: '', confirm: '' });
                  setPasswordError('');
                  setPasswordSuccess(false);
                }}
                className="w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handlePasswordChangeSubmit} className="p-6 space-y-4 bg-white">
              {passwordError && (
                <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs font-semibold animate-shake">
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="p-3 bg-green-50 text-green-600 border border-green-100 rounded-xl text-xs font-semibold">
                  Password changed successfully!
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Current Password</label>
                <input 
                  type="password"
                  required
                  value={passwordForm.current}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, current: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  placeholder="Enter current password"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">New Password</label>
                <input 
                  type="password"
                  required
                  value={passwordForm.new}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, new: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  placeholder="At least 8 characters"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Confirm New Password</label>
                <input 
                  type="password"
                  required
                  value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  placeholder="Re-enter new password"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => {
                    setShowChangePasswordModal(false);
                    setPasswordForm({ current: '', new: '', confirm: '' });
                    setPasswordError('');
                    setPasswordSuccess(false);
                  }}
                  className="px-4 py-2 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isChangingPassword}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isChangingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
