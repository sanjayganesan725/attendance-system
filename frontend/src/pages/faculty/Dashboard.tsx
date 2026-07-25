import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  BookOpen, 
  FileCheck2, 
  ArrowRight,
  ClipboardList,
  Clock
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../components/Toast';
import { Skeleton } from '../../components/Skeleton';

interface FacultyStats {
  classes_count: number;
  subjects_count: number;
  marked_records_count: number;
  assignments: Array<{
    id: string;
    class_id: string;
    class_name: string;
    subject_id: string;
    subject_name: string;
    subject_code: string;
    department_name: string;
  }>;
}

export const FacultyDashboard: React.FC = () => {
  const { toast } = useToast();
  const [data, setData] = useState<FacultyStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFacultyData = async () => {
      try {
        const response = await api.get('/faculty/dashboard/stats');
        setData(response.data);
      } catch (err) {
        toast("Failed to load dashboard metrics", "error");
      } finally {
        setIsLoading(false);
      }
    };
    fetchFacultyData();
  }, [toast]);

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(n => <Skeleton key={n} className="h-24 w-full" />)}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Quick Timetable Banner */}
      <div className="bg-primary text-white p-5 rounded-custom flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-soft">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-custom">
            <Clock className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold">Civil Engineering Department Timetable</h2>
            <p className="text-xs text-slate-300">View 4-year class schedules & assigned periods</p>
          </div>
        </div>
        <Link
          to="/faculty/timetable"
          className="px-4 py-2 bg-white text-primary font-semibold text-xs rounded-custom hover:bg-slate-100 transition-all shrink-0"
        >
          Open Class Timetable
        </Link>
      </div>

      {/* Counters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-base flex items-center gap-4">
          <div className="bg-blue-50 p-3 rounded-custom text-blue-600">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Assigned Subjects</span>
            <span className="text-2xl font-bold text-primary">{data.subjects_count}</span>
          </div>
        </div>

        <div className="card-base flex items-center gap-4">
          <div className="bg-purple-50 p-3 rounded-custom text-purple-600">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Total Classes</span>
            <span className="text-2xl font-bold text-primary">{data.classes_count}</span>
          </div>
        </div>

        <div className="card-base flex items-center gap-4">
          <div className="bg-green-50 p-3 rounded-custom text-green-600">
            <FileCheck2 className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Rolls Marked</span>
            <span className="text-2xl font-bold text-primary">{data.marked_records_count}</span>
          </div>
        </div>
      </div>

      {/* Course Assignments lists */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-primary">Your Teaching Assignments</h3>
        
        {data.assignments.length === 0 ? (
          <div className="card-base text-center py-12 flex flex-col items-center border-dashed">
            <ClipboardList className="h-12 w-12 text-slate-300 mb-3" />
            <h4 className="font-semibold text-primary">No Assignments Configured</h4>
            <p className="text-sm text-slate-400 mt-1">Please contact System Administrator to assign your classes.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.assignments.map((asg) => (
              <div key={asg.id} className="card-base flex flex-col justify-between border-slate-200 hover:border-slate-300 transition-all">
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 mb-3 uppercase tracking-wider">
                    {asg.department_name}
                  </span>
                  <h4 className="font-bold text-lg text-primary">{asg.subject_name}</h4>
                  <p className="text-xs text-slate-500 font-medium mt-1">Code: {asg.subject_code} | Class: {asg.class_name}</p>
                </div>
                
                <div className="border-t border-borderLight pt-4 mt-6 flex justify-end gap-3">
                  <Link 
                    to={`/faculty/take-attendance?class_id=${asg.class_id}&subject_id=${asg.subject_id}`}
                    className="btn-accent flex items-center gap-1.5 py-1.5 px-3"
                  >
                    Take Attendance <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default FacultyDashboard;
