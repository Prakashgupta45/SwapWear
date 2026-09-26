'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AuthGuard } from '../../components/AuthGuard';
import { api } from '../../lib/api';
import { profileFormSchema } from '../../validations/profile';
import { UserProfile } from '../../types/profile';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/card';
import { Alert } from '../../components/ui/alert';
import { Badge } from '../../components/ui/badge';
import { User as UserIcon, MapPin, Edit3, Save, X, Calendar } from 'lucide-react';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    city: '',
    state: '',
    pincode: '',
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'destructive'; text: string } | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        setIsLoading(true);
        const res = await api.getProfile();
        if (res.success && res.data?.profile) {
          setProfile(res.data.profile);
          setFormData({
            name: res.data.profile.name || '',
            bio: res.data.profile.bio || '',
            city: res.data.profile.city || '',
            state: res.data.profile.state || '',
            pincode: res.data.profile.pincode || '',
          });
        }
      } catch (err: any) {
        setMessage({ type: 'destructive', text: err.message || 'Failed to load profile.' });
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setFieldErrors({});

    const validation = profileFormSchema.safeParse(formData);
    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        errors[field] = err.message;
      });
      setFieldErrors(errors);
      return;
    }

    setIsSaving(true);
    try {
      const res = await api.updateProfile({
        name: formData.name,
        bio: formData.bio || null,
        city: formData.city || null,
        state: formData.state || null,
        pincode: formData.pincode || null,
      });

      if (res.success && res.data?.profile) {
        setProfile(res.data.profile);
        setIsEditing(false);
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        await refreshUser();
      }
    } catch (err: any) {
      setMessage({ type: 'destructive', text: err.message || 'Failed to update profile.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AuthGuard>
      <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">User Profile</h1>
            <p className="text-sm text-slate-500">Manage your public bio, swap location, and identity</p>
          </div>

          {!isEditing && (
            <Button onClick={() => setIsEditing(true)} variant="outline">
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>

        {message && <Alert variant={message.type}>{message.text}</Alert>}

        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 rounded-2xl bg-forest-700 text-white flex items-center justify-center font-bold text-xl shadow-md">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <CardTitle className="text-xl">{profile?.name || user?.name}</CardTitle>
                <CardDescription className="flex items-center space-x-2 mt-0.5">
                  <span>{profile?.email || user?.email}</span>
                  <Badge variant={user?.role === 'ADMIN' ? 'admin' : 'default'}>{user?.role}</Badge>
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          {isEditing ? (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4 border-t pt-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name" required>Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    error={fieldErrors.name}
                    disabled={isSaving}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="bio">Bio</Label>
                  <textarea
                    id="bio"
                    name="bio"
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-900 focus:border-forest-600 focus:outline-none focus:ring-1 focus:ring-forest-500"
                    placeholder="Tell other swappers a bit about your style preferences..."
                    value={formData.bio}
                    onChange={handleChange}
                    disabled={isSaving}
                  />
                  {fieldErrors.bio && <p className="text-xs text-red-600 font-medium">{fieldErrors.bio}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      name="city"
                      placeholder="e.g. Seattle"
                      value={formData.city}
                      onChange={handleChange}
                      error={fieldErrors.city}
                      disabled={isSaving}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      name="state"
                      placeholder="e.g. WA"
                      value={formData.state}
                      onChange={handleChange}
                      error={fieldErrors.state}
                      disabled={isSaving}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="pincode">Pincode / ZIP</Label>
                    <Input
                      id="pincode"
                      name="pincode"
                      placeholder="e.g. 98101"
                      value={formData.pincode}
                      onChange={handleChange}
                      error={fieldErrors.pincode}
                      disabled={isSaving}
                    />
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex justify-end space-x-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                >
                  <X className="h-4 w-4 mr-1.5" />
                  Cancel
                </Button>
                <Button type="submit" isLoading={isSaving}>
                  <Save className="h-4 w-4 mr-1.5" />
                  Save Changes
                </Button>
              </CardFooter>
            </form>
          ) : (
            <CardContent className="space-y-6 pt-4 border-t">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Bio</span>
                <p className="text-sm text-slate-700 italic">
                  {profile?.bio || 'No bio provided yet. Click Edit Profile to add one!'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-forest-700 flex-shrink-0" />
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Location</span>
                    <span className="text-sm text-slate-800 font-medium">
                      {profile?.city || profile?.state
                        ? `${profile.city || ''}${profile.city && profile.state ? ', ' : ''}${profile.state || ''} ${profile.pincode || ''}`
                        : 'Location not set'}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-forest-700 flex-shrink-0" />
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Member Since</span>
                    <span className="text-sm text-slate-800 font-medium">
                      {profile?.createdAt
                        ? new Date(profile.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </AuthGuard>
  );
}
