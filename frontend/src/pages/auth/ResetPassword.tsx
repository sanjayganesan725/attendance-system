import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useToast } from '../../components/Toast';
import api from '../../services/api';

const resetPasswordSchema = z.object({
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ResetFormValues = z.infer<typeof resetPasswordSchema>;

export const ResetPassword: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const token = searchParams.get('token');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetFormValues) => {
    if (!token) {
      toast("Invalid recovery token.", "error");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await api.post('/auth/reset-password', {
        token,
        new_password: data.password
      });
      
      toast("Password reset successful! Please log in.");
      navigate('/login');
    } catch (error: any) {
      const msg = error.response?.data?.detail || "Token expired or invalid.";
      toast(msg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <h3 className="text-lg font-semibold text-primary">Invalid Link</h3>
        <p className="text-sm text-slate-500">This password reset link is invalid or has expired.</p>
        <Link to="/login" className="btn-primary w-full">
          Back to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-primary">New Password</h3>
        <p className="text-sm text-slate-500 mt-1">Set a secure password for your account</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
            New Password
          </label>
          <input
            type="password"
            placeholder="••••••••"
            className={`input-field ${errors.password ? 'border-red-300' : ''}`}
            {...register('password')}
          />
          {errors.password && (
            <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
            Confirm Password
          </label>
          <input
            type="password"
            placeholder="••••••••"
            className={`input-field ${errors.confirmPassword ? 'border-red-300' : ''}`}
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full py-2.5"
        >
          {isSubmitting ? "Updating..." : "Update Password"}
        </button>
      </form>
    </div>
  );
};
export default ResetPassword;
