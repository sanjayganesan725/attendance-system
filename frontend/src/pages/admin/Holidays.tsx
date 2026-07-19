import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Trash2, Calendar } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../components/Toast';
import { Modal } from '../../components/Modal';
import { Skeleton } from '../../components/Skeleton';

const holidaySchema = z.object({
  name: z.string().min(2, "Holiday name required"),
  date: z.string().min(1, "Date selection required"),
  description: z.string().optional()
});

type HolidayFormValues = z.infer<typeof holidaySchema>;

export const AdminHolidays: React.FC = () => {
  const { toast } = useToast();
  const [holidays, setHolidays] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<HolidayFormValues>({
    resolver: zodResolver(holidaySchema)
  });

  const fetchHolidays = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/admin/holidays');
      setHolidays(response.data);
    } catch (err) {
      toast("Error fetching holidays schedule", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  const onSubmit = async (data: HolidayFormValues) => {
    try {
      await api.post('/admin/holidays', data);
      toast("Holiday added successfully!");
      setIsOpen(false);
      reset();
      fetchHolidays();
    } catch (err: any) {
      toast(err.response?.data?.detail || "Failed to save holiday", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this holiday?")) return;
    try {
      await api.delete(`/admin/holidays/${id}`);
      toast("Holiday removed");
      fetchHolidays();
    } catch (err) {
      toast("Failed to delete holiday", "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-primary">Calendar & Holidays</h2>
          <p className="text-sm text-slate-500">Configure academic calendar events, vacations, and non-working days</p>
        </div>
        <button onClick={() => { reset(); setIsOpen(true); }} className="btn-primary">
          <Plus className="h-4 w-4" /> Add Holiday
        </button>
      </div>

      {/* Main listings */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(n => <Skeleton key={n} className="h-16 w-full" />)}
        </div>
      ) : holidays.length === 0 ? (
        <div className="card-base text-center py-12 flex flex-col items-center">
          <Calendar className="h-12 w-12 text-slate-300 mb-3" />
          <h3 className="font-semibold text-primary">No Holidays Declared</h3>
          <p className="text-sm text-slate-400 mt-1">Configure calendar dates to exempt attendance requirements.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {holidays.map((h) => (
            <div key={h.id} className="card-base flex items-center justify-between border-slate-200">
              <div className="flex items-center gap-4">
                <div className="bg-slate-100 text-slate-600 h-10 w-10 rounded-custom flex flex-col items-center justify-center font-bold">
                  <span className="text-[10px] uppercase leading-none">
                    {new Date(h.date).toLocaleString('default', { month: 'short' })}
                  </span>
                  <span className="text-base leading-none mt-1">
                    {new Date(h.date).getDate()}
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold text-primary text-sm">{h.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{h.description || 'No description'}</p>
                </div>
              </div>
              <button onClick={() => handleDelete(h.id)} className="btn-secondary p-1.5 shadow-none hover:bg-red-50 hover:border-red-200">
                <Trash2 className="h-3.5 w-3.5 text-red-500" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Holiday Modal */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Declare Holiday">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">HOLIDAY TITLE</label>
            <input type="text" placeholder="e.g. New Year Holiday" className="input-field" {...register('name')} />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">DATE</label>
            <input type="date" className="input-field" {...register('date')} />
            {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">DESCRIPTION</label>
            <textarea placeholder="Exemption reason or notes" className="input-field" rows={3} {...register('description')} />
          </div>

          <div className="flex gap-2 justify-end border-t border-borderLight pt-4">
            <button type="button" onClick={() => setIsOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save Holiday</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default AdminHolidays;
