'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { registerFormSchema } from '../../validations/auth';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/card';
import { Alert } from '../../components/ui/alert';
import { ArrowRight, Check, X } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isAuthenticated, isLoading: authLoading } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [authLoading, isAuthenticated, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
    setGlobalError(null);
  };

  // Password criteria verification
  const criteria = {
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    lowercase: /[a-z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
    special: /[^A-Za-z0-9]/.test(formData.password),
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);
    setFieldErrors({});

    // Validate with Zod
    const validationResult = registerFormSchema.safeParse(formData);
    if (!validationResult.success) {
      const errors: Record<string, string> = {};
      validationResult.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        errors[field] = err.message;
      });
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    const result = await register(formData.name, formData.email, formData.password);
    setIsSubmitting(false);

    if (result.success) {
      router.push('/dashboard');
    } else {
      setGlobalError(result.error || 'Failed to create account. Please try again.');
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-serif font-black text-slate-900 tracking-tight">Join SwapWear</h1>
          <p className="text-sm text-slate-500">Create your account to start exchanging pre-loved clothing</p>
        </div>

        <Card className="shadow-lg border-slate-200">
          <form onSubmit={handleSubmit}>
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-xl font-bold">Create an Account</CardTitle>
              <CardDescription>Enter your details below to join the sustainable fashion circle</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {globalError && (
                <Alert variant="destructive">
                  {globalError}
                </Alert>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="name" required>Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Jane Doe"
                  value={formData.name}
                  onChange={handleChange}
                  error={fieldErrors.name}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" required>Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="jane@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  error={fieldErrors.email}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" required>Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  error={fieldErrors.password}
                  disabled={isSubmitting}
                />

                {/* Password strength checklist */}
                {formData.password && (
                  <div className="pt-2 text-xs space-y-1 text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <p className="font-semibold text-slate-700">Password requirements:</p>
                    <div className="grid grid-cols-2 gap-1 pt-1">
                      <div className={`flex items-center space-x-1.5 ${criteria.length ? 'text-forest-700 font-medium' : 'text-slate-400'}`}>
                        {criteria.length ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                        <span>At least 8 chars</span>
                      </div>
                      <div className={`flex items-center space-x-1.5 ${criteria.uppercase ? 'text-forest-700 font-medium' : 'text-slate-400'}`}>
                        {criteria.uppercase ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                        <span>Uppercase letter</span>
                      </div>
                      <div className={`flex items-center space-x-1.5 ${criteria.lowercase ? 'text-forest-700 font-medium' : 'text-slate-400'}`}>
                        {criteria.lowercase ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                        <span>Lowercase letter</span>
                      </div>
                      <div className={`flex items-center space-x-1.5 ${criteria.number ? 'text-forest-700 font-medium' : 'text-slate-400'}`}>
                        {criteria.number ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                        <span>Number</span>
                      </div>
                      <div className={`flex items-center space-x-1.5 col-span-2 ${criteria.special ? 'text-forest-700 font-medium' : 'text-slate-400'}`}>
                        {criteria.special ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                        <span>Special character (!@#$%^&*...)</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" required>Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={fieldErrors.confirmPassword}
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
                Create Account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <p className="text-xs text-center text-slate-500">
                Already have an account?{' '}
                <Link href="/login" className="font-semibold text-[#841d37] hover:text-[#731c33] hover:underline">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
