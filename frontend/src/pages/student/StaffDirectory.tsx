import React, { useEffect, useState } from 'react';
import { Mail, Phone, Search, Users, GraduationCap, Award, BookOpen, Calendar, ExternalLink } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../components/Toast';
import { Modal } from '../../components/Modal';
import { useAuth } from '../../context/AuthContext';

interface StaffUser {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  profile_picture_url: string | null;
  is_active: boolean;
}

interface StaffData {
  id: string;
  employee_id: string;
  designation: string;
  specialization: string | null;
  user: StaffUser;
  department: {
    id: string;
    name: string;
    code: string;
  };
}

interface Subject {
  id: string;
  name: string;
  code: string;
  credits: number;
}

interface Class {
  id: string;
  name: string;
}

interface FacultyAssignment {
  id: string;
  subject: Subject;
  class_: Class;
}

interface FacultyProfileDetail {
  id: string;
  employee_id: string;
  designation: string;
  specialization: string | null;
  department: {
    id: string;
    name: string;
    code: string;
    description: string | null;
  };
  user: StaffUser;
  subject_assignments: FacultyAssignment[];
}

export const StudentStaffDirectory: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [staffList, setStaffList] = useState<StaffData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Detailed profile state
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [detailedStaff, setDetailedStaff] = useState<FacultyProfileDetail | null>(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);

  const fetchStaff = async () => {
    setIsLoading(true);
    try {
      const role = user?.role || 'student';
      const response = await api.get(`/${role}/staff-directory`);
      setStaffList(response.data);
    } catch (err) {
      toast("Error fetching staff directory details", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStaffDetails = async (id: string) => {
    setIsDetailsLoading(true);
    try {
      const role = user?.role || 'student';
      const response = await api.get(`/${role}/staff-directory/${id}`);
      setDetailedStaff(response.data);
    } catch (err) {
      toast("Error fetching detailed staff profile", "error");
      setSelectedStaffId(null);
    } finally {
      setIsDetailsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleCardClick = (id: string) => {
    setSelectedStaffId(id);
    fetchStaffDetails(id);
  };

  const handleCloseModal = () => {
    setSelectedStaffId(null);
    setDetailedStaff(null);
  };

  // Filter staff by search query
  const filteredStaff = staffList.filter((staff) => {
    const query = searchQuery.toLowerCase();
    const nameMatch = staff.user.full_name.toLowerCase().includes(query);
    const desMatch = staff.designation.toLowerCase().includes(query);
    const specMatch = staff.specialization?.toLowerCase().includes(query) || false;
    return nameMatch || desMatch || specMatch;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Department Faculty Profiles</h2>
          <p className="text-sm text-slate-500">Meet and contact the academic and administrative staff of your department</p>
        </div>
        
        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by name, specialization..." 
            className="input-field pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Faculty Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="card-base animate-pulse h-64 bg-slate-50/50" />
          ))}
        </div>
      ) : filteredStaff.length === 0 ? (
        <div className="card-base text-center py-12 flex flex-col items-center">
          <Users className="h-12 w-12 text-slate-300 mb-3" />
          <h4 className="font-semibold text-slate-900">No Staff Found</h4>
          <p className="text-sm text-slate-400 mt-1">No faculty profiles matched your search parameters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStaff.map((staff) => (
            <div 
              key={staff.id} 
              onClick={() => handleCardClick(staff.id)}
              className="card-base flex flex-col justify-between overflow-hidden border border-slate-100 hover:border-indigo-200 hover:shadow-md cursor-pointer transition-all duration-300 group"
            >
              {/* Profile Card Top */}
              <div className="p-6 space-y-4">
                <div className="flex gap-4 items-start">
                  {/* Photo Container */}
                  <div className="relative h-20 w-20 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shrink-0 shadow-inner">
                    {staff.user.profile_picture_url ? (
                      <img 
                        src={staff.user.profile_picture_url} 
                        alt={staff.user.full_name} 
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150';
                        }}
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-indigo-50 text-indigo-500 font-bold text-xl uppercase">
                        {staff.user.full_name.charAt(0)}
                      </div>
                    )}
                  </div>
                  
                  {/* Title details */}
                  <div className="space-y-1 min-w-0">
                    <h3 className="font-bold text-slate-800 text-base leading-snug group-hover:text-indigo-600 transition-colors truncate">
                      {staff.user.full_name}
                    </h3>
                    <div className="flex items-center gap-1 text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                      <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{staff.designation}</span>
                    </div>
                    <div className="text-xs text-slate-400">
                      ID: {staff.employee_id}
                    </div>
                  </div>
                </div>

                {/* Specialization Details */}
                {staff.specialization && (
                  <div className="pt-2">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Award className="h-3.5 w-3.5 text-slate-400" />
                      Specialization
                    </h4>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed bg-slate-50/50 p-2.5 rounded-xl border border-slate-100/50 line-clamp-2">
                      {staff.specialization}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Contact Bar */}
              <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between gap-4 mt-auto">
                <span className="text-[11px] font-semibold text-indigo-600 group-hover:underline flex items-center gap-1">
                  View Profile <ExternalLink className="h-3 w-3" />
                </span>
                
                <span className="text-xs font-medium text-slate-400 truncate max-w-[150px]">
                  {staff.user.email}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detailed Profile Modal */}
      <Modal 
        isOpen={selectedStaffId !== null} 
        onClose={handleCloseModal} 
        title={detailedStaff ? "Faculty Profile Details" : "Loading profile..."}
      >
        {isDetailsLoading || !detailedStaff ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <div className="h-10 w-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            <span className="text-sm font-medium text-slate-500">Retrieving academic profile data...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header info */}
            <div className="flex gap-5 items-center pb-6 border-b border-slate-100">
              <div className="h-24 w-24 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shadow-sm shrink-0">
                {detailedStaff.user.profile_picture_url ? (
                  <img 
                    src={detailedStaff.user.profile_picture_url} 
                    alt={detailedStaff.user.full_name} 
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150';
                    }}
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-indigo-50 text-indigo-500 font-bold text-2xl uppercase">
                    {detailedStaff.user.full_name.charAt(0)}
                  </div>
                )}
              </div>
              
              <div className="space-y-1.5 min-w-0">
                <h3 className="text-xl font-bold text-slate-900 leading-snug">{detailedStaff.user.full_name}</h3>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-600">
                  <GraduationCap className="h-3.5 w-3.5" />
                  {detailedStaff.designation}
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  Employee ID: <span className="font-semibold text-slate-700">{detailedStaff.employee_id}</span>
                </div>
              </div>
            </div>

            {/* Profile specifications */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Department</span>
                <div className="text-sm font-medium text-slate-800 bg-slate-50/50 px-3.5 py-2.5 rounded-xl border border-slate-100/50">
                  {detailedStaff.department.name} ({detailedStaff.department.code})
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</span>
                <div className="text-sm font-semibold text-emerald-600 bg-emerald-50/50 px-3.5 py-2.5 rounded-xl border border-emerald-100/50 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Active Faculty Member
                </div>
              </div>
            </div>

            {/* Specialization */}
            {detailedStaff.specialization && (
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-indigo-500" />
                  Specialization & Research Focus
                </span>
                <div className="text-sm font-medium text-slate-700 leading-relaxed bg-slate-50/50 px-3.5 py-3 rounded-xl border border-slate-100/50">
                  {detailedStaff.specialization}
                </div>
              </div>
            )}

            {/* Contact Details */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contact Channels</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a 
                  href={`mailto:${detailedStaff.user.email}`} 
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/20 hover:bg-slate-50 hover:border-indigo-100 hover:shadow-xs transition-all duration-300"
                >
                  <Mail className="h-4.5 w-4.5 text-indigo-500" />
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">E-mail Address</div>
                    <div className="text-xs font-semibold text-slate-700 truncate">{detailedStaff.user.email}</div>
                  </div>
                </a>

                {detailedStaff.user.phone ? (
                  <a 
                    href={`tel:${detailedStaff.user.phone}`} 
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/20 hover:bg-slate-50 hover:border-indigo-100 hover:shadow-xs transition-all duration-300"
                  >
                    <Phone className="h-4.5 w-4.5 text-emerald-500" />
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Mobile Number</div>
                      <div className="text-xs font-semibold text-slate-700">{detailedStaff.user.phone}</div>
                    </div>
                  </a>
                ) : (
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/10">
                    <Phone className="h-4.5 w-4.5 text-slate-300" />
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Mobile Number</div>
                      <div className="text-xs font-medium text-slate-400">Not provided</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Teaching Assignments (Workload) */}
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-indigo-500" />
                Academic Workload & Assignments
              </h4>
              
              {detailedStaff.subject_assignments.length === 0 ? (
                <div className="text-center p-6 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs font-medium">
                  No active subjects or class assignments found for this academic period.
                </div>
              ) : (
                <div className="overflow-hidden border border-slate-100 rounded-xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="px-4 py-2.5">Subject</th>
                        <th className="px-4 py-2.5">Class / Target</th>
                        <th className="px-4 py-2.5 text-right">Credits</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                      {detailedStaff.subject_assignments.map((assignment) => (
                        <tr key={assignment.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-800">{assignment.subject.name}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{assignment.subject.code}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold text-[10px] uppercase">
                              <Calendar className="h-3 w-3" />
                              {assignment.class_.name}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-slate-500 font-semibold">
                            {assignment.subject.credits.toFixed(1)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
