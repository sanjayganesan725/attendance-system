import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Trash2, Library, BookOpen, UserCheck, Layers } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../components/Toast';
import { Modal } from '../../components/Modal';
import { TableSkeleton } from '../../components/Skeleton';

// Validation schemas
const deptSchema = z.object({
  name: z.string().min(2, "Name must be 2+ chars"),
  code: z.string().min(2, "Code must be 2+ chars"),
  description: z.string().optional()
});

const classSchema = z.object({
  name: z.string().min(2, "Name must be 2+ chars"),
  department_id: z.string().min(1, "Select department"),
  semester_id: z.string().min(1, "Select semester"),
  academic_year_id: z.string().min(1, "Select academic year")
});

const subjectSchema = z.object({
  name: z.string().min(2, "Name must be 2+ chars"),
  code: z.string().min(2, "Code must be 2+ chars"),
  department_id: z.string().min(1, "Select department")
});

const assignSchema = z.object({
  faculty_id: z.string().min(1, "Select faculty"),
  subject_id: z.string().min(1, "Select subject"),
  class_id: z.string().min(1, "Select class")
});

export const AdminAcademic: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'depts' | 'classes' | 'subjects' | 'assigns'>('depts');
  const [isLoading, setIsLoading] = useState(true);

  // States
  const [depts, setDepts] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [assigns, setAssigns] = useState<any[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);

  // Modals
  const [isOpen, setIsOpen] = useState(false);

  const fetchTabDetails = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'depts') {
        const res = await api.get('/admin/departments');
        setDepts(res.data);
      } else if (activeTab === 'classes') {
        const [resCls, resDept, resSem, resAY] = await Promise.all([
          api.get('/admin/classes'),
          api.get('/admin/departments'),
          api.get('/admin/semesters'),
          api.get('/admin/academic-years')
        ]);
        setClasses(resCls.data);
        setDepts(resDept.data);
        setSemesters(resSem.data);
        setAcademicYears(resAY.data);
      } else if (activeTab === 'subjects') {
        const [resSub, resDept] = await Promise.all([
          api.get('/admin/subjects'),
          api.get('/admin/departments')
        ]);
        setSubjects(resSub.data);
        setDepts(resDept.data);
      } else if (activeTab === 'assigns') {
        const [resAssign, resFac, resSub, resCls] = await Promise.all([
          api.get('/admin/assignments'),
          api.get('/admin/faculty'),
          api.get('/admin/subjects'),
          api.get('/admin/classes')
        ]);
        setAssigns(resAssign.data);
        setFaculties(resFac.data);
        setSubjects(resSub.data);
        setClasses(resCls.data);
      }
    } catch (err) {
      toast("Failed to load records", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTabDetails();
  }, [activeTab]);

  // Forms
  const { register: regDept, handleSubmit: subDept, reset: resDept, formState: { errors: errDept } } = useForm<z.infer<typeof deptSchema>>({ resolver: zodResolver(deptSchema) });
  const { register: regCls, handleSubmit: subCls, reset: resCls, formState: { errors: errCls } } = useForm<z.infer<typeof classSchema>>({ resolver: zodResolver(classSchema) });
  const { register: regSub, handleSubmit: subSub, reset: resSub, formState: { errors: errSub } } = useForm<z.infer<typeof subjectSchema>>({ resolver: zodResolver(subjectSchema) });
  const { register: regAsg, handleSubmit: subAsg, reset: resAsg, formState: { errors: errAsg } } = useForm<z.infer<typeof assignSchema>>({ resolver: zodResolver(assignSchema) });

  const onDeptSubmit = async (data: any) => {
    try {
      await api.post('/admin/departments', data);
      toast("Department created!");
      setIsOpen(false);
      resDept();
      fetchTabDetails();
    } catch (err: any) {
      toast(err.response?.data?.detail || "Error creating department", "error");
    }
  };

  const onClassSubmit = async (data: any) => {
    try {
      await api.post('/admin/classes', data);
      toast("Class created!");
      setIsOpen(false);
      resCls();
      fetchTabDetails();
    } catch (err: any) {
      toast(err.response?.data?.detail || "Error creating class", "error");
    }
  };

  const onSubjectSubmit = async (data: any) => {
    try {
      await api.post('/admin/subjects', data);
      toast("Subject created!");
      setIsOpen(false);
      resSub();
      fetchTabDetails();
    } catch (err: any) {
      toast(err.response?.data?.detail || "Error creating subject", "error");
    }
  };

  const onAssignSubmit = async (data: any) => {
    try {
      await api.post('/admin/assignments', data);
      toast("Faculty assigned successfully!");
      setIsOpen(false);
      resAsg();
      fetchTabDetails();
    } catch (err: any) {
      toast(err.response?.data?.detail || "Error assigning subject", "error");
    }
  };

  const handleDelete = async (endpoint: string, id: string) => {
    if (!confirm("Are you sure? This delete operation might affect linked profiles.")) return;
    try {
      await api.delete(`/admin/${endpoint}/${id}`);
      toast("Item removed successfully");
      fetchTabDetails();
    } catch (err) {
      toast("Failed to delete record", "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-primary">Academic Setup</h2>
          <p className="text-sm text-slate-500">Manage departments, classes, syllabus and teach workloads</p>
        </div>
        <button onClick={() => setIsOpen(true)} className="btn-primary">
          <Plus className="h-4 w-4" /> Add New
        </button>
      </div>

      {/* Tabs selectors */}
      <div className="border-b border-borderLight flex gap-2 overflow-x-auto">
        <button 
          onClick={() => { setActiveTab('depts'); }}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 text-sm font-medium transition-all ${
            activeTab === 'depts' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="h-4 w-4" /> Departments
        </button>
        <button 
          onClick={() => { setActiveTab('classes'); }}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 text-sm font-medium transition-all ${
            activeTab === 'classes' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="h-4 w-4" /> Classes
        </button>
        <button 
          onClick={() => { setActiveTab('subjects'); }}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 text-sm font-medium transition-all ${
            activeTab === 'subjects' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Library className="h-4 w-4" /> Subjects
        </button>
        <button 
          onClick={() => { setActiveTab('assigns'); }}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 text-sm font-medium transition-all ${
            activeTab === 'assigns' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserCheck className="h-4 w-4" /> Faculty Workloads
        </button>
      </div>

      {/* Tab Contents */}
      {isLoading ? (
        <TableSkeleton />
      ) : (
        <div className="card-base overflow-x-auto">
          {activeTab === 'depts' && (
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="table-th">Dept Code</th>
                  <th className="table-th">Department Name</th>
                  <th className="table-th">Description</th>
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {depts.map(d => (
                  <tr key={d.id} className="hover:bg-slate-50/50">
                    <td className="table-td font-semibold text-slate-700">{d.code}</td>
                    <td className="table-td text-primary font-medium">{d.name}</td>
                    <td className="table-td text-slate-500">{d.description || 'N/A'}</td>
                    <td className="table-td">
                      <button onClick={() => handleDelete('departments', d.id)} className="btn-secondary p-1.5 shadow-none hover:bg-red-50 hover:border-red-200">
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'classes' && (
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="table-th">Class Name</th>
                  <th className="table-th">Department</th>
                  <th className="table-th">Semester</th>
                  <th className="table-th">Academic Year</th>
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {classes.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/50">
                    <td className="table-td font-semibold text-slate-700">{c.name}</td>
                    <td className="table-td text-slate-600">{c.department?.name}</td>
                    <td className="table-td text-slate-500">{c.semester?.name}</td>
                    <td className="table-td text-slate-500">{c.academic_year?.name}</td>
                    <td className="table-td">
                      <button onClick={() => handleDelete('classes', c.id)} className="btn-secondary p-1.5 shadow-none hover:bg-red-50 hover:border-red-200">
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'subjects' && (
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="table-th">Subject Code</th>
                  <th className="table-th">Subject Name</th>
                  <th className="table-th">Department</th>
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/50">
                    <td className="table-td font-semibold text-slate-700">{s.code}</td>
                    <td className="table-td text-primary font-medium">{s.name}</td>
                    <td className="table-td text-slate-600">{depts.find(d => d.id === s.department_id)?.name || 'N/A'}</td>
                    <td className="table-td">
                      <button onClick={() => handleDelete('subjects', s.id)} className="btn-secondary p-1.5 shadow-none hover:bg-red-50 hover:border-red-200">
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'assigns' && (
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="table-th">Class Name</th>
                  <th className="table-th">Subject</th>
                  <th className="table-th">Assigned Faculty</th>
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assigns.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50/50">
                    <td className="table-td font-semibold text-slate-700">{a.class_?.name}</td>
                    <td className="table-td text-primary font-medium">{a.subject?.name} ({a.subject?.code})</td>
                    <td className="table-td text-slate-600">{a.faculty?.user?.full_name}</td>
                    <td className="table-td">
                      <button onClick={() => handleDelete('assignments', a.id)} className="btn-secondary p-1.5 shadow-none hover:bg-red-50 hover:border-red-200">
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Dynamic Action Modals */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={`Create New ${activeTab === 'depts' ? 'Department' : activeTab === 'classes' ? 'Class' : activeTab === 'subjects' ? 'Subject' : 'Faculty Workload'}`}>
        {activeTab === 'depts' && (
          <form onSubmit={subDept(onDeptSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">DEPARTMENT NAME</label>
              <input type="text" className="input-field" {...regDept('name')} />
              {errDept.name && <p className="text-xs text-red-500 mt-1">{errDept.name.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">CODE</label>
              <input type="text" placeholder="e.g. CSE" className="input-field" {...regDept('code')} />
              {errDept.code && <p className="text-xs text-red-500 mt-1">{errDept.code.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">DESCRIPTION</label>
              <textarea className="input-field" rows={3} {...regDept('description')} />
            </div>
            <div className="flex gap-2 justify-end border-t border-borderLight pt-4">
              <button type="button" onClick={() => setIsOpen(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">Save Department</button>
            </div>
          </form>
        )}

        {activeTab === 'classes' && (
          <form onSubmit={subCls(onClassSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">CLASS NAME</label>
              <input type="text" placeholder="e.g. CSE Section A" className="input-field" {...regCls('name')} />
              {errCls.name && <p className="text-xs text-red-500 mt-1">{errCls.name.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">DEPARTMENT</label>
              <select className="input-field" {...regCls('department_id')}>
                <option value="">Select Dept</option>
                {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              {errCls.department_id && <p className="text-xs text-red-500 mt-1">{errCls.department_id.message}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">ACADEMIC YEAR</label>
                <select className="input-field" {...regCls('academic_year_id')}>
                  <option value="">Select Year</option>
                  {academicYears.map(ay => <option key={ay.id} value={ay.id}>{ay.name}</option>)}
                </select>
                {errCls.academic_year_id && <p className="text-xs text-red-500 mt-1">{errCls.academic_year_id.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">SEMESTER</label>
                <select className="input-field" {...regCls('semester_id')}>
                  <option value="">Select Semester</option>
                  {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                {errCls.semester_id && <p className="text-xs text-red-500 mt-1">{errCls.semester_id.message}</p>}
              </div>
            </div>
            <div className="flex gap-2 justify-end border-t border-borderLight pt-4">
              <button type="button" onClick={() => setIsOpen(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">Save Class</button>
            </div>
          </form>
        )}

        {activeTab === 'subjects' && (
          <form onSubmit={subSub(onSubjectSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">SUBJECT NAME</label>
              <input type="text" className="input-field" {...regSub('name')} />
              {errSub.name && <p className="text-xs text-red-500 mt-1">{errSub.name.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">SUBJECT CODE</label>
              <input type="text" placeholder="e.g. CS101" className="input-field" {...regSub('code')} />
              {errSub.code && <p className="text-xs text-red-500 mt-1">{errSub.code.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">DEPARTMENT</label>
              <select className="input-field" {...regSub('department_id')}>
                <option value="">Select Dept</option>
                {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              {errSub.department_id && <p className="text-xs text-red-500 mt-1">{errSub.department_id.message}</p>}
            </div>
            <div className="flex gap-2 justify-end border-t border-borderLight pt-4">
              <button type="button" onClick={() => setIsOpen(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">Save Subject</button>
            </div>
          </form>
        )}

        {activeTab === 'assigns' && (
          <form onSubmit={subAsg(onAssignSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">FACULTY MEMBER</label>
              <select className="input-field" {...regAsg('faculty_id')}>
                <option value="">Select Faculty</option>
                {faculties.map(f => <option key={f.id} value={f.id}>{f.user.full_name} ({f.employee_id})</option>)}
              </select>
              {errAsg.faculty_id && <p className="text-xs text-red-500 mt-1">{errAsg.faculty_id.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">SUBJECT</label>
              <select className="input-field" {...regAsg('subject_id')}>
                <option value="">Select Subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
              </select>
              {errAsg.subject_id && <p className="text-xs text-red-500 mt-1">{errAsg.subject_id.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">CLASS</label>
              <select className="input-field" {...regAsg('class_id')}>
                <option value="">Select Class</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {errAsg.class_id && <p className="text-xs text-red-500 mt-1">{errAsg.class_id.message}</p>}
            </div>
            <div className="flex gap-2 justify-end border-t border-borderLight pt-4">
              <button type="button" onClick={() => setIsOpen(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">Assign Workload</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
export default AdminAcademic;
