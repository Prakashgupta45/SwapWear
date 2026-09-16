'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { loginFormSchema } from '../../validations/auth';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/card';
import { Alert } from '../../components/ui/alert';
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';

  const { login, isAuthenticated, isLoading: authLoading } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace(redirect);
    }
  }, [authLoading, isAuthenticated, router, redirect]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name as keyof typeof fieldErrors]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    setGlobalError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);
    setFieldErrors({});

    // Validate with Zod
    const validationResult = loginFormSchema.safeParse(formData);
    if (!validationResult.success) {
      const errors: { email?: string; password?: string } = {};
      validationResult.error.errors.forEach((err) => {
        const field = err.path[0] as 'email' | 'password';
        errors[field] = err.message;
      });
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    const result = await login(formData.email, formData.password);
    setIsSubmitting(false);

    if (result.success) {
      router.push(redirect);
    } else {
      setGlobalError(result.error || 'Failed to sign in. Please check your credentials.');
    }
  };

  return (
    <Card className="shadow-lg border-slate-200">
      <form onSubmit={handleSubmit}>
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-xl font-bold">Sign In</CardTitle>
          <CardDescription>Enter your email and password to access your account</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {globalError && (
            <Alert variant="destructive">
              {globalError}
            </Alert>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email" required>Email Address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@swapwear.com"
              value={formData.email}
              onChange={handleChange}
              error={fieldErrors.email}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" required>Password</Label>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              error={fieldErrors.password}
              disabled={isSubmitting}
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-3 pt-2">
          <Button
            type="submit"
            className="w-full h-11"
            isLoading={isSubmitting}
          >
            Sign In
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          <p className="text-xs text-center text-slate-500">
            Don&apos;t have an account yet?{' '}
            <Link href="/register" className="font-semibold text-forest-700 hover:underline">
              Create an account
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 rounded-2xl bg-forest-700 text-white items-center justify-center shadow-md">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Welcome Back</h1>
          <p className="text-sm text-slate-500">Sign in to manage your clothing exchange and swap marketplace</p>
        </div>

        <Suspense
          fallback={
            <Card className="shadow-lg border-slate-200 p-8 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-forest-700" />
            </Card>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
