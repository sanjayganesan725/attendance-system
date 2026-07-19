import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth, UserSession } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import api from '../../services/api';

const loginSchema = z.object({
  email: z.string().min(1, { message: "Email or Name is required" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  rememberMe: z.boolean().default(false),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Show session expired message if redirected
  React.useEffect(() => {
    if (searchParams.get('expired') === 'true') {
      toast("Your session has expired. Please log in again.", "error");
    }
  }, [searchParams, toast]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      rememberMe: false,
    }
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    try {
      // API expects standard urlencoded form for OAuth2 compatibility
      const params = new URLSearchParams();
      params.append('username', data.email);
      params.append('password', data.password);

      const response = await api.post('/auth/login', params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const { access_token, role, name, email, user_id } = response.data;
      
      const userSession: UserSession = {
        id: user_id,
        name,
        email,
        role
      };

      // Set auth context
      login(access_token, userSession, data.rememberMe);
      
      toast(`Welcome back, ${name}!`);
      
      // Redirect based on role
      navigate(`/${role}`, { replace: true });
    } catch (error: any) {
      const message = error.response?.data?.detail || "Authentication failed. Please verify credentials.";
      toast(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-primary">Sign In</h3>
        <p className="text-sm text-slate-500 mt-1">Enter your credentials to access your dashboard</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
            Email or Name
          </label>
          <input
            type="text"
            placeholder="name@university.edu or Full Name"
            className={`input-field ${errors.email ? 'border-red-300 focus:ring-red-300' : ''}`}
            {...register('email')}
          />
          {errors.email && (
            <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Password
            </label>
            <Link to="/forgot-password" className="text-xs text-accent hover:underline">
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            placeholder="••••••••"
            className={`input-field ${errors.password ? 'border-red-300 focus:ring-red-300' : ''}`}
            {...register('password')}
          />
          {errors.password && (
            <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
          )}
        </div>

        <div className="flex items-center">
          <input
            id="rememberMe"
            type="checkbox"
            className="h-4 w-4 rounded border-borderLight text-accent focus:ring-accent"
            {...register('rememberMe')}
          />
          <label htmlFor="rememberMe" className="ml-2 text-sm text-slate-600 cursor-pointer">
            Remember me for 7 days
          </label>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full py-2.5"
        >
          {isSubmitting ? "Authenticating..." : "Sign In"}
        </button>
      </form>
      
      <div className="border-t border-borderLight pt-4 text-center">
        <p className="text-xs text-slate-400">
          Admin: admin@attendance.com / admin123
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Faculty: faculty@attendance.com / faculty123
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Student: student@attendance.com / student123
        </p>
      </div>
    </div>
  );
};
export default Login;
