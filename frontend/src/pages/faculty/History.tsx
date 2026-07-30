import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Search, Edit2, History as HistoryIcon, User } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../components/Toast';
import { Modal } from '../../components/Modal';
import { TableSkeleton } from '../../components/Skeleton';

export const FacultyHistory: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  // Selections
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const [records, setRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [newStatus, setNewStatus] = useState('Present');
  const [changeReason, setChangeReason] = useState('');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const response = await api.get('/faculty/dashboard/stats');
        setClasses(response.data.assignments.map((a: any) => ({ id: a.class_id, name: a.class_name })));
        setSubjects(response.data.assignments.map((a: any) => ({ id: a.subject_id, name: a.subject_name })));
      } catch (err) {
        toast("Failed to load options", "error");
      }
    };
    fetchOptions();
  }, [toast]);

  const fetchRecords = async () => {
    if (!selectedClass || !selectedSubject) return;
    setIsLoading(true);
    try {
      const response = await api.get(
        `/faculty/attendance/history?class_id=${selectedClass}&subject_id=${selectedSubject}&date_val=${selectedDate}`
      );
      setRecords(response.data);
    } catch (err: any) {
      toast("Error loading attendance history", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [selectedClass, selectedSubject, selectedDate]);

  const handleEditClick = async (rec: any) => {
    setSelectedRecord(rec);
    setNewStatus(rec.status);
    setChangeReason('');
    setIsEditOpen(true);
    
    // Fetch Audit log for this record
    try {
      const res = await api.get(`/faculty/attendance/${rec.id}/audit-logs`);
      setAuditLogs(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    if (!changeReason.trim()) {
      toast("Reason for status modification is required", "error");
      return;
    }

    setIsSavingEdit(true);
    try {
      await api.put(`/faculty/attendance/${selectedRecord.id}`, {
        status: newStatus,
        change_reason: changeReason
      });
      toast("Attendance log modified successfully!");
      setIsEditOpen(false);
      fetchRecords(); // Reload grid
    } catch (err: any) {
      toast("Failed to update status", "error");
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-primary">Attendance History</h2>
        <p className="text-sm text-slate-500">Search and audit previously submitted attendance sheets</p>
      </div>

      {/* Select query criteria */}
      <div className="card-base grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Class</label>
          <select 
            value={selectedClass} 
            onChange={(e) => setSelectedClass(e.target.value)} 
            className="input-field"
            required
          >
            <option value="">Select Class</option>
            {Array.from(new Map(classes.map(item => [item.id, item])).values()).map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Subject</label>
          <select 
            value={selectedSubject} 
            onChange={(e) => setSelectedSubject(e.target.value)} 
            className="input-field"
            required
          >
            <option value="">Select Subject</option>
            {Array.from(new Map(subjects.map(item => [item.id, item])).values()).map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Date</label>
          <input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)} 
            className="input-field"
            required 
          />
        </div>
      </div>

      {/* Results grid */}
      {isLoading ? (
        <TableSkeleton />
      ) : !selectedClass || !selectedSubject ? (
        <div className="card-base text-center py-12 flex flex-col items-center border-dashed">
          <Calendar className="h-12 w-12 text-slate-300 mb-3" />
          <h4 className="font-semibold text-primary">Class selection required</h4>
          <p className="text-sm text-slate-400 mt-1">Select parameters above to display records.</p>
        </div>
      ) : records.length === 0 ? (
        <div className="card-base text-center py-12 flex flex-col items-center">
          <Search className="h-12 w-12 text-slate-300 mb-3" />
          <h4 className="font-semibold text-primary">No Records Found</h4>
          <p className="text-sm text-slate-400 mt-1">No attendance was marked for this subject on selected date.</p>
        </div>
      ) : (
        <div className="card-base overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="table-th">Roll Number</th>
                <th className="table-th">Student Name</th>
                <th className="table-th">Status</th>
                <th className="table-th">Remarks</th>
                <th className="table-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50/50">
                  <td className="table-td font-semibold text-slate-700">{rec.student?.roll_number}</td>
                  <td className="table-td text-primary font-medium">{rec.student?.user?.full_name}</td>
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
                  <td className="table-td text-slate-500 text-xs italic">{rec.remarks || '-'}</td>
                  <td className="table-td">
                    <button 
                      onClick={() => handleEditClick(rec)}
                      className="btn-secondary flex items-center gap-1 py-1 px-2.5 text-xs shadow-none hover:bg-slate-100"
                    >
                      <Edit2 className="h-3 w-3" /> Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Record Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Audit Attendance Record">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Student</span>
            <p className="text-sm font-semibold text-primary">
              {selectedRecord?.student?.user?.full_name} ({selectedRecord?.student?.roll_number})
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Attendance Status</label>
            <div className="flex bg-slate-100 p-0.5 rounded-lg w-fit">
              {['Present', 'Absent'].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setNewStatus(status)}
                  className={`px-3.5 py-1 text-xs font-semibold rounded-custom transition-all ${
                    newStatus === status
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Reason for Modification</label>
            <input 
              type="text" 
              placeholder="e.g. Correcting grading error, Student arrived late" 
              className="input-field"
              value={changeReason}
              onChange={(e) => setChangeReason(e.target.value)}
              required
            />
          </div>

          {/* Audit Trail Logs */}
          {auditLogs.length > 0 && (
            <div className="border-t border-borderLight pt-4 space-y-2">
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <HistoryIcon className="h-3.5 w-3.5" /> Audit Trail (Modifications)
              </span>
              <div className="bg-slate-50 rounded-custom p-3 border border-borderLight max-h-32 overflow-y-auto space-y-2">
                {auditLogs.map((log) => (
                  <div key={log.id} className="text-xs text-slate-500 leading-normal border-b border-slate-100 pb-1.5 last:border-0 last:pb-0">
                    Changed from <b>{log.old_status}</b> to <b>{log.new_status}</b>
                    <br />
                    Reason: <i>"{log.change_reason}"</i>
                    <span className="block text-[10px] text-slate-400 mt-0.5">
                      On {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-end border-t border-borderLight pt-4">
            <button type="button" onClick={() => setIsEditOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={isSavingEdit} className="btn-primary">
              {isSavingEdit ? "Saving..." : "Save Modifications"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default FacultyHistory;
