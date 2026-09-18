import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  const token = localStorage.getItem('access');
  const role = localStorage.getItem('role');

  const isAuthorized = !!token && (role === 'recruiter' || role === 'admin');

  if (!isAuthorized) {
    // If logged in but wrong role, clear and redirect
    if (token) {
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        localStorage.removeItem('role');
    }
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
