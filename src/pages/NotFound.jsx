import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FF] p-6 text-center font-sans">
      <div className="w-24 h-24 bg-indigo-100 rounded-3xl flex items-center justify-center text-indigo-600 mb-8">
        <span className="text-4xl font-black">404</span>
      </div>
      <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Page Not Found</h1>
      <p className="text-lg text-slate-500 mb-10 max-w-md">
        The page you are looking for might have been moved, deleted, or never existed.
      </p>
      <button 
        onClick={() => navigate('/')}
        className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-[0.98]"
      >
        Back to Dashboard
      </button>
    </div>
  );
};

export default NotFound;
