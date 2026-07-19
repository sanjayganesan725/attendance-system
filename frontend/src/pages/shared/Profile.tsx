import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Camera, Lock, User, Loader2 } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';

// Schemas
const profileSchema = z.object({
  full_name: z.string().min(2, "Full name required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional()
});

const passwordSchema = z.object({
  old_password: z.string().min(1, "Old password required"),
  new_password: z.string().min(6, "New password must be 6+ characters"),
  confirm_password: z.string()
}).refine(data => data.new_password === data.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"]
});

export const SharedProfile: React.FC = () => {
  const { user, updateUserSession } = useAuth();
  const { toast } = useToast();
  
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const { register: regProf, handleSubmit: subProf, setValue: setProfVal, formState: { errors: errProf } } = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema)
  });

  const { register: regPass, handleSubmit: subPass, reset: resPass, formState: { errors: errPass } } = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema)
  });

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const response = await api.get('/auth/me');
        const data = response.data;
        setProfVal('full_name', data.full_name);
        setProfVal('email', data.email);
        setProfVal('phone', data.phone || '');
        if (data.profile_picture_url) {
          setProfilePic(data.profile_picture_url);
        }
      } catch (err) {
        toast("Failed to load user profile", "error");
      }
    };
    fetchMe();
  }, [setProfVal, toast]);

  const onProfileSubmit = async (data: any) => {
    setIsUpdatingProfile(true);
    try {
      const response = await api.put('/auth/profile', data);
      updateUserSession({
        name: response.data.full_name,
        email: response.data.email
      });
      toast("Profile updated successfully!");
    } catch (err: any) {
      toast(err.response?.data?.detail || "Failed to update profile", "error");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const onPasswordSubmit = async (data: any) => {
    setIsUpdatingPassword(true);
    try {
      await api.post('/auth/change-password', {
        old_password: data.old_password,
        new_password: data.new_password
      });
      toast("Password changed successfully!");
      resPass();
    } catch (err: any) {
      toast(err.response?.data?.detail || "Failed to change password", "error");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    try {
      const response = await api.post('/auth/profile/picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      const url = response.data.profile_picture_url;
      setProfilePic(url);
      updateUserSession({ profile_picture_url: url });
      toast("Profile picture uploaded successfully!");
    } catch (err: any) {
      toast(err.response?.data?.detail || "Failed to upload image", "error");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-primary">Profile Settings</h2>
        <p className="text-sm text-slate-500">Manage account credentials, profile photo, and phone details</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left column: Avatar upload */}
        <div className="card-base flex flex-col items-center text-center justify-center border-slate-200">
          <div className="relative group cursor-pointer mb-4">
            <div className="h-28 w-28 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center font-bold text-slate-400 overflow-hidden relative">
              {profilePic ? (
                <img src={profilePic} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <User className="h-10 w-10 text-slate-300" />
              )}
              {isUploading && (
                <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center text-white">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              )}
            </div>
            <label className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full hover:bg-slate-800 transition-colors shadow-sm cursor-pointer">
              <Camera className="h-4 w-4" />
              <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={isUploading} />
            </label>
          </div>
          <h3 className="font-semibold text-primary">{user?.name}</h3>
          <p className="text-xs text-slate-400 uppercase tracking-wider mt-1">{user?.role}</p>
        </div>

        {/* Right Columns: Forms */}
        <div className="md:col-span-2 space-y-8">
          {/* Form 1: Details */}
          <div className="card-base border-slate-200">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 border-b border-borderLight pb-3 mb-4">Personal Details</h3>
            <form onSubmit={subProf(onProfileSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Full Name</label>
                  <input type="text" className="input-field" {...regProf('full_name')} />
                  {errProf.full_name && <p className="text-xs text-red-500 mt-1">{errProf.full_name.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Email Address</label>
                  <input type="email" className="input-field" {...regProf('email')} />
                  {errProf.email && <p className="text-xs text-red-500 mt-1">{errProf.email.message}</p>}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Phone Number</label>
                <input type="text" className="input-field" {...regProf('phone')} />
              </div>
              <div className="flex justify-end pt-2">
                <button type="submit" disabled={isUpdatingProfile} className="btn-primary">
                  {isUpdatingProfile ? "Updating Details..." : "Save Details"}
                </button>
              </div>
            </form>
          </div>

          {/* Form 2: Password */}
          <div className="card-base border-slate-200">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 border-b border-borderLight pb-3 mb-4">Change Password</h3>
            <form onSubmit={subPass(onPasswordSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Current Password</label>
                <input type="password" placeholder="••••••••" className="input-field" {...regPass('old_password')} />
                {errPass.old_password && <p className="text-xs text-red-500 mt-1">{errPass.old_password.message}</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">New Password</label>
                  <input type="password" placeholder="••••••••" className="input-field" {...regPass('new_password')} />
                  {errPass.new_password && <p className="text-xs text-red-500 mt-1">{errPass.new_password.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Confirm New Password</label>
                  <input type="password" placeholder="••••••••" className="input-field" {...regPass('confirm_password')} />
                  {errPass.confirm_password && <p className="text-xs text-red-500 mt-1">{errPass.confirm_password.message}</p>}
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button type="submit" disabled={isUpdatingPassword} className="btn-primary">
                  {isUpdatingPassword ? "Updating Password..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
};
export default SharedProfile;
