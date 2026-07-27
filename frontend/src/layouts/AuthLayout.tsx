import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';

export const AuthLayout: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  // If already logged in, send them straight to their respective dashboards
  if (isAuthenticated && user) {
    return <Navigate to={`/${user.role}`} replace />;
  }

  return (
    <div className="min-h-screen bg-bgApp flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <img src={logo} alt="Gandhigram Rural Institute Logo" className="mx-auto h-24 w-auto mb-3" />
        <div className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-2">CRT GRI</div>
        <h2 className="text-3xl font-extrabold text-primary tracking-tight">
          Attendance of CRT
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Clean, minimal college & corporate attendance tracking
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 border border-borderLight shadow-soft rounded-custom sm:px-10">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
export default AuthLayout;
