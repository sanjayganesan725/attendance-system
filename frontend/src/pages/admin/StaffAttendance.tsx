import React, { useEffect, useState } from 'react';
import { 
  UserCheck, 
  Calendar, 
  Save, 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText,
  Loader2
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../components/Toast';
import { TableSkeleton } from '../../components/Skeleton';

interface StaffAttendanceRow {
  faculty_id: string;
  employee_id: string;
  full_name: string;
  email: string;
  designation: string;
  specialization: string;
  status: string; // Present, Absent, Late, Leave
  remarks: string;
  marked: boolean;
}

export const AdminStaffAttendance: React.FC = () => {
  const { toast } = useToast();
  const [attendanceDate, setAttendanceDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [staffList, setStaffList] = useState<StaffAttendanceRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchStaffAttendance = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/admin/staff-attendance?attendance_date=${attendanceDate}`);
      const formatted = response.data.map((r: any) => ({
        ...r,
        status: r.status || 'Present',
        remarks: r.remarks || ''
      }));
      setStaffList(formatted);
    } catch (err) {
      toast("Failed to load staff attendance details", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffAttendance();
  }, [attendanceDate]);

  const handleStatusChange = (facultyId: string, status: string) => {
    setStaffList(prev => prev.map(s => {
      if (s.faculty_id !== facultyId) return s;
      return { ...s, status };
    }));
  };

  const handleRemarksChange = (facultyId: string, remarks: string) => {
    setStaffList(prev => prev.map(s => {
      if (s.faculty_id !== facultyId) return s;
      return { ...s, remarks };
    }));
  };

  const handleMarkAll = (status: string) => {
    setStaffList(prev => prev.map(s => ({ ...s, status })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        date: attendanceDate,
        records: staffList.map(s => ({
          faculty_id: s.faculty_id,
          status: s.status,
          remarks: s.remarks || null
        }))
      };

      await api.post('/admin/staff-attendance/take', payload);
      toast("Staff attendance recorded successfully!");
      fetchStaffAttendance();
    } catch (err: any) {
      toast("Error saving staff attendance", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredStaff = staffList.filter(s => 
    s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.employee_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.designation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const presentCount = staffList.filter(s => s.status === 'Present').length;
  const absentCount = staffList.filter(s => s.status === 'Absent').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-primary flex items-center gap-2">
            <UserCheck className="h-6 w-6 text-indigo-600" /> Staff Daily Attendance
          </h2>
          <p className="text-sm text-slate-500">
            Record and manage daily presence, absences, and leave records for department staff members
          </p>
        </div>
      </div>

      {/* Date & Bulk Actions Bar */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card-base flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-slate-200">
          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Attendance Date</label>
              <div className="relative">
                <input 
                  type="date" 
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="input-field py-1.5 text-sm font-medium"
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-2 mt-5">
              <button 
                type="button" 
                onClick={() => handleMarkAll('Present')}
                className="px-3 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-custom border border-emerald-200 transition-all"
              >
                Mark All Present
              </button>
              <button 
                type="button" 
                onClick={() => handleMarkAll('Absent')}
                className="px-3 py-1.5 text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-custom border border-rose-200 transition-all"
              >
                Mark All Absent
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Present: {presentCount}
            </span>
            <span className="px-3 py-1.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
              Absent: {absentCount}
            </span>
          </div>
        </div>

        {/* Search & Submit button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search staff by name or EMP ID..." 
              className="input-field pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting || isLoading}
            className="btn-primary w-full sm:w-auto py-2.5 px-6 flex items-center gap-2"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Staff Attendance
          </button>
        </div>

        {/* Staff Table */}
        {isLoading ? (
          <TableSkeleton />
        ) : filteredStaff.length === 0 ? (
          <div className="card-base text-center py-12 flex flex-col items-center">
            <UserCheck className="h-12 w-12 text-slate-300 mb-3" />
            <h4 className="font-semibold text-primary">No Staff Members Found</h4>
            <p className="text-sm text-slate-400 mt-1">Configure staff records in Faculty management.</p>
          </div>
        ) : (
          <div className="card-base overflow-x-auto border-slate-200">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="table-th">EMP ID</th>
                  <th className="table-th">Staff Member</th>
                  <th className="table-th">Designation</th>
                  <th className="table-th text-center">Status</th>
                  <th className="table-th">Instructor Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStaff.map((s) => (
                  <tr key={s.faculty_id} className="hover:bg-slate-50/50">
                    <td className="table-td font-semibold text-slate-700">{s.employee_id}</td>
                    <td className="table-td">
                      <div className="font-semibold text-primary">{s.full_name}</div>
                      <div className="text-xs text-slate-400 font-medium">{s.email}</div>
                    </td>
                    <td className="table-td text-xs text-slate-600 font-medium">{s.designation}</td>
                    
                    {/* Status selection buttons */}
                    <td className="table-td">
                      <div className="flex justify-center items-center gap-1.5">
                        {[
                          { id: 'Present', label: 'Present', color: 'bg-emerald-600 text-white' },
                          { id: 'Absent', label: 'Absent', color: 'bg-rose-600 text-white' }
                        ].map(st => (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => handleStatusChange(s.faculty_id, st.id)}
                            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                              s.status === st.id
                                ? `${st.color} shadow-xs font-bold ring-1 ring-offset-1`
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {st.label}
                          </button>
                        ))}
                      </div>
                    </td>

                    {/* Remarks input */}
                    <td className="table-td">
                      <input 
                        type="text" 
                        placeholder="Optional remarks..."
                        className="input-field py-1 text-xs"
                        value={s.remarks}
                        onChange={(e) => handleRemarksChange(s.faculty_id, e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </form>
    </div>
  );
};

export default AdminStaffAttendance;
