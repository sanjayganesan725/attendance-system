import React, { useEffect, useState } from 'react';
import { Award, BookOpen, FileSpreadsheet, PieChart, Printer } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../components/Toast';
import { TableSkeleton } from '../../components/Skeleton';
import { useAuth } from '../../context/AuthContext';

interface MarkData {
  id: string;
  student_id: string;
  subject_id: string;
  cfa1: number | null;
  cfa2: number | null;
  cfa?: number | null;
  ese?: number | null;
  total: number | null;
  percentage?: number | null;
  subject: {
    id: string;
    name: string;
    code: string;
    credits: number;
  };
}

export const StudentMarks: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [marks, setMarks] = useState<MarkData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMarks = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/student/marks');
      setMarks(response.data);
    } catch (err) {
      toast("Error fetching marks details", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMarks();
  }, []);

  // Compute metrics
  const totalCredits = marks.reduce((sum, m) => sum + (m.subject?.credits || 0), 0);
  const gradedSubjects = marks.filter(m => (m.cfa1 ?? m.cfa) !== null || (m.cfa2 ?? m.ese) !== null);

  const cfa1Avg = gradedSubjects.length 
    ? (gradedSubjects.reduce((sum, m) => sum + (m.cfa1 ?? m.cfa ?? 0), 0) / gradedSubjects.length).toFixed(1) 
    : 'N/A';

  const cfa2Avg = gradedSubjects.length 
    ? (gradedSubjects.reduce((sum, m) => sum + (m.cfa2 ?? m.ese ?? 0), 0) / gradedSubjects.length).toFixed(1) 
    : 'N/A';

  const totalAvg = gradedSubjects.length
    ? (gradedSubjects.reduce((sum, m) => {
        const tot = m.total ?? ((m.cfa1 ?? m.cfa ?? 0) + (m.cfa2 ?? m.ese ?? 0));
        return sum + tot;
      }, 0) / gradedSubjects.length).toFixed(1)
    : 'N/A';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 print:space-y-4 print:p-0">
      {/* Header and Print action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-primary">Semester Marks Card</h2>
          <p className="text-sm text-slate-500">View continuous assessments (CFA 1 & CFA 2) and final percentages</p>
        </div>
        <button
          onClick={handlePrint}
          className="btn-primary flex items-center gap-2 px-4 py-2.5 shadow-sm"
        >
          <Printer className="h-4 w-4" /> Download / Print Marks Card
        </button>
      </div>

      {/* Printable Header (Visible only when printing) */}
      <div className="hidden print:block border-b-2 border-slate-800 pb-4 mb-4">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-wide">GANDHIGRAM RURAL INSTITUTE</h1>
          <p className="text-xs text-slate-600 font-semibold uppercase">Deemed to be University · Ministry of Education, Govt. of India</p>
          <h2 className="text-lg font-extrabold text-slate-800 mt-2 uppercase underline decoration-2">OFFICIAL SEMESTER STATEMENT OF MARKS</h2>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-700 mt-4 bg-slate-50 p-3 rounded border border-slate-200">
          <div><span className="font-bold text-slate-900">Student Name:</span> {user?.name || 'Student'}</div>
          <div><span className="font-bold text-slate-900">Roll Number:</span> {(user as any)?.roll_number || '24CEU3101'}</div>
          <div><span className="font-bold text-slate-900">Department:</span> Civil Engineering</div>
          <div><span className="font-bold text-slate-900">Academic Year:</span> 2025 - 2026</div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4 print:gap-2">
        <div className="card-base flex items-center gap-4 p-4 print:p-2 print:shadow-none print:border">
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 print:hidden">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider print:text-[10px]">Total Credits</p>
            <h3 className="text-xl font-bold text-slate-800 mt-0.5 print:text-base">{totalCredits}</h3>
          </div>
        </div>

        <div className="card-base flex items-center gap-4 p-4 print:p-2 print:shadow-none print:border">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 print:hidden">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider print:text-[10px]">CFA 1 Average</p>
            <h3 className="text-xl font-bold text-slate-800 mt-0.5 print:text-base">{cfa1Avg} / 50</h3>
          </div>
        </div>

        <div className="card-base flex items-center gap-4 p-4 print:p-2 print:shadow-none print:border">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600 print:hidden">
            <PieChart className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider print:text-[10px]">CFA 2 Average</p>
            <h3 className="text-xl font-bold text-slate-800 mt-0.5 print:text-base">{cfa2Avg} / 50</h3>
          </div>
        </div>

        <div className="card-base flex items-center gap-4 p-4 print:p-2 print:shadow-none print:border">
          <div className="p-3 rounded-xl bg-pink-50 text-pink-600 print:hidden">
            <FileSpreadsheet className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider print:text-[10px]">Total Average</p>
            <h3 className="text-xl font-bold text-slate-800 mt-0.5 print:text-base">{totalAvg}%</h3>
          </div>
        </div>
      </div>

      {/* Marks Table */}
      {isLoading ? (
        <TableSkeleton />
      ) : marks.length === 0 ? (
        <div className="card-base text-center py-12 flex flex-col items-center">
          <Award className="h-12 w-12 text-slate-300 mb-3" />
          <h4 className="font-semibold text-primary">No Marks Released</h4>
          <p className="text-sm text-slate-400 mt-1">There are no academic marks graded for your current semester yet.</p>
        </div>
      ) : (
        <div className="card-base overflow-x-auto border-slate-200 print:shadow-none print:border-none print:p-0">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-200 print:border-slate-800">
                <th className="table-th print:text-xs print:p-2">Course Code</th>
                <th className="table-th print:text-xs print:p-2">Course Title</th>
                <th className="table-th text-center print:text-xs print:p-2">Credits</th>
                <th className="table-th text-center print:text-xs print:p-2">CFA 1 (Max 50)</th>
                <th className="table-th text-center print:text-xs print:p-2">CFA 2 (Max 50)</th>
                <th className="table-th text-center print:text-xs print:p-2">Total (Max 100)</th>
                <th className="table-th text-center print:text-xs print:p-2">Percentage (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 print:divide-slate-300">
              {marks.map((m) => {
                const c1 = m.cfa1 ?? m.cfa ?? null;
                const c2 = m.cfa2 ?? m.ese ?? null;
                const tot = m.total ?? (c1 !== null || c2 !== null ? (c1 || 0) + (c2 || 0) : null);
                const perc = m.percentage ?? (tot !== null ? roundOneDecimal((tot / 100) * 100) : null);

                return (
                  <tr key={m.id} className="hover:bg-slate-50/50">
                    <td className="table-td font-semibold text-slate-700 print:text-xs print:p-2">{m.subject?.code}</td>
                    <td className="table-td text-primary font-medium print:text-xs print:p-2">{m.subject?.name}</td>
                    <td className="table-td text-slate-600 text-center print:text-xs print:p-2">{m.subject?.credits}</td>
                    <td className="table-td text-slate-600 text-center font-medium print:text-xs print:p-2">
                      {c1 !== null ? c1 : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="table-td text-slate-600 text-center font-medium print:text-xs print:p-2">
                      {c2 !== null ? c2 : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="table-td text-center print:text-xs print:p-2">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold print:border-none print:bg-transparent ${
                        tot !== null 
                          ? tot >= 50 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                            : 'bg-rose-50 text-rose-700 border border-rose-100'
                          : 'bg-slate-50 text-slate-400'
                      }`}>
                        {tot !== null ? `${tot}` : 'N/A'}
                      </span>
                    </td>
                    <td className="table-td text-center print:text-xs print:p-2">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold print:border-none print:bg-transparent ${
                        perc !== null 
                          ? perc >= 50 
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' 
                            : 'bg-rose-50 text-rose-700 border border-rose-100'
                          : 'bg-slate-50 text-slate-400'
                      }`}>
                        {perc !== null ? `${perc}%` : 'N/A'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Printable Footer with Signatures */}
      <div className="hidden print:flex justify-between items-end pt-12 mt-8 text-xs font-semibold text-slate-800">
        <div className="text-center space-y-8">
          <div className="border-t border-slate-400 w-36 mx-auto pt-1">Student Signature</div>
        </div>
        <div className="text-center space-y-8">
          <div className="border-t border-slate-400 w-36 mx-auto pt-1">Faculty Advisor</div>
        </div>
        <div className="text-center space-y-8">
          <div className="border-t border-slate-400 w-44 mx-auto pt-1">Head of Department / Controller</div>
        </div>
      </div>
    </div>
  );
};

function roundOneDecimal(num: number): number {
  return Math.round(num * 10) / 10;
}

export default StudentMarks;
