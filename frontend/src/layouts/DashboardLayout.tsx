import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  Calendar, 
  Megaphone, 
  FileText, 
  User, 
  LogOut, 
  Menu, 
  ChevronLeft, 
  ChevronRight,
  BookOpen,
  Bell,
  Award,
  Contact
} from 'lucide-react';

export const DashboardLayout: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // If not authenticated, redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Define links based on role
  const getLinks = () => {
    const common = [
      { path: `/${user.role}/activities`, label: 'Daily Updates', icon: Megaphone },
      { path: `/${user.role}/reports`, label: 'Reports', icon: FileText },
      { path: `/${user.role}/profile`, label: 'Profile', icon: User },
    ];

    if (user.role === 'admin') {
      return [
        { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/admin/students', label: 'Students', icon: Users },
        { path: '/admin/faculty', label: 'Faculty', icon: GraduationCap },
        { path: '/admin/academic', label: 'Academic Setup', icon: BookOpen },
        { path: '/admin/holidays', label: 'Holidays', icon: Calendar },
        ...common
      ];
    } else if (user.role === 'faculty') {
      return [
        { path: '/faculty', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/faculty/take-attendance', label: 'Take Attendance', icon: Users },
        { path: '/faculty/history', label: 'Attendance History', icon: Calendar },
        { path: '/faculty/marks', label: 'Manage Marks', icon: Award },
        ...common
      ];
    } else {
      // Student
      return [
        { path: '/student', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/student/history', label: 'Attendance Logs', icon: Calendar },
        { path: '/student/marks', label: 'Semester Marks', icon: Award },
        { path: '/student/staff-directory', label: 'Staff Directory', icon: Contact },
        ...common
      ];
    }
  };

  const links = getLinks();

  // Generate breadcrumb text
  const getBreadcrumb = () => {
    const paths = location.pathname.split('/').filter(Boolean);
    if (paths.length === 0) return 'Home';
    return paths.map(p => p.charAt(0).toUpperCase() + p.slice(1).replace('-', ' ')).join(' / ');
  };

  return (
    <div className="flex h-screen bg-bgApp overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside 
        className={`hidden md:flex flex-col bg-white border-r border-borderLight transition-all duration-300 ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Brand logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-borderLight shrink-0">
          {!isCollapsed && (
            <div className="flex items-center gap-2 overflow-hidden">
              <img src={logo} alt="Logo" className="h-8 w-auto shrink-0" />
              <span className="font-semibold text-primary text-sm tracking-tight leading-tight whitespace-nowrap">CRT ATTENDANCE</span>
            </div>
          )}
          {isCollapsed && <img src={logo} alt="Logo" className="h-8 w-auto mx-auto shrink-0" />}
          
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)} 
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-1.5 rounded-custom transition-all"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-custom text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-primary text-white' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!isCollapsed && <span>{link.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer profile & logout */}
        <div className="p-2 border-t border-borderLight shrink-0 bg-slate-50/50">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-custom text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50/50 transition-all"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Sidebar - Mobile Drawer */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs" onClick={() => setIsMobileOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white border-r border-borderLight animate-slide-in">
            <div className="flex items-center justify-between h-16 px-4 border-b border-borderLight shrink-0">
              <div className="flex items-center gap-2 overflow-hidden">
                <img src={logo} alt="Logo" className="h-8 w-auto shrink-0" />
                <span className="font-semibold text-primary text-sm tracking-tight leading-tight whitespace-nowrap">CRT ATTENDANCE</span>
              </div>
              <button 
                onClick={() => setIsMobileOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-1.5 rounded-custom"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
              {links.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-custom text-sm font-medium transition-all ${
                      isActive 
                        ? 'bg-primary text-white' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-borderLight">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-3 py-2 rounded-custom text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-all"
              >
                <LogOut className="h-5 w-5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Sticky navbar */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-16 bg-white border-b border-borderLight px-4 md:px-6 shrink-0 shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileOpen(true)}
              className="md:hidden text-slate-500 hover:text-slate-800 hover:bg-slate-50 p-1.5 rounded-custom"
            >
              <Menu className="h-5 w-5" />
            </button>
            
            {/* Breadcrumb */}
            <span className="text-sm font-medium text-slate-500 hidden sm:inline-block">
              {getBreadcrumb()}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative text-slate-500 hover:text-slate-800 hover:bg-slate-50 p-2 rounded-custom transition-all"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-accent" />
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-borderLight rounded-custom shadow-lg py-2 z-50">
                  <div className="px-4 py-2 font-semibold text-xs text-slate-500 uppercase border-b border-borderLight">
                    Announcements & Bulletins
                  </div>
                  <div className="max-h-60 overflow-y-auto px-4 py-2 space-y-3">
                    <div className="text-sm text-slate-700 font-medium">
                      📅 Midterm schedule published
                      <p className="text-xs text-slate-400 mt-0.5">Academic exams begin next week.</p>
                    </div>
                    <div className="text-sm text-slate-700 font-medium">
                      🎉 System updates completed
                      <p className="text-xs text-slate-400 mt-0.5">V1.0 is now live and stable.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar / Quick Profile */}
            <Link 
              to={`/${user.role}/profile`}
              className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900 border-l border-borderLight pl-4"
            >
              <div className="h-8 w-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-bold text-slate-700 overflow-hidden">
                {user.profile_picture_url ? (
                  <img src={user.profile_picture_url} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-semibold leading-tight">{user.name}</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider leading-none mt-0.5">{user.role}</span>
              </div>
            </Link>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
export default DashboardLayout;
