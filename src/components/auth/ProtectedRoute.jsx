import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  const token = localStorage.getItem('access');
  
  let role = null;
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      role = payload.role;
    } catch (e) {
      console.error("Invalid token format");
    }
  }

  const isAuthorized = !!token && (role === 'recruiter' || role === 'admin');

  if (!isAuthorized) {
    // If logged in but wrong role, clear and redirect
    if (token) {
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
    }
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
