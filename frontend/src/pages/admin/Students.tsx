import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Loader2,
  GraduationCap
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../components/Toast';
import { Modal } from '../../components/Modal';
import { TableSkeleton } from '../../components/Skeleton';

// Zod validations
const studentSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
  full_name: z.string().min(2, "Full name required"),
  phone: z.string().optional(),
  roll_number: z.string().min(1, "Roll number required"),
  registration_number: z.string().min(1, "Registration number required"),
  department_id: z.string().min(1, "Select department"),
  class_id: z.string().min(1, "Select class"),
  academic_year_id: z.string().min(1, "Select academic year"),
  semester_id: z.string().min(1, "Select semester")
});

type StudentFormValues = z.infer<typeof studentSchema>;

export const AdminStudents: React.FC = () => {
  const { toast } = useToast();
  const [students, setStudents] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  
  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema)
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [resStud, resDept, resClass, resAY, resSem] = await Promise.all([
        api.get(`/admin/students?search=${search}&class_id=${filterClass}`),
        api.get('/admin/departments'),
        api.get('/admin/classes'),
        api.get('/admin/academic-years'),
        api.get('/admin/semesters')
      ]);
      setStudents(resStud.data);
      setDepartments(resDept.data);
      setClasses(resClass.data);
      setAcademicYears(resAY.data);
      setSemesters(resSem.data);
    } catch (err: any) {
      toast("Error loading students data", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, filterClass]);

  const handleAddSubmit = async (data: StudentFormValues) => {
    if (!data.password) {
      toast("Password is required for new students", "error");
      return;
    }
    try {
      await api.post('/admin/students', data);
      toast("Student enrolled successfully!");
      setIsAddOpen(false);
      reset();
      fetchData();
    } catch (err: any) {
      toast(err.response?.data?.detail || "Failed to enrol student", "error");
    }
  };

  const handleEditClick = (student: any) => {
    setSelectedStudent(student);
    setIsEditOpen(true);
    setValue('email', student.user.email);
    setValue('full_name', student.user.full_name);
    setValue('phone', student.user.phone || '');
    setValue('roll_number', student.roll_number);
    setValue('registration_number', student.registration_number);
    setValue('department_id', student.department_id);
    setValue('class_id', student.class_id);
    setValue('academic_year_id', student.academic_year_id);
    setValue('semester_id', student.semester_id);
  };

  const handleEditSubmit = async (data: StudentFormValues) => {
    if (!selectedStudent) return;
    try {
      // Exclude empty password from update body
      const { password, ...updateBody } = data;
      await api.put(`/admin/students/${selectedStudent.id}`, updateBody);
      toast("Student profile updated!");
      setIsEditOpen(false);
      reset();
      fetchData();
    } catch (err: any) {
      toast("Failed to update profile", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this student? All attendance records will be removed.")) return;
    try {
      await api.delete(`/admin/students/${id}`);
      toast("Student removed successfully");
      fetchData();
    } catch (err: any) {
      toast("Failed to delete student", "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-primary">Manage Students</h2>
          <p className="text-sm text-slate-500">Configure academic files, registration cards, and classes</p>
        </div>
        <button onClick={() => { reset(); setIsAddOpen(true); }} className="btn-primary">
          <Plus className="h-4 w-4" /> Add Student
        </button>
      </div>

      {/* Filter and search bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search name, email, roll number..." 
            className="input-field pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div>
          <select 
            className="input-field"
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
          >
            <option value="">All Classes</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>{cls.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Student listing */}
      {isLoading ? (
        <TableSkeleton />
      ) : students.length === 0 ? (
        <div className="card-base text-center py-12 flex flex-col items-center">
          <GraduationCap className="h-12 w-12 text-slate-300 mb-3" />
          <h3 className="font-semibold text-primary">No Students Found</h3>
          <p className="text-sm text-slate-400 mt-1">Enroll new students to display details here.</p>
        </div>
      ) : (
        <div className="card-base overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="table-th">Roll Number</th>
                <th className="table-th">Full Name</th>
                <th className="table-th">Email</th>
                <th className="table-th">Class</th>
                <th className="table-th">Department</th>
                <th className="table-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50/50">
                  <td className="table-td font-semibold text-slate-700">{student.roll_number}</td>
                  <td className="table-td text-primary font-medium">{student.user.full_name}</td>
                  <td className="table-td text-slate-500">{student.user.email}</td>
                  <td className="table-td text-slate-600">{student.class_?.name || 'Unassigned'}</td>
                  <td className="table-td text-slate-500">{student.department?.code}</td>
                  <td className="table-td">
                    <div className="flex gap-2">
                      <button onClick={() => handleEditClick(student)} className="btn-secondary p-1.5 shadow-none hover:bg-slate-100">
                        <Edit2 className="h-3.5 w-3.5 text-slate-500" />
                      </button>
                      <button onClick={() => handleDelete(student.id)} className="btn-secondary p-1.5 shadow-none hover:bg-red-50 hover:border-red-200">
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Student Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Enrol Student">
        <form onSubmit={handleSubmit(handleAddSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">FULL NAME</label>
              <input type="text" className="input-field" {...register('full_name')} />
              {errors.full_name && <p className="text-xs text-red-500 mt-1">{errors.full_name.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">EMAIL ADDRESS</label>
              <input type="email" className="input-field" {...register('email')} />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">PASSWORD</label>
              <input type="password" placeholder="••••••••" className="input-field" {...register('password')} />
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">PHONE NUMBER</label>
              <input type="text" className="input-field" {...register('phone')} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">ROLL NUMBER</label>
              <input type="text" className="input-field" {...register('roll_number')} />
              {errors.roll_number && <p className="text-xs text-red-500 mt-1">{errors.roll_number.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">REGISTRATION NUMBER</label>
              <input type="text" className="input-field" {...register('registration_number')} />
              {errors.registration_number && <p className="text-xs text-red-500 mt-1">{errors.registration_number.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">DEPARTMENT</label>
              <select className="input-field" {...register('department_id')}>
                <option value="">Select Department</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              {errors.department_id && <p className="text-xs text-red-500 mt-1">{errors.department_id.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">CLASS</label>
              <select className="input-field" {...register('class_id')}>
                <option value="">Select Class</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {errors.class_id && <p className="text-xs text-red-500 mt-1">{errors.class_id.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">ACADEMIC YEAR</label>
              <select className="input-field" {...register('academic_year_id')}>
                <option value="">Select Year</option>
                {academicYears.map(ay => <option key={ay.id} value={ay.id}>{ay.name}</option>)}
              </select>
              {errors.academic_year_id && <p className="text-xs text-red-500 mt-1">{errors.academic_year_id.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">SEMESTER</label>
              <select className="input-field" {...register('semester_id')}>
                <option value="">Select Semester</option>
                {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              {errors.semester_id && <p className="text-xs text-red-500 mt-1">{errors.semester_id.message}</p>}
            </div>
          </div>

          <div className="flex gap-2 justify-end border-t border-borderLight pt-4">
            <button type="button" onClick={() => setIsAddOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save Student</button>
          </div>
        </form>
      </Modal>

      {/* Edit Student Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Student Profile">
        <form onSubmit={handleSubmit(handleEditSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">FULL NAME</label>
              <input type="text" className="input-field" {...register('full_name')} />
              {errors.full_name && <p className="text-xs text-red-500 mt-1">{errors.full_name.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">EMAIL ADDRESS</label>
              <input type="email" className="input-field" {...register('email')} />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">PHONE NUMBER</label>
            <input type="text" className="input-field" {...register('phone')} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">ROLL NUMBER</label>
              <input type="text" className="input-field" {...register('roll_number')} />
              {errors.roll_number && <p className="text-xs text-red-500 mt-1">{errors.roll_number.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">REGISTRATION NUMBER</label>
              <input type="text" className="input-field" {...register('registration_number')} />
              {errors.registration_number && <p className="text-xs text-red-500 mt-1">{errors.registration_number.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">DEPARTMENT</label>
              <select className="input-field" {...register('department_id')}>
                <option value="">Select Department</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">CLASS</label>
              <select className="input-field" {...register('class_id')}>
                <option value="">Select Class</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">ACADEMIC YEAR</label>
              <select className="input-field" {...register('academic_year_id')}>
                <option value="">Select Year</option>
                {academicYears.map(ay => <option key={ay.id} value={ay.id}>{ay.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">SEMESTER</label>
              <select className="input-field" {...register('semester_id')}>
                <option value="">Select Semester</option>
                {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-2 justify-end border-t border-borderLight pt-4">
            <button type="button" onClick={() => setIsEditOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Update Profile</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default AdminStudents;
