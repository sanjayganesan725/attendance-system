import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Award, 
  Save, 
  ChevronLeft, 
  Search,
  Loader2,
  Users
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../components/Toast';
import { TableSkeleton } from '../../components/Skeleton';

interface StudentMarkRow {
  student_id: string;
  roll_number: string;
  full_name: string;
  cfa1: number | string | null;
  cfa2: number | string | null;
  cfa?: number | string | null;
  ese?: number | string | null;
  total?: number | null;
  percentage?: number | null;
}

export const FacultyManageMarks: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Workload selection states
  const [assignments, setAssignments] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  
  // Student marks states
  const [students, setStudents] = useState<StudentMarkRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch initial workload
  useEffect(() => {
    const fetchWorkload = async () => {
      try {
        const statsRes = await api.get('/faculty/dashboard/stats');
        setAssignments(statsRes.data.assignments);
        
        // Remove duplicates for classes
        const uniqueClasses = Array.from(
          new Map(statsRes.data.assignments.map((a: any) => [a.class_id, { id: a.class_id, name: a.class_name }])).values()
        );
        setClasses(uniqueClasses);
      } catch (err) {
        toast("Failed to load options or assignments", "error");
      }
    };
    fetchWorkload();
  }, [toast]);

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
    
    if (selectedSubject && !uniqueSubjects.some((s: any) => s.id === selectedSubject)) {
      setSelectedSubject('');
    }
  }, [selectedClass, assignments, selectedSubject]);

  // Fetch student marks list when class & subject are selected
  const fetchStudentMarks = async () => {
    if (!selectedClass || !selectedSubject) return;
    setIsLoading(true);
    try {
      const response = await api.get(`/faculty/classes/${selectedClass}/subjects/${selectedSubject}/marks`);
      const formatted = response.data.map((r: any) => ({
        ...r,
        cfa1: r.cfa1 !== null && r.cfa1 !== undefined ? r.cfa1 : (r.cfa !== null && r.cfa !== undefined ? r.cfa : ''),
        cfa2: r.cfa2 !== null && r.cfa2 !== undefined ? r.cfa2 : (r.ese !== null && r.ese !== undefined ? r.ese : '')
      }));
      setStudents(formatted);
    } catch (err) {
      toast("Failed to load student marks", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentMarks();
  }, [selectedClass, selectedSubject]);

  // Handle mark input changes
  const handleMarkChange = (studentId: string, field: 'cfa1' | 'cfa2', value: string) => {
    setStudents(prev => prev.map(s => {
      if (s.student_id !== studentId) return s;
      
      let cleanVal: number | string = value;
      if (value !== '') {
        const num = parseInt(value);
        if (isNaN(num)) return s;
        if (num > 50) cleanVal = 50;
        else if (num < 0) cleanVal = 0;
        else cleanVal = num;
      }

      return {
        ...s,
        [field]: cleanVal
      };
    }));
  };

  // Submit batch of marks
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !selectedSubject) {
      toast("Please select both class and subject", "error");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const payload = {
        class_id: selectedClass,
        subject_id: selectedSubject,
        records: students.map(s => ({
          student_id: s.student_id,
          cfa1: s.cfa1 === '' ? null : s.cfa1,
          cfa2: s.cfa2 === '' ? null : s.cfa2,
          cfa: s.cfa1 === '' ? null : s.cfa1,
          ese: s.cfa2 === '' ? null : s.cfa2
        }))
      };

      await api.post('/faculty/marks/submit', payload);
      toast("Student marks updated successfully!");
      fetchStudentMarks();
    } catch (err: any) {
      toast("Could not save marks card details.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredStudents = students.filter(s => 
    s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.roll_number.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      {/* Header navigations */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/faculty')} className="btn-secondary p-2">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-primary">Manage Marks</h2>
          <p className="text-sm text-slate-500">Record and submit student CFA 1 (Max 50) and CFA 2 (Max 50) marks card</p>
        </div>
      </div>

      {/* Select class & subject */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card-base grid grid-cols-1 md:grid-cols-2 gap-6 border-slate-200">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Class</label>
            <select 
              value={selectedClass} 
              onChange={(e) => setSelectedClass(e.target.value)} 
              className="input-field"
              required
            >
              <option value="">Select Class</option>
              {classes.map(c => (
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
              disabled={!selectedClass}
              required
            >
              <option value="">Select Subject</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Student Marks List */}
        {selectedClass && selectedSubject && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search student by name or roll..." 
                  className="input-field pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button 
                type="submit" 
                className="btn-primary w-full sm:w-auto"
                disabled={isSubmitting || isLoading}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Marks Card
              </button>
            </div>

            {isLoading ? (
              <TableSkeleton />
            ) : filteredStudents.length === 0 ? (
              <div className="card-base text-center py-12 flex flex-col items-center">
                <Users className="h-12 w-12 text-slate-300 mb-3" />
                <h4 className="font-semibold text-primary">No Students Found</h4>
                <p className="text-sm text-slate-400 mt-1">Enroll students into B.Tech to manage marks.</p>
              </div>
            ) : (
              <div className="card-base overflow-x-auto border-slate-200">
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th className="table-th">Roll Number</th>
                      <th className="table-th">Full Name</th>
                      <th className="table-th text-center w-36">CFA 1 (Max 50)</th>
                      <th className="table-th text-center w-36">CFA 2 (Max 50)</th>
                      <th className="table-th text-center w-32">Total (Max 100)</th>
                      <th className="table-th text-center w-32">Percentage (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((s) => {
                      const c1Val = s.cfa1 !== '' ? Number(s.cfa1) : null;
                      const c2Val = s.cfa2 !== '' ? Number(s.cfa2) : null;
                      const totalVal = (c1Val !== null || c2Val !== null) ? ((c1Val || 0) + (c2Val || 0)) : null;
                      const percVal = totalVal !== null ? Math.round((totalVal / 100) * 100 * 10) / 10 : null;

                      return (
                        <tr key={s.student_id} className="hover:bg-slate-50/50">
                          <td className="table-td font-semibold text-slate-700">{s.roll_number}</td>
                          <td className="table-td text-primary font-medium">{s.full_name}</td>
                          
                          {/* CFA 1 Input */}
                          <td className="table-td">
                            <div className="flex justify-center">
                              <input 
                                type="number" 
                                min="0"
                                max="50"
                                placeholder="CFA 1"
                                className="input-field text-center w-24 py-1"
                                value={s.cfa1 !== null ? s.cfa1 : ''}
                                onChange={(e) => handleMarkChange(s.student_id, 'cfa1', e.target.value)}
                              />
                            </div>
                          </td>

                          {/* CFA 2 Input */}
                          <td className="table-td">
                            <div className="flex justify-center">
                              <input 
                                type="number" 
                                min="0"
                                max="50"
                                placeholder="CFA 2"
                                className="input-field text-center w-24 py-1"
                                value={s.cfa2 !== null ? s.cfa2 : ''}
                                onChange={(e) => handleMarkChange(s.student_id, 'cfa2', e.target.value)}
                              />
                            </div>
                          </td>

                          {/* Total calculated mark */}
                          <td className="table-td text-center">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                              totalVal !== null 
                                ? totalVal >= 50 
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                  : 'bg-rose-50 text-rose-700 border border-rose-100'
                                : 'bg-slate-50 text-slate-400'
                            }`}>
                              {totalVal !== null ? `${totalVal}` : 'N/A'}
                            </span>
                          </td>

                          {/* Percentage badge */}
                          <td className="table-td text-center">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                              percVal !== null 
                                ? percVal >= 50 
                                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' 
                                  : 'bg-rose-50 text-rose-700 border border-rose-100'
                                : 'bg-slate-50 text-slate-400'
                            }`}>
                              {percVal !== null ? `${percVal}%` : 'N/A'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
};

export default FacultyManageMarks;
