import React, { useEffect, useState } from 'react';
import { 
  FileText, 
  FileDown, 
  Settings, 
  GraduationCap, 
  BookOpen, 
  Calendar 
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';

export const SharedReports: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');

  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        if (user?.role === 'admin') {
          const [resCls, resSub, resStud] = await Promise.all([
            api.get('/admin/classes'),
            api.get('/admin/subjects'),
            api.get('/admin/students')
          ]);
          setClasses(resCls.data);
          setSubjects(resSub.data);
          setStudents(resStud.data);
        } else if (user?.role === 'faculty') {
          const res = await api.get('/faculty/dashboard/stats');
          // Format assignments
          const uniqueClasses = Array.from(new Map(res.data.assignments.map((item: any) => [item.class_id, { id: item.class_id, name: item.class_name }])).values());
          const uniqueSubjects = Array.from(new Map(res.data.assignments.map((item: any) => [item.subject_id, { id: item.subject_id, name: item.subject_name }])).values());
          setClasses(uniqueClasses);
          setSubjects(uniqueSubjects);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchDropdowns();
  }, [user]);

  // Load students for selected class if faculty
  useEffect(() => {
    if (user?.role !== 'faculty' || !selectedClass) return;
    const fetchClassStudents = async () => {
      try {
        const response = await api.get(`/faculty/classes/${selectedClass}/students`);
        setStudents(response.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchClassStudents();
  }, [selectedClass, user]);

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsExporting(true);

    try {
      // Build query string
      const params = new URLSearchParams();
      params.append('format', selectedFormat);
      if (selectedClass) params.append('class_id', selectedClass);
      if (selectedSubject) params.append('subject_id', selectedSubject);
      
      // If student role, force their ID
      if (user?.role === 'student') {
        params.append('student_id', user.id);
      } else if (selectedStudent) {
        params.append('student_id', selectedStudent);
      }

      // Trigger download using direct URL redirect
      const downloadUrl = `/api/v1/reports/export?${params.toString()}`;
      
      // Retrieve JWT token
      const response = await api.get(downloadUrl, {
        responseType: 'blob'
      });
      
      const fileType = selectedFormat === 'pdf' 
        ? 'application/pdf' 
        : selectedFormat === 'excel' 
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'text/csv';
        
      const blob = new Blob([response.data], { type: fileType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const extension = selectedFormat === 'pdf' ? 'pdf' : selectedFormat === 'excel' ? 'xlsx' : 'csv';
      link.setAttribute('download', `attendance_report_${new Date().toISOString().split('T')[0]}.${extension}`);
      document.body.appendChild(link);
      link.click();
      
      // cleanup
      link.remove();
      window.URL.revokeObjectURL(url);
      toast("Report generated successfully!");
    } catch (err: any) {
      toast("No attendance records found matching filters.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-primary">Attendance Reports</h2>
        <p className="text-sm text-slate-500">Generate, schedule, and compile printable PDF or spreadsheet summaries</p>
      </div>

      <form onSubmit={handleExport} className="card-base space-y-6 border-slate-200">
        
        {/* Export configuration formats */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Report Format</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'pdf', label: 'PDF Document', desc: 'Printable sheets' },
              { id: 'excel', label: 'Excel Sheet', desc: 'Detailed analysis' },
              { id: 'csv', label: 'CSV File', desc: 'Data importing' }
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedFormat(f.id as any)}
                className={`p-4 border text-left rounded-custom transition-all flex flex-col justify-between ${
                  selectedFormat === f.id 
                    ? 'border-primary bg-slate-50 ring-1 ring-primary' 
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <span className="font-semibold text-sm text-primary">{f.label}</span>
                <span className="text-[10px] text-slate-400 mt-1 font-medium">{f.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Filter Inputs (Admins & Faculty) */}
        {user?.role !== 'student' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-borderLight pt-6">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                Class Filter
              </label>
              <select 
                value={selectedClass} 
                onChange={(e) => setSelectedClass(e.target.value)} 
                className="input-field"
              >
                <option value="">All Classes</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                Subject Filter
              </label>
              <select 
                value={selectedSubject} 
                onChange={(e) => setSelectedSubject(e.target.value)} 
                className="input-field"
              >
                <option value="">All Subjects</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                Student Filter
              </label>
              <select 
                value={selectedStudent} 
                onChange={(e) => setSelectedStudent(e.target.value)} 
                className="input-field"
              >
                <option value="">All Enrolled Students</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.user?.full_name || s.full_name} ({s.roll_number})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="border-t border-borderLight pt-6 flex justify-end">
          <button 
            type="submit" 
            disabled={isExporting} 
            className="btn-primary w-full sm:w-fit py-2.5 px-6 flex items-center gap-2"
          >
            <FileDown className="h-4 w-4" /> 
            {isExporting ? "Compiling Report..." : `Download ${selectedFormat.toUpperCase()}`}
          </button>
        </div>

      </form>
    </div>
  );
};
export default SharedReports;
