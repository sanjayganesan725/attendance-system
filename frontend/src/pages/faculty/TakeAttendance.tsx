import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Users, 
  ClipboardCheck, 
  Calendar,
  AlertTriangle,
  ChevronLeft
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../components/Toast';
import { TableSkeleton } from '../../components/Skeleton';
import { useAuth } from '../../context/AuthContext';

interface StudentData {
  id: string;
  roll_number: string;
  user: {
    full_name: string;
    email: string;
  };
}

export const FacultyTakeAttendance: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const classId = searchParams.get('class_id') || '';
  const subjectId = searchParams.get('subject_id') || '';
  
  // Selection States
  const [assignments, setAssignments] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState(classId);
  const [selectedSubject, setSelectedSubject] = useState(subjectId);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedPeriod, setSelectedPeriod] = useState(1);
  
  const [students, setStudents] = useState<StudentData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Holiday and Weekend validation states
  const [holidays, setHolidays] = useState<any[]>([]);
  const [isHolidayDate, setIsHolidayDate] = useState(false);
  const [holidayName, setHolidayName] = useState('');
  
  // Grid checklist state
  const { user } = useAuth();
  const [records, setRecords] = useState<Record<string, { status: string; remarks: string }>>({});

  useEffect(() => {
    const fetchOptionsAndHolidays = async () => {
      try {
        const statsRes = await api.get('/faculty/dashboard/stats');
        setAssignments(statsRes.data.assignments);
        
        let uniqueClasses = Array.from(
          new Map(statsRes.data.assignments.map((a: any) => [a.class_id, { id: a.class_id, name: a.class_name }])).values()
        );

        if (user?.role === 'admin') {
          const adminClsRes = await api.get('/admin/classes');
          const adminClasses = adminClsRes.data.map((c: any) => ({ id: c.id, name: c.name }));
          uniqueClasses = Array.from(
            new Map([...uniqueClasses, ...adminClasses].map((c: any) => [c.id, c])).values()
          );
        }

        setClasses(uniqueClasses);
        
        const holidaysRes = await api.get('/faculty/holidays');
        setHolidays(holidaysRes.data);
      } catch (err) {
        toast("Failed to load options or holiday configurations", "error");
      }
    };
    fetchOptionsAndHolidays();
  }, [toast, user]);

  // Dynamically filter subjects based on selected class
  useEffect(() => {
    if (!selectedClass) {
      setSubjects([]);
      setSelectedSubject('');
      return;
    }
    const classAssignments = assignments.filter(a => a.class_id === selectedClass);
    const uniqueSubjects = Array.from(
      new Map(classAssignments.map((a: any) => [a.subject_id, { id: a.subject_id, name: a.subject_name }])).values()
    );
    setSubjects(uniqueSubjects);
    
    // Reset selected subject if it's no longer valid for the selected class
    if (selectedSubject && !uniqueSubjects.some((s: any) => s.id === selectedSubject)) {
      setSelectedSubject('');
    }
  }, [selectedClass, assignments, selectedSubject]);

  useEffect(() => {
    if (!attendanceDate) return;
    const [year, month, day] = attendanceDate.split('-').map(Number);
    const localDate = new Date(year, month - 1, day);
    const dayOfWeek = localDate.getDay(); // 0 is Sunday, 6 is Saturday
    
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      setIsHolidayDate(true);
      setHolidayName(dayOfWeek === 0 ? 'Sunday Weekly Off' : 'Saturday Weekly Off');
      return;
    }

    const matchedHoliday = holidays.find(h => h.date === attendanceDate);
    if (matchedHoliday) {
      setIsHolidayDate(true);
      setHolidayName(matchedHoliday.name);
    } else {
      setIsHolidayDate(false);
      setHolidayName('');
    }
  }, [attendanceDate, holidays]);

  useEffect(() => {
    if (!selectedClass) return;
    
    const fetchStudents = async () => {
      setIsLoading(true);
      try {
        const response = await api.get(`/faculty/classes/${selectedClass}/students`);
        setStudents(response.data);
        
        // Initialise state
        const initialRecords: Record<string, { status: string; remarks: string }> = {};
        response.data.forEach((stud: any) => {
          initialRecords[stud.id] = { status: 'Present', remarks: '' };
        });
        setRecords(initialRecords);
      } catch (err) {
        toast("Failed to load student profiles", "error");
      } finally {
        setIsLoading(false);
      }
    };
    fetchStudents();
  }, [selectedClass, toast]);

  const handleStatusChange = (studentId: string, status: string) => {
    setRecords(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status
      }
    }));
  };

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setRecords(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks
      }
    }));
  };

  const markAll = (status: string) => {
    setRecords(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(key => {
        updated[key].status = status;
      });
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !selectedSubject) {
      toast("Please select both class and subject", "error");
      return;
    }
    if (isHolidayDate) {
      toast(`Cannot submit attendance on a holiday: ${holidayName}`, "error");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const payload = {
        class_id: selectedClass,
        subject_id: selectedSubject,
        date: attendanceDate,
        period: selectedPeriod,
        records: Object.entries(records).map(([student_id, item]) => ({
          student_id,
          status: item.status,
          remarks: item.remarks || null
        }))
      };

      await api.post('/faculty/attendance/submit', payload);
      toast("Attendance sheet submitted successfully!");
      navigate(user?.role === 'admin' ? '/admin' : '/faculty');
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Could not save attendance.";
      toast(msg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentAssignment = assignments.find(
    a => a.class_id === selectedClass && a.subject_id === selectedSubject
  );
  const assignedFacultyName = currentAssignment?.faculty_name || 'Unassigned';

  return (
    <div className="space-y-6">
      {/* Header navigations */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(user?.role === 'admin' ? '/admin' : '/faculty')} className="btn-secondary p-2">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-primary">Take Attendance</h2>
          <p className="text-sm text-slate-500">Submit rolls for selected classes, subjects, and periods</p>
        </div>
      </div>

      {/* Select selectors */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card-base grid grid-cols-1 md:grid-cols-4 gap-6">
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
              value={attendanceDate} 
              onChange={(e) => setAttendanceDate(e.target.value)} 
              className={`input-field ${isHolidayDate ? 'border-red-300 focus:ring-red-200' : ''}`}
              required 
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Period</label>
            <select 
              value={selectedPeriod} 
              onChange={(e) => setSelectedPeriod(Number(e.target.value))} 
              className="input-field font-medium text-slate-800"
              required
            >
              {[1, 2, 3, 4, 5, 6].map(p => (
                <option key={p} value={p}>Period {p}</option>
              ))}
              <option value={7}>Extra Class</option>
            </select>
          </div>
        </div>

        {selectedClass && selectedSubject && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-indigo-50/80 border border-indigo-100 p-3.5 rounded-custom text-xs">
            <div className="flex items-center gap-2 font-medium text-indigo-950">
              <span className="font-bold uppercase tracking-wider text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded">
                Assigned Staff
              </span>
              <span className="font-bold text-sm text-indigo-900">{assignedFacultyName}</span>
            </div>
            {user?.role === 'admin' && (
              <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                Admin Proxy Mode (Staff Missed / Absent)
              </span>
            )}
          </div>
        )}

        {isHolidayDate && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 text-red-700 rounded-custom">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Selected date is a Holiday: {holidayName}</p>
              <p className="text-xs text-red-600 mt-0.5">You cannot mark or submit attendance on weekends or holidays.</p>
            </div>
          </div>
        )}

        {/* Global batch actions */}
        {selectedClass && students.length > 0 && (
          <div className="flex justify-between items-center bg-slate-50 px-4 py-3 rounded-custom border border-borderLight">
            <span className="text-sm font-medium text-slate-600">Quick Actions:</span>
            <div className="flex gap-2">
              <button 
                type="button" 
                onClick={() => markAll('Present')} 
                className="btn-secondary py-1 px-3 text-xs bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
              >
                Mark All Present
              </button>
              <button 
                type="button" 
                onClick={() => markAll('Absent')} 
                className="btn-secondary py-1 px-3 text-xs bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
              >
                Mark All Absent
              </button>
            </div>
          </div>
        )}

        {/* Student roll listing */}
        {isLoading ? (
          <TableSkeleton />
        ) : !selectedClass ? (
          <div className="card-base text-center py-12 flex flex-col items-center border-dashed">
            <ClipboardCheck className="h-12 w-12 text-slate-300 mb-3" />
            <h4 className="font-semibold text-primary">Class selection required</h4>
            <p className="text-sm text-slate-400 mt-1">Select class and subject to display details.</p>
          </div>
        ) : students.length === 0 ? (
          <div className="card-base text-center py-12 flex flex-col items-center">
            <Users className="h-12 w-12 text-slate-300 mb-3" />
            <h4 className="font-semibold text-primary">No Enrolled Students</h4>
            <p className="text-sm text-slate-400 mt-1">There are no students listed inside this class.</p>
          </div>
        ) : (
          <div className="card-base space-y-4">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="table-th">Roll Number</th>
                    <th className="table-th">Student Name</th>
                    <th className="table-th">Status Selection</th>
                    <th className="table-th">Remarks / Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => {
                    const currentRecord = records[student.id] || { status: 'Present', remarks: '' };
                    return (
                      <tr key={student.id} className="hover:bg-slate-50/50">
                        <td className="table-td font-semibold text-slate-700">{student.roll_number}</td>
                        <td className="table-td text-primary font-medium">{student.user.full_name}</td>
                        <td className="table-td">
                          <div className="flex bg-slate-100 p-0.5 rounded-lg w-fit">
                            {['Present', 'Absent'].map((status) => (
                              <button
                                key={status}
                                type="button"
                                onClick={() => handleStatusChange(student.id, status)}
                                className={`px-3 py-1 text-xs font-semibold rounded-custom transition-all ${
                                  currentRecord.status === status
                                    ? status === 'Present'
                                      ? 'bg-green-600 text-white shadow-xs'
                                      : 'bg-red-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-200'
                                }`}
                              >
                                {status}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="table-td">
                          <input 
                            type="text" 
                            placeholder="Remarks / Notes..." 
                            className="input-field py-1 text-xs max-w-xs"
                            value={currentRecord.remarks}
                            onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="border-t border-borderLight pt-4 flex justify-end">
              <button 
                type="submit" 
                disabled={isSubmitting || isHolidayDate} 
                className={`btn-primary py-2.5 px-6 ${isHolidayDate ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? "Saving Records..." : "Submit Attendance"}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
export default FacultyTakeAttendance;
