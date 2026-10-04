'use client';

import React, { useState, useEffect, useRef } from 'react';
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
import {
  User as UserIcon,
  MapPin,
  Edit3,
  Save,
  X,
  Calendar,
  Camera,
  Upload,
  Trash2,
  Link as LinkIcon,
  Check,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

const PRESET_AVATARS = [
  { id: 'av-1', label: 'Elegance', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80' },
  { id: 'av-2', label: 'Classic', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80' },
  { id: 'av-3', label: 'Boho Chic', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80' },
  { id: 'av-4', label: 'Urban', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80' },
  { id: 'av-5', label: 'Modern Vintage', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&q=80' },
  { id: 'av-6', label: 'Minimalist', url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=256&q=80' },
];

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);
  const [showUrlInput, setShowUrlInput] = useState<boolean>(false);
  const [customUrl, setCustomUrl] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    city: '',
    state: '',
    pincode: '',
    avatarUrl: '',
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
            avatarUrl: res.data.profile.avatarUrl || '',
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

  /**
   * Client-side image compression & conversion to data URL
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'destructive', text: 'Please select a valid image file (PNG, JPG, WebP).' });
      return;
    }

    // Limit original file size to 10MB
    if (file.size > 10 * 1024 * 1024) {
      setMessage({ type: 'destructive', text: 'Image file size must be under 10MB.' });
      return;
    }

    setIsUploadingPhoto(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize to maximum 400x400 square for fast loading and database storage
        const canvas = document.createElement('canvas');
        const maxSize = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          updateAvatar(compressedDataUrl);
        }
        setIsUploadingPhoto(false);
      };
      img.onerror = () => {
        setIsUploadingPhoto(false);
        setMessage({ type: 'destructive', text: 'Failed to process selected image.' });
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      setIsUploadingPhoto(false);
      setMessage({ type: 'destructive', text: 'Failed to read image file.' });
    };
    reader.readAsDataURL(file);

    // Reset input value so same file can be re-selected if desired
    e.target.value = '';
  };

  /**
   * Apply an avatar URL and optionally save immediately to backend
   */
  const updateAvatar = async (url: string | null) => {
    setFormData((prev) => ({ ...prev, avatarUrl: url || '' }));
    setMessage(null);

    // Auto-persist avatar directly
    try {
      setIsSaving(true);
      const res = await api.updateProfile({
        avatarUrl: url,
      });

      if (res.success && res.data?.profile) {
        setProfile(res.data.profile);
        await refreshUser();
        setMessage({
          type: 'success',
          text: url ? 'Profile picture updated successfully!' : 'Profile picture removed.',
        });
      }
    } catch (err: any) {
      setMessage({ type: 'destructive', text: err.message || 'Failed to update profile picture.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;
    updateAvatar(customUrl.trim());
    setCustomUrl('');
    setShowUrlInput(false);
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
        avatarUrl: formData.avatarUrl || null,
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

  const currentAvatar = formData.avatarUrl || profile?.avatarUrl || user?.avatarUrl;
  const userInitial = (formData.name || profile?.name || user?.name || 'U').charAt(0).toUpperCase();

  return (
    <AuthGuard>
      <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-serif font-black text-slate-900 tracking-tight">User Profile</h1>
            <p className="text-sm text-slate-500">Manage your avatar, public bio, swap location, and identity</p>
          </div>

          {!isEditing && (
            <Button onClick={() => setIsEditing(true)} variant="outline" className="border-slate-300">
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Profile Info
            </Button>
          )}
        </div>

        {message && <Alert variant={message.type}>{message.text}</Alert>}

        {/* ── Profile Header Card with Picture ─────────────────────────────── */}
        <Card className="shadow-sm border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-[#841d37]/10 via-[#841d37]/5 to-transparent p-6 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Avatar Container with Hover / Change actions */}
              <div className="relative group shrink-0">
                <div className="h-28 w-28 rounded-full border-4 border-white shadow-lg overflow-hidden bg-slate-100 flex items-center justify-center">
                  {currentAvatar ? (
                    <img
                      src={currentAvatar}
                      alt={formData.name || 'User Avatar'}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-[#841d37] to-[#5b1325] text-white flex items-center justify-center font-serif text-4xl font-bold">
                      {userInitial}
                    </div>
                  )}
                </div>

                {/* Quick Camera Trigger Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload New Profile Picture"
                  disabled={isSaving || isUploadingPhoto}
                  className="absolute bottom-1 right-1 h-9 w-9 rounded-full bg-[#841d37] hover:bg-[#70182e] text-white flex items-center justify-center shadow-md transition-transform hover:scale-105 active:scale-95 border-2 border-white focus:outline-none"
                >
                  {isUploadingPhoto ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* User Bio and Info Preview */}
              <div className="text-center sm:text-left flex-1 space-y-2">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h2 className="text-2xl font-serif font-black text-slate-900">
                    {profile?.name || user?.name}
                  </h2>
                  <Badge variant={user?.role === 'ADMIN' ? 'admin' : 'default'}>
                    {user?.role}
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-slate-500">{profile?.email || user?.email}</p>

                {/* Profile Photo Controls */}
                <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/png,image/jpeg,image/webp,image/jpg"
                    className="hidden"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSaving || isUploadingPhoto}
                    className="text-xs rounded-full border-slate-300 font-semibold"
                  >
                    <Upload className="h-3.5 w-3.5 mr-1.5 text-[#841d37]" />
                    Upload Photo
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="text-xs rounded-full border-slate-300 font-semibold"
                  >
                    <LinkIcon className="h-3.5 w-3.5 mr-1.5 text-[#841d37]" />
                    Link Image URL
                  </Button>

                  {currentAvatar && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => updateAvatar(null)}
                      disabled={isSaving}
                      className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-full font-medium"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Remove
                    </Button>
                  )}
                </div>

                {/* Optional Image URL Input Bar */}
                {showUrlInput && (
                  <form onSubmit={handleApplyCustomUrl} className="pt-2 flex items-center gap-2 max-w-md">
                    <Input
                      type="url"
                      placeholder="Paste image link (https://...)"
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      className="text-xs h-9 bg-white"
                    />
                    <Button
                      type="submit"
                      size="sm"
                      className="bg-[#841d37] hover:bg-[#70182e] text-white text-xs h-9 shrink-0 px-3"
                    >
                      Apply
                    </Button>
                  </form>
                )}
              </div>
            </div>

            {/* ── Preset Avatars Quick-Pick Bar ────────────────────────────── */}
            <div className="mt-5 pt-4 border-t border-slate-200/60">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2.5">
                Or select a stylish community avatar:
              </span>
              <div className="flex items-center gap-3 overflow-x-auto pb-1">
                {PRESET_AVATARS.map((av) => {
                  const isSelected = currentAvatar === av.url;
                  return (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => updateAvatar(av.url)}
                      disabled={isSaving}
                      className={`relative h-12 w-12 rounded-full overflow-hidden shrink-0 border-2 transition-all hover:scale-110 focus:outline-none ${
                        isSelected
                          ? 'border-[#841d37] ring-2 ring-[#841d37]/40 shadow-sm scale-105'
                          : 'border-slate-200 hover:border-slate-400 opacity-80 hover:opacity-100'
                      }`}
                      title={av.label}
                    >
                      <img src={av.url} alt={av.label} className="h-full w-full object-cover" />
                      {isSelected && (
                        <span className="absolute inset-0 bg-[#841d37]/40 flex items-center justify-center text-white">
                          <Check className="h-4 w-4" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Details / Edit Form ────────────────────────────────────────── */}
          {isEditing ? (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4 pt-6">
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
                    className="w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-900 focus:border-[#841d37] focus:outline-none focus:ring-1 focus:ring-[#841d37]"
                    placeholder="Tell other swappers about your fashion taste, favorite brands, and sizing..."
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

              <CardFooter className="flex justify-end space-x-3 pt-4 border-t bg-slate-50/50">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                >
                  <X className="h-4 w-4 mr-1.5" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={isSaving}
                  className="bg-[#841d37] hover:bg-[#70182e] text-white"
                >
                  <Save className="h-4 w-4 mr-1.5" />
                  Save Changes
                </Button>
              </CardFooter>
            </form>
          ) : (
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Bio</span>
                <p className="text-sm text-slate-700 italic">
                  {profile?.bio || 'No bio provided yet. Click "Edit Profile Info" to add one!'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-[#841d37] flex-shrink-0" />
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Location</span>
                    <span className="text-sm text-slate-800 font-medium">
                      {profile?.city || profile?.state
                        ? `${profile.city || ''}${profile.city && profile.state ? ', ' : ''}${profile.state || ''} ${profile.pincode || ''}`
                        : 'Location not set'}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-[#841d37] flex-shrink-0" />
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Member Since</span>
                    <span className="text-sm text-slate-800 font-medium">
                      {profile?.createdAt
                        ? new Date(profile.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
                        : 'Active Member'}
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
