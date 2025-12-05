// lib/useRoleProtection.ts

'use client';

import { useAuth, UserRole } from '@/app/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function useRoleProtection(allowedRoles: UserRole[]) {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Still loading auth
    if (authLoading) {
      setIsChecking(true);
      return;
    }

    // Not authenticated - redirect to login
    if (!isAuthenticated || !user) {
      setIsChecking(false);
      router.push('/login');
      return;
    }

    // Check if user has allowed role
    if (allowedRoles.includes(user.role)) {
      setIsAuthorized(true);
      setIsChecking(false);
      return;
    }

    // Unauthorized - redirect to correct dashboard based on role
    setIsChecking(false);
    
    const dashboardRoutes: Record<UserRole, string> = {
      'super_admin': '/dashboard/super-admin',
      'hospital_admin': '/dashboard/hospital-admin',
      'doctor': '/dashboard/doctor',
      'nurse': '/dashboard/nurse',
      'department_staff': '/dashboard/department',
      'patient': '/dashboard/patient',
      'pending_approval': '/pending-approval',
    };

    const route = dashboardRoutes[user.role];
    if (route) {
      router.push(route);
    } else {
      router.push('/login');
    }

  }, [isAuthenticated, authLoading, user, allowedRoles, router]);

  return {
    isAuthorized,
    isChecking,
    profile: user, // Return user from AuthProvider
  };
}