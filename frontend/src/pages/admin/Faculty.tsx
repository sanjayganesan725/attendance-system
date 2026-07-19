import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  GraduationCap
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../components/Toast';
import { Modal } from '../../components/Modal';
import { TableSkeleton } from '../../components/Skeleton';

// Validation constraints
const facultySchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
  full_name: z.string().min(2, "Full name required"),
  phone: z.string().optional(),
  employee_id: z.string().min(1, "Employee ID required"),
  department_id: z.string().min(1, "Select department"),
  designation: z.string().min(1, "Designation required")
});

type FacultyFormValues = z.infer<typeof facultySchema>;

export const AdminFaculty: React.FC = () => {
  const { toast } = useToast();
  const [faculty, setFaculty] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState<any | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FacultyFormValues>({
    resolver: zodResolver(facultySchema)
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [resFac, resDept] = await Promise.all([
        api.get(`/admin/faculty?search=${search}&department_id=${filterDept}`),
        api.get('/admin/departments')
      ]);
      setFaculty(resFac.data);
      setDepartments(resDept.data);
    } catch (err: any) {
      toast("Error loading faculty details", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, filterDept]);

  const handleAddSubmit = async (data: FacultyFormValues) => {
    if (!data.password) {
      toast("Password is required for new faculty members", "error");
      return;
    }
    try {
      await api.post('/admin/faculty', data);
      toast("Faculty member added successfully!");
      setIsAddOpen(false);
      reset();
      fetchData();
    } catch (err: any) {
      toast(err.response?.data?.detail || "Failed to add faculty", "error");
    }
  };

  const handleEditClick = (fac: any) => {
    setSelectedFaculty(fac);
    setIsEditOpen(true);
    setValue('email', fac.user.email);
    setValue('full_name', fac.user.full_name);
    setValue('phone', fac.user.phone || '');
    setValue('employee_id', fac.employee_id);
    setValue('department_id', fac.department_id);
    setValue('designation', fac.designation);
  };

  const handleEditSubmit = async (data: FacultyFormValues) => {
    if (!selectedFaculty) return;
    try {
      const { password, ...updateBody } = data;
      await api.put(`/admin/faculty/${selectedFaculty.id}`, updateBody);
      toast("Faculty profile updated!");
      setIsEditOpen(false);
      reset();
      fetchData();
    } catch (err: any) {
      toast("Failed to update profile", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this faculty member? All their teaching assignments will be deleted.")) return;
    try {
      await api.delete(`/admin/faculty/${id}`);
      toast("Faculty member removed");
      fetchData();
    } catch (err: any) {
      toast("Failed to delete faculty member", "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-primary">Manage Faculty</h2>
          <p className="text-sm text-slate-500">Configure instructors, designations, and department heads</p>
        </div>
        <button onClick={() => { reset(); setIsAddOpen(true); }} className="btn-primary">
          <Plus className="h-4 w-4" /> Add Faculty
        </button>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search name, email, employee ID..." 
            className="input-field pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div>
          <select 
            className="input-field"
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
      </div>

      {/* Listings Table */}
      {isLoading ? (
        <TableSkeleton />
      ) : faculty.length === 0 ? (
        <div className="card-base text-center py-12 flex flex-col items-center">
          <GraduationCap className="h-12 w-12 text-slate-300 mb-3" />
          <h3 className="font-semibold text-primary">No Faculty Found</h3>
          <p className="text-sm text-slate-400 mt-1">Create faculty members to assign teaching schedules.</p>
        </div>
      ) : (
        <div className="card-base overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="table-th">Employee ID</th>
                <th className="table-th">Full Name</th>
                <th className="table-th">Email</th>
                <th className="table-th">Designation</th>
                <th className="table-th">Department</th>
                <th className="table-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {faculty.map((fac) => (
                <tr key={fac.id} className="hover:bg-slate-50/50">
                  <td className="table-td font-semibold text-slate-700">{fac.employee_id}</td>
                  <td className="table-td text-primary font-medium">{fac.user.full_name}</td>
                  <td className="table-td text-slate-500">{fac.user.email}</td>
                  <td className="table-td text-slate-600">{fac.designation}</td>
                  <td className="table-td text-slate-500">{fac.department.name}</td>
                  <td className="table-td">
                    <div className="flex gap-2">
                      <button onClick={() => handleEditClick(fac)} className="btn-secondary p-1.5 shadow-none hover:bg-slate-100">
                        <Edit2 className="h-3.5 w-3.5 text-slate-500" />
                      </button>
                      <button onClick={() => handleDelete(fac.id)} className="btn-secondary p-1.5 shadow-none hover:bg-red-50 hover:border-red-200">
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

      {/* Add Faculty Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Faculty Member">
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
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">EMPLOYEE ID</label>
              <input type="text" className="input-field" {...register('employee_id')} />
              {errors.employee_id && <p className="text-xs text-red-500 mt-1">{errors.employee_id.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">DESIGNATION</label>
              <input type="text" placeholder="e.g. Assistant Professor" className="input-field" {...register('designation')} />
              {errors.designation && <p className="text-xs text-red-500 mt-1">{errors.designation.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">DEPARTMENT</label>
            <select className="input-field" {...register('department_id')}>
              <option value="">Select Department</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            {errors.department_id && <p className="text-xs text-red-500 mt-1">{errors.department_id.message}</p>}
          </div>

          <div className="flex gap-2 justify-end border-t border-borderLight pt-4">
            <button type="button" onClick={() => setIsAddOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Add Faculty</button>
          </div>
        </form>
      </Modal>

      {/* Edit Faculty Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Faculty Profile">
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
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">EMPLOYEE ID</label>
              <input type="text" className="input-field" {...register('employee_id')} />
              {errors.employee_id && <p className="text-xs text-red-500 mt-1">{errors.employee_id.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">DESIGNATION</label>
              <input type="text" className="input-field" {...register('designation')} />
              {errors.designation && <p className="text-xs text-red-500 mt-1">{errors.designation.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">DEPARTMENT</label>
            <select className="input-field" {...register('department_id')}>
              <option value="">Select Department</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
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
export default AdminFaculty;
