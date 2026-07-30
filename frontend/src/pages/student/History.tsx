import React, { useEffect, useState } from 'react';
import { Calendar, Filter, Search } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../components/Toast';
import { TableSkeleton } from '../../components/Skeleton';

export const StudentHistory: React.FC = () => {
  const { toast } = useToast();
  const [history, setHistory] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(
        `/student/attendance/history?subject_id=${selectedSubject}&status_val=${selectedStatus}`
      );
      setHistory(response.data);
    } catch (err) {
      toast("Error fetching history details", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchInit = async () => {
      try {
        const resPerc = await api.get('/student/subject-wise-percentage');
        setSubjects(resPerc.data.map((p: any) => ({ id: p.subject_id, name: p.subject_name })));
      } catch (err) {
        console.error(err);
      }
    };
    fetchInit();
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [selectedSubject, selectedStatus]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-primary">Attendance Logs</h2>
        <p className="text-sm text-slate-500">Track and view your complete class attendance history</p>
      </div>

      {/* Query filters */}
      <div className="card-base grid grid-cols-1 md:grid-cols-2 gap-4 border-slate-200">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Subject</label>
          <select
            className="input-field"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            <option value="">All Subjects</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Status</label>
          <select
            className="input-field"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
          </select>
        </div>
      </div>

      {/* History table */}
      {isLoading ? (
        <TableSkeleton />
      ) : history.length === 0 ? (
        <div className="card-base text-center py-12 flex flex-col items-center">
          <Calendar className="h-12 w-12 text-slate-300 mb-3" />
          <h4 className="font-semibold text-primary">No Records Found</h4>
          <p className="text-sm text-slate-400 mt-1">There are no attendance sheets matching selected queries.</p>
        </div>
      ) : (
        <div className="card-base overflow-x-auto border-slate-200">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="table-th">Date</th>
                <th className="table-th">Subject</th>
                <th className="table-th">Status</th>
                <th className="table-th">Instructor Remarks</th>
                <th className="table-th">Marked By</th>
              </tr>
            </thead>
            <tbody>
              {history.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50/50">
                  <td className="table-td font-semibold text-slate-700">
                    {new Date(rec.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="table-td text-primary font-medium">{rec.subject?.name} ({rec.subject?.code})</td>
                  <td className="table-td">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      rec.status === 'Present'
                        ? 'bg-green-50 text-green-700'
                        : rec.status === 'Absent'
                        ? 'bg-red-50 text-red-700'
                        : rec.status === 'Late'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-blue-50 text-blue-700'
                    }`}>
                      {rec.status}
                    </span>
                  </td>
                  <td className="table-td text-slate-500 text-xs italic">{rec.remarks || 'No remarks'}</td>
                  <td className="table-td text-slate-600 text-sm font-medium">{rec.marker?.full_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
export default StudentHistory;
