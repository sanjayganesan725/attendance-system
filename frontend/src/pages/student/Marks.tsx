import React, { useEffect, useState } from 'react';
import { Award, BookOpen, FileSpreadsheet, PieChart } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../components/Toast';
import { TableSkeleton } from '../../components/Skeleton';

interface MarkData {
  id: string;
  student_id: string;
  subject_id: string;
  cfa: number | null;
  ese: number | null;
  total: number | null;
  subject: {
    id: string;
    name: string;
    code: string;
    credits: number;
  };
}

export const StudentMarks: React.FC = () => {
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
  const gradedSubjects = marks.filter(m => m.cfa !== null || m.ese !== null);
  const cfaAvg = gradedSubjects.length 
    ? (gradedSubjects.reduce((sum, m) => sum + (m.cfa || 0), 0) / gradedSubjects.length).toFixed(1) 
    : 'N/A';
  const eseAvg = gradedSubjects.length 
    ? (gradedSubjects.reduce((sum, m) => sum + (m.ese || 0), 0) / gradedSubjects.length).toFixed(1) 
    : 'N/A';
    
  // Estimate GPA or average out of 100
  const totalAvg = gradedSubjects.length
    ? (gradedSubjects.reduce((sum, m) => sum + (m.total || 0), 0) / gradedSubjects.length).toFixed(1)
    : 'N/A';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-primary">Semester Marks Card</h2>
        <p className="text-sm text-slate-500">View your continuous assessments (CFA) and end semester exam (ESE) results</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-base flex items-center gap-4 p-4">
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Credits</p>
            <h3 className="text-xl font-bold text-slate-800 mt-0.5">{totalCredits}</h3>
          </div>
        </div>

        <div className="card-base flex items-center gap-4 p-4">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">CFA Average (Internal)</p>
            <h3 className="text-xl font-bold text-slate-800 mt-0.5">{cfaAvg} / 40</h3>
          </div>
        </div>

        <div className="card-base flex items-center gap-4 p-4">
          <div className="p-3 rounded-xl bg-orange-50 text-orange-600">
            <PieChart className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">ESE Average (End Sem)</p>
            <h3 className="text-xl font-bold text-slate-800 mt-0.5">{eseAvg} / 60</h3>
          </div>
        </div>

        <div className="card-base flex items-center gap-4 p-4">
          <div className="p-3 rounded-xl bg-pink-50 text-pink-600">
            <FileSpreadsheet className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Average</p>
            <h3 className="text-xl font-bold text-slate-800 mt-0.5">{totalAvg}%</h3>
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
        <div className="card-base overflow-x-auto border-slate-200">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="table-th">Course Code</th>
                <th className="table-th">Course Title</th>
                <th className="table-th text-center">Credits</th>
                <th className="table-th text-center">CFA (Max 40)</th>
                <th className="table-th text-center">ESE (Max 60)</th>
                <th className="table-th text-center">Total (Max 100)</th>
              </tr>
            </thead>
            <tbody>
              {marks.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/50">
                  <td className="table-td font-semibold text-slate-700">{m.subject?.code}</td>
                  <td className="table-td text-primary font-medium">{m.subject?.name}</td>
                  <td className="table-td text-slate-600 text-center">{m.subject?.credits}</td>
                  <td className="table-td text-slate-600 text-center font-medium">
                    {m.cfa !== null ? m.cfa : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="table-td text-slate-600 text-center font-medium">
                    {m.ese !== null ? m.ese : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="table-td text-center">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                      m.total !== null 
                        ? m.total >= 50 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                          : 'bg-rose-50 text-rose-700 border border-rose-100'
                        : 'bg-slate-50 text-slate-400'
                    }`}>
                      {m.total !== null ? `${m.total}` : 'N/A'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
