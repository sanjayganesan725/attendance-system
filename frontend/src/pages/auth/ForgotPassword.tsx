import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link } from 'react-router-dom';
import { useToast } from '../../components/Toast';
import api from '../../services/api';

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
});

type ForgotFormValues = z.infer<typeof forgotPasswordSchema>;

export const ForgotPassword: React.FC = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotFormValues) => {
    setIsSubmitting(true);
    try {
      await api.post('/auth/forgot-password', data);
      setIsSent(true);
      toast("Password reset instructions have been logged to backend console!");
    } catch (error: any) {
      toast("Could not process request. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-primary">Reset Password</h3>
        <p className="text-sm text-slate-500 mt-1">Enter your email and we'll send you recovery details</p>
      </div>

      {isSent ? (
        <div className="space-y-4 text-center">
          <div className="bg-slate-50 border border-borderLight rounded-custom p-4 text-sm text-slate-700 leading-relaxed">
            📧 An email has been sent to you. Check the <b>FastAPI server console logs</b> to retrieve the reset link.
          </div>
          <Link to="/login" className="btn-secondary w-full">
            Return to Sign In
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              placeholder="name@university.edu"
              className={`input-field ${errors.email ? 'border-red-300' : ''}`}
              {...register('email')}
            />
            {errors.email && (
              <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full py-2.5"
          >
            {isSubmitting ? "Sending Link..." : "Send Reset Link"}
          </button>

          <div className="text-center">
            <Link to="/login" className="text-xs text-slate-500 hover:text-slate-700 hover:underline">
              Back to Sign In
            </Link>
          </div>
        </form>
      )}
    </div>
  );
};
export default ForgotPassword;
