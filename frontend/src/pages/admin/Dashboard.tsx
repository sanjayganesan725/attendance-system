import React, { useEffect, useState } from 'react';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  CheckCircle,
  AlertCircle,
  Clock,
  FileText
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import api from '../../services/api';
import { useToast } from '../../components/Toast';
import { Skeleton } from '../../components/Skeleton';

interface DashboardData {
  counters: {
    students: number;
    faculty: number;
    departments: number;
    classes: number;
  };
  today_stats: {
    marked: number;
    present: number;
    absent: number;
    leave: number;
    late: number;
    rate: number;
  };
  overall_rate: number;
  trends: Array<{ name: string; rate: number }>;
  recent_activities: Array<{
    id: string;
    action: string;
    details: string;
    created_at: string;
    user_name: string;
  }>;
}

export const AdminDashboard: React.FC = () => {
  const { toast } = useToast();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/admin/dashboard/stats');
        setData(response.data);
      } catch (err: any) {
        toast("Failed to load dashboard statistics", "error");
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, [toast]);

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(n => <Skeleton key={n} className="h-24 w-full" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80 lg:col-span-2 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Counters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card-base flex items-center gap-4">
          <div className="bg-blue-50 p-3 rounded-custom text-blue-600">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Total Students</span>
            <span className="text-2xl font-bold text-primary">{data.counters.students}</span>
          </div>
        </div>

        <div className="card-base flex items-center gap-4">
          <div className="bg-green-50 p-3 rounded-custom text-green-600">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Faculty Members</span>
            <span className="text-2xl font-bold text-primary">{data.counters.faculty}</span>
          </div>
        </div>

        <div className="card-base flex items-center gap-4">
          <div className="bg-purple-50 p-3 rounded-custom text-purple-600">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Active Classes</span>
            <span className="text-2xl font-bold text-primary">{data.counters.classes}</span>
          </div>
        </div>

        <div className="card-base flex items-center gap-4">
          <div className="bg-amber-50 p-3 rounded-custom text-amber-600">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Avg Attendance</span>
            <span className="text-2xl font-bold text-primary">{data.overall_rate}%</span>
          </div>
        </div>
      </div>

      {/* Main Row: Trends & Today's Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Analytics Chart */}
        <div className="card-base lg:col-span-2">
          <h3 className="text-base font-semibold text-primary mb-4">Historical Attendance Trends (%)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0' }} />
                <Line type="monotone" dataKey="rate" stroke="#2563EB" strokeWidth={2.5} activeDot={{ r: 6 }} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Today's Stats Card */}
        <div className="card-base flex flex-col justify-between">
          <div>
            <h3 className="text-base font-semibold text-primary mb-4">Today's Attendance</h3>
            <div className="text-center py-4 bg-slate-50 rounded-custom mb-6 border border-borderLight">
              <span className="text-4xl font-extrabold text-accent">{data.today_stats.rate}%</span>
              <p className="text-xs text-slate-500 mt-1 font-medium">Conduct attendance rate</p>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="flex items-center gap-2 text-slate-600">
                  <CheckCircle className="h-4 w-4 text-green-500" /> Present
                </span>
                <span className="text-primary font-bold">{data.today_stats.present}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="flex items-center gap-2 text-slate-600">
                  <AlertCircle className="h-4 w-4 text-red-500" /> Absent
                </span>
                <span className="text-primary font-bold">{data.today_stats.absent}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="flex items-center gap-2 text-slate-600">
                  <Clock className="h-4 w-4 text-amber-500" /> Late
                </span>
                <span className="text-primary font-bold">{data.today_stats.late}</span>
              </div>
            </div>
          </div>
          <div className="text-xs text-slate-400 border-t border-borderLight pt-4 mt-4 text-center">
            Total of {data.today_stats.marked} student records submitted today
          </div>
        </div>
      </div>

      {/* Audit Activities List */}
      <div className="card-base">
        <h3 className="text-base font-semibold text-primary mb-4">Recent System Activities</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="table-th">Timestamp</th>
                <th className="table-th">User</th>
                <th className="table-th">Action</th>
                <th className="table-th">Details</th>
              </tr>
            </thead>
            <tbody>
              {data.recent_activities.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-6 text-slate-400 text-sm">
                    No recent activity logs available.
                  </td>
                </tr>
              ) : (
                data.recent_activities.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="table-td text-xs text-slate-400">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="table-td font-semibold text-slate-700">
                      {log.user_name}
                    </td>
                    <td className="table-td">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 uppercase">
                        {log.action}
                      </span>
                    </td>
                    <td className="table-td text-slate-500 max-w-xs truncate">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default AdminDashboard;
