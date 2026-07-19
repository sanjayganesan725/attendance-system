import React, { useEffect, useState } from 'react';
import { 
  Megaphone, 
  Plus, 
  Trash2, 
  Calendar, 
  User, 
  Clock, 
  Volume2, 
  Send,
  Loader2,
  Users
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import { Modal } from '../../components/Modal';

interface Announcement {
  id: string;
  title: string;
  content: string;
  target_role: string;
  created_at: string;
  author?: {
    full_name: string;
    role: string;
  };
}

export const DailyUpdates: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [updates, setUpdates] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Create update modal state
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetRole, setTargetRole] = useState('all');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdmin = user?.role === 'admin';

  const fetchUpdates = async () => {
    try {
      setIsLoading(true);
      const rolePrefix = user?.role || 'student';
      const endpoint = `/${rolePrefix}/announcements`;
      const response = await api.get(endpoint);
      setUpdates(response.data);
    } catch (err) {
      toast('Failed to load daily updates', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUpdates();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast('Please fill in all fields', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        title: title.trim(),
        content: content.trim(),
        target_role: targetRole
      };
      
      await api.post('/admin/announcements', payload);
      toast('Daily update posted successfully!', 'success');
      setIsOpen(false);
      setTitle('');
      setContent('');
      setTargetRole('all');
      fetchUpdates();
    } catch (err) {
      toast('Failed to post daily update', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this update?')) return;
    try {
      await api.delete(`/admin/announcements/${id}`);
      toast('Daily update deleted successfully', 'success');
      fetchUpdates();
    } catch (err) {
      toast('Failed to delete daily update', 'error');
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTargetBadgeColor = (role: string) => {
    switch (role) {
      case 'student': return 'bg-blue-50 text-blue-700 border-blue-150';
      case 'faculty': return 'bg-purple-50 text-purple-700 border-purple-150';
      default: return 'bg-emerald-50 text-emerald-700 border-emerald-150';
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header card with glassmorphism styling */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-primary text-white p-6 rounded-custom shadow-soft relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-6 opacity-10">
          <Volume2 className="h-64 w-64 text-white" />
        </div>
        <div className="flex items-center gap-4 z-10">
          <div className="h-12 w-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
            <Megaphone className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Department Activities & Updates</h2>
            <p className="text-slate-400 text-sm mt-0.5">
              Stay updated with daily announcements, schedules, and important information.
            </p>
          </div>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setIsOpen(true)}
            className="flex items-center justify-center gap-2 bg-white text-primary hover:bg-slate-100 transition-colors px-4 py-2.5 rounded-custom font-bold text-sm z-10 shadow-sm"
          >
            <Plus className="h-4 w-4" /> Post Daily Update
          </button>
        )}
      </div>

      {/* Main Feed Section */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="h-10 w-10 animate-spin mb-3 text-primary" />
            <p className="text-sm font-medium">Loading updates...</p>
          </div>
        ) : updates.length === 0 ? (
          <div className="card-base text-center py-16 text-slate-400">
            <Megaphone className="h-12 w-12 mx-auto mb-3 text-slate-200" />
            <p className="text-base font-semibold">No Updates Posted Yet</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              {isAdmin 
                ? 'Click the button above to post the first department update for students and staff.' 
                : 'Check back later for important department announcements.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {updates.map((update) => (
              <div 
                key={update.id} 
                className="card-base border border-slate-100 hover:border-slate-200 transition-all duration-300 hover:shadow-soft"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${getTargetBadgeColor(update.target_role)}`}>
                        {update.target_role === 'all' ? 'All Dept' : update.target_role === 'student' ? 'Students Only' : 'Staff Only'}
                      </span>
                      <div className="flex items-center text-xs text-slate-400 gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{formatDate(update.created_at)}</span>
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-bold text-primary tracking-tight">{update.title}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{update.content}</p>
                    
                    <div className="flex items-center gap-2 pt-2 text-xs text-slate-400 font-medium">
                      <div className="h-5 w-5 rounded-full bg-slate-100 flex items-center justify-center">
                        <User className="h-3 w-3 text-slate-500" />
                      </div>
                      <span>Posted by Admin</span>
                    </div>
                  </div>

                  {isAdmin && (
                    <button 
                      onClick={() => handleDelete(update.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Delete Update"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Admin Post Modal */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Post Daily Update">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Update Title</label>
            <input 
              type="text" 
              value={title} 
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Semester V Civil Engineering Lab Schedule Change"
              className="w-full px-3.5 py-2 border border-slate-200 rounded-custom focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Target Audience</label>
            <select 
              value={targetRole} 
              onChange={e => setTargetRole(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-custom focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm font-medium bg-white"
            >
              <option value="all">All Department (Students & Staff)</option>
              <option value="student">Students Only</option>
              <option value="faculty">Staff Only</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Detailed Content</label>
            <textarea 
              value={content} 
              onChange={e => setContent(e.target.value)}
              placeholder="Write the full update details here..."
              rows={5}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-custom focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm font-medium"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button 
              type="button" 
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-custom transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-primary hover:bg-blue-750 disabled:bg-blue-300 rounded-custom transition-all shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Posting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" /> Publish Update
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default DailyUpdates;
