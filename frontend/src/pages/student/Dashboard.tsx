import React, { useEffect, useState } from 'react';
import {
  CheckCircle,
  AlertCircle,
  Calendar,
  BookOpen,
  TrendingUp,
  User
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import api from '../../services/api';
import { useToast } from '../../components/Toast';
import { Skeleton } from '../../components/Skeleton';
import { useAuth } from '../../context/AuthContext';

interface SubjectPercentage {
  subject_id: string;
  subject_name: string;
  subject_code: string;
  total_conducted: number;
  attended: number;
  present: number;
  absent: number;
  half_day: number;
  leave: number;
  percentage: number;
}

interface DashboardStats {
  student: {
    id: string;
    roll_number: string;
    registration_number: string;
    department: string;
    class_name: string;
    semester: string;
    name: string;
    email: string;
  };
  today_count: number;
  today_present: number;
  today_absent: number;
  total_records: number;
  present: number;
  absent: number;
  leave: number;
  overall_percentage: number;
  trends: Array<{ name: string; rate: number; present: number; total: number }>;
}

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<any[]>([]);
  const [percentages, setPercentages] = useState<SubjectPercentage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const [resDash, resToday, resPerc] = await Promise.all([
          api.get('/student/dashboard/stats'),
          api.get('/student/today-attendance'),
          api.get('/student/subject-wise-percentage')
        ]);
        setStats(resDash.data);
        setTodayAttendance(resToday.data);
        setPercentages(resPerc.data);
      } catch (err) {
        toast('Failed to load dashboard metrics', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchStudentData();
  }, [toast]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(n => <Skeleton key={n} className="h-24 w-full" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-72 lg:col-span-2 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const totalConducted = percentages.reduce((sum, p) => sum + p.total_conducted, 0);
  const totalAttended = percentages.reduce((sum, p) => sum + p.attended, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Present': return 'bg-green-50 text-green-700 border-green-200';
      case 'Absent': return 'bg-red-50 text-red-700 border-red-200';
      case 'Late': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Leave': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Half Day': return 'bg-purple-50 text-purple-700 border-purple-200';
      default: return 'bg-slate-50 text-slate-400 border-slate-200';
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-primary text-white p-6 rounded-custom shadow-soft">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
            <User className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Hello, {stats?.student?.name || user?.name || 'Student'}</h2>
            <p className="text-slate-400 text-sm mt-0.5">
              {stats?.student?.class_name} · {stats?.student?.department} · {stats?.student?.semester}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-center">
            <span className="block text-2xl font-extrabold">{stats?.overall_percentage ?? 0}%</span>
            <span className="text-xs text-slate-400 uppercase tracking-wider">Overall</span>
          </div>
          <div className="h-10 w-px bg-white/20" />
          <div className="text-center">
            <span className="block text-2xl font-extrabold">{stats?.today_count ?? 0}</span>
            <span className="text-xs text-slate-400 uppercase tracking-wider">Today's Classes</span>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-base flex items-center gap-4">
          <div className="bg-blue-50 p-3 rounded-custom text-blue-600">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Total Classes</span>
            <span className="text-xl font-bold text-primary">{totalConducted}</span>
          </div>
        </div>
        <div className="card-base flex items-center gap-4">
          <div className="bg-green-50 p-3 rounded-custom text-green-600">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Attended</span>
            <span className="text-xl font-bold text-primary">{totalAttended}</span>
          </div>
        </div>
        <div className="card-base flex items-center gap-4">
          <div className="bg-red-50 p-3 rounded-custom text-red-600">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Absent</span>
            <span className="text-xl font-bold text-primary">{stats?.absent ?? 0}</span>
          </div>
        </div>
        <div className="card-base flex items-center gap-4">
          <div className="bg-purple-50 p-3 rounded-custom text-purple-600">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">On Leave</span>
            <span className="text-xl font-bold text-primary">{stats?.leave ?? 0}</span>
          </div>
        </div>
      </div>

      {/* Charts & Today */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Trend Chart */}
        <div className="card-base lg:col-span-2">
          <h3 className="text-base font-semibold text-primary mb-1">Monthly Attendance Trend</h3>
          <p className="text-xs text-slate-400 mb-4">Your attendance % over the past 6 months</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.trends ?? []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="attendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} domain={[0, 100]} />
                <Tooltip
                  formatter={(value: number) => [`${value}%`, 'Attendance Rate']}
                  contentStyle={{ background: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="rate" stroke="#2563EB" strokeWidth={2} fill="url(#attendGrad)" dot={{ r: 4, fill: '#2563EB' }} activeDot={{ r: 6 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Today's Attendance */}
        <div className="card-base">
          <h3 className="text-base font-semibold text-primary mb-1 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400" /> Today's Classes
          </h3>
          <p className="text-xs text-slate-400 mb-4">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          {todayAttendance.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-slate-200" />
              <p className="text-sm">No classes listed for today.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayAttendance.map((c) => (
                <div key={c.subject_id} className="flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-sm text-primary">{c.subject_name}</span>
                    <span className="block text-[10px] text-slate-400 font-medium">{c.subject_code}{c.period ? ` · Period ${c.period}` : ''}</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(c.status)}`}>
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Subject-wise Breakdown */}
      <div className="card-base">
        <h3 className="text-base font-semibold text-primary mb-4">Subject-wise Attendance</h3>
        {percentages.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">No enrollment data registered.</p>
        ) : (
          <div className="space-y-5">
            {percentages.map((p) => (
              <div key={p.subject_id}>
                <div className="flex justify-between items-end text-sm mb-1.5">
                  <div>
                    <span className="font-semibold text-primary">{p.subject_name}</span>
                    <span className="text-xs text-slate-400 ml-1.5 font-medium">({p.subject_code})</span>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <span className="text-xs text-slate-400">{p.attended}/{p.total_conducted} classes</span>
                    <span className={`font-bold text-sm ${p.percentage >= 75 ? 'text-green-600' : p.percentage >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                      {p.percentage}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${p.percentage >= 75 ? 'bg-green-500' : p.percentage >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(p.percentage, 100)}%` }}
                  />
                </div>
                <div className="flex gap-4 mt-1.5 text-[10px] text-slate-400">
                  <span>Present: {p.present}</span>
                  <span>Absent: {p.absent}</span>
                  <span>Late: {p.late ?? 0}</span>
                  {p.leave > 0 && <span>Leave: {p.leave}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default StudentDashboard;
