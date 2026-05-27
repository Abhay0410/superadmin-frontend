import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedRoute() {
  const TOKEN_KEY = import.meta.env.VITE_REACT_APP_AUTH_TOKEN_KEY || 'superAdminToken';
  const token = localStorage.getItem(TOKEN_KEY);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}