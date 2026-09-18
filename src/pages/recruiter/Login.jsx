import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'}/auth`;

export default function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ email: '', password: '', confirm: '' });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE}/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: loginForm.email.trim().toLowerCase(), 
          password: loginForm.password 
        }),
      });
      const data = await res.json();
      if (res.ok) {
        const userRole = data.role || (data.user && data.user.role);
        if (userRole === 'candidate') {
          setMessage({ type: 'error', text: 'Access denied. Candidates cannot access the recruiter portal.' });
          return;
        }
        localStorage.setItem('access', data.access);
        localStorage.setItem('refresh', data.refresh);
        localStorage.setItem('role', userRole);
        if (data.user && data.user.email) {
          localStorage.setItem('email', data.user.email);
        }
        navigate('/dashboard');
      } else {
        setMessage({ type: 'error', text: data.detail || 'Invalid credentials.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Server connection error.' });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (registerForm.password !== registerForm.confirm) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE}/register/recruiter/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: registerForm.email.trim().toLowerCase(), 
          password: registerForm.password 
        }),
      });
      const data = await res.json();
      if (res.ok || res.status === 201) {
        setMessage({ type: 'success', text: 'Access request submitted successfully!' });
      } else {
        // Handle validation errors from Django/DRF
        let errorMsg = 'Registration failed.';
        if (data) {
          if (typeof data === 'object') {
            // Extract the first error message from the object
            const firstKey = Object.keys(data)[0];
            const firstError = data[firstKey];
            errorMsg = Array.isArray(firstError) ? firstError[0] : (data.detail || errorMsg);
            
            // Special case for email uniqueness
            if (firstKey === 'email' && errorMsg.includes('exists')) {
              errorMsg = 'This email is already registered.';
            }
          } else if (data.detail) {
            errorMsg = data.detail;
          }
        }
        setMessage({ type: 'error', text: errorMsg });
      }
    } catch {
      setMessage({ type: 'error', text: 'Server connection error.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-[400px]">
        
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 mb-4">
            <span className="material-symbols-outlined text-white text-3xl">work</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Recruiter Portal</h1>
          <p className="text-sm text-gray-500 mt-1">AI-Driven Hiring Platform</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          
          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            <button 
              onClick={() => setMode('login')}
              className={`flex-1 py-4 text-sm font-semibold transition-colors ${mode === 'login' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Sign In
            </button>
            <button 
              onClick={() => setMode('register')}
              className={`flex-1 py-4 text-sm font-semibold transition-colors ${mode === 'register' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Request Access
            </button>
          </div>

          <div className="p-8">
            {message && (
              <div className={`mb-6 p-4 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                {message.text}
              </div>
            )}

            {mode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Email Address</label>
                  <input 
                    type="email" 
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                    placeholder="name@company.com"
                    value={loginForm.email}
                    onChange={e => setLoginForm({...loginForm, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Password</label>
                  <input 
                    type="password" 
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                    placeholder="••••••••"
                    value={loginForm.password}
                    onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                  />
                </div>
                <button 
                  disabled={loading}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-all shadow-sm shadow-blue-100 mt-2 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Sign In'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Work Email</label>
                  <input 
                    type="email" 
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                    placeholder="name@company.com"
                    value={registerForm.email}
                    onChange={e => setRegisterForm({...registerForm, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Password</label>
                  <input 
                    type="password" 
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                    placeholder="Min. 8 characters"
                    value={registerForm.password}
                    onChange={e => setRegisterForm({...registerForm, password: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Confirm Password</label>
                  <input 
                    type="password" 
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                    placeholder="Re-enter password"
                    value={registerForm.confirm}
                    onChange={e => setRegisterForm({...registerForm, confirm: e.target.value})}
                  />
                </div>
                <button 
                  disabled={loading}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-all shadow-sm shadow-blue-100 mt-2 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Request Access'}
                </button>
              </form>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          By signing in, you agree to our <span className="underline cursor-pointer">Terms of Service</span>
        </p>

      </div>
    </div>
  );
}
