import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/Toast';

// Layouts
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

import AdminDashboard from './pages/admin/Dashboard';
import AdminStudents from './pages/admin/Students';
import AdminFaculty from './pages/admin/Faculty';
import AdminAcademic from './pages/admin/Academic';
import AdminHolidays from './pages/admin/Holidays';
import { AdminStaffAttendance } from './pages/admin/StaffAttendance';

import FacultyDashboard from './pages/faculty/Dashboard';
import FacultyTakeAttendance from './pages/faculty/TakeAttendance';
import FacultyHistory from './pages/faculty/History';

import StudentDashboard from './pages/student/Dashboard';
import StudentHistory from './pages/student/History';
import { StudentMarks } from './pages/student/Marks';
import { StudentStaffDirectory } from './pages/student/StaffDirectory';
import { FacultyManageMarks } from './pages/faculty/ManageMarks';

import SharedProfile from './pages/shared/Profile';
import SharedReports from './pages/shared/Reports';
import { DailyUpdates } from './pages/shared/DailyUpdates';
import SharedTimetable from './pages/shared/Timetable';

const queryClient = new QueryClient();

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Auth routes */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
              </Route>

              {/* Protected Admin routes */}
              <Route path="/admin" element={<DashboardLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="staff-attendance" element={<AdminStaffAttendance />} />
                <Route path="take-attendance" element={<FacultyTakeAttendance />} />
                <Route path="students" element={<AdminStudents />} />
                <Route path="faculty" element={<AdminFaculty />} />
                <Route path="academic" element={<AdminAcademic />} />
                <Route path="holidays" element={<AdminHolidays />} />
                <Route path="staff-directory" element={<StudentStaffDirectory />} />
                <Route path="timetable" element={<SharedTimetable />} />
                <Route path="profile" element={<SharedProfile />} />
                <Route path="reports" element={<SharedReports />} />
                <Route path="activities" element={<DailyUpdates />} />
              </Route>

              {/* Protected Faculty routes */}
              <Route path="/faculty" element={<DashboardLayout />}>
                <Route index element={<FacultyDashboard />} />
                <Route path="take-attendance" element={<FacultyTakeAttendance />} />
                <Route path="history" element={<FacultyHistory />} />
                <Route path="marks" element={<FacultyManageMarks />} />
                <Route path="staff-directory" element={<StudentStaffDirectory />} />
                <Route path="timetable" element={<SharedTimetable />} />
                <Route path="profile" element={<SharedProfile />} />
                <Route path="reports" element={<SharedReports />} />
                <Route path="activities" element={<DailyUpdates />} />
              </Route>

              {/* Protected Student routes */}
              <Route path="/student" element={<DashboardLayout />}>
                <Route index element={<StudentDashboard />} />
                <Route path="history" element={<StudentHistory />} />
                <Route path="marks" element={<StudentMarks />} />
                <Route path="staff-directory" element={<StudentStaffDirectory />} />
                <Route path="timetable" element={<SharedTimetable />} />
                <Route path="profile" element={<SharedProfile />} />
                <Route path="reports" element={<SharedReports />} />
                <Route path="activities" element={<DailyUpdates />} />
              </Route>

              {/* Fallbacks */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
};
export default App;
