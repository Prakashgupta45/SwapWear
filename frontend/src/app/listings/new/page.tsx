'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '../../../components/AuthGuard';
import { api } from '../../../lib/api';
import { listingFormSchema } from '../../../validations/listing';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../../components/ui/card';
import { Alert } from '../../../components/ui/alert';
import { PlusCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewListingPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'TOPWEAR',
    brand: '',
    color: '',
    size: 'M',
    condition: 'GOOD',
    estimatedSwapValue: '',
    imageUrl: '',
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);
    setFieldErrors({});

    const validation = listingFormSchema.safeParse(formData);
    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        errors[field] = err.message;
      });
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.createListing({
        title: formData.title,
        description: formData.description || undefined,
        category: formData.category,
        brand: formData.brand || undefined,
        color: formData.color || undefined,
        size: formData.size,
        condition: formData.condition,
        estimatedSwapValue: formData.estimatedSwapValue ? parseFloat(formData.estimatedSwapValue) : undefined,
        imageUrls: formData.imageUrl.trim() ? [formData.imageUrl.trim()] : [],
      });

      if (res.success && res.data?.listing) {
        router.push('/my-listings');
      }
    } catch (err: any) {
      setGlobalError(err.message || 'Failed to create listing. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthGuard>
      <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto w-full space-y-6">
        <div className="flex items-center space-x-3">
          <Link href="/my-listings">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to My Listings
            </Button>
          </Link>
        </div>

        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Create Clothing Listing</h1>
          <p className="text-sm text-slate-500">List an item from your wardrobe for exchange or swap</p>
        </div>

        {globalError && <Alert variant="destructive">{globalError}</Alert>}

        <Card className="shadow-lg border-slate-200">
          <form onSubmit={handleSubmit}>
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Listing Information</CardTitle>
              <CardDescription>Enter details about the garment you wish to swap</CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="title" required>Title</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="e.g. Vintage Denim Jacket"
                  value={formData.title}
                  onChange={handleChange}
                  error={fieldErrors.title}
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="category" required>Category</Label>
                  <select
                    id="category"
                    name="category"
                    className="flex h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-forest-600 focus:outline-none focus:ring-1 focus:ring-forest-500"
                    value={formData.category}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  >
                    <option value="TOPWEAR">Topwear</option>
                    <option value="BOTTOMWEAR">Bottomwear</option>
                    <option value="DRESS">Dress</option>
                    <option value="OUTERWEAR">Outerwear</option>
                    <option value="FOOTWEAR">Footwear</option>
                    <option value="ACCESSORIES">Accessories</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="condition" required>Condition</Label>
                  <select
                    id="condition"
                    name="condition"
                    className="flex h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-forest-600 focus:outline-none focus:ring-1 focus:ring-forest-500"
                    value={formData.condition}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  >
                    <option value="NEW">New (Unused with tags)</option>
                    <option value="LIKE_NEW">Like New (Mint condition)</option>
                    <option value="GOOD">Good (Lightly worn)</option>
                    <option value="FAIR">Fair (Visible wear)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    name="brand"
                    placeholder="e.g. Levi's, Zara, Nike"
                    value={formData.brand}
                    onChange={handleChange}
                    error={fieldErrors.brand}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    name="color"
                    placeholder="e.g. Indigo, olive"
                    value={formData.color}
                    onChange={handleChange}
                    error={fieldErrors.color}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="size" required>Size</Label>
                  <Input
                    id="size"
                    name="size"
                    placeholder="e.g. S, M, L, 32"
                    value={formData.size}
                    onChange={handleChange}
                    error={fieldErrors.size}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="estimatedSwapValue">Est. Swap Value ($)</Label>
                  <Input
                    id="estimatedSwapValue"
                    name="estimatedSwapValue"
                    type="number"
                    step="0.01"
                    placeholder="e.g. 45.00"
                    value={formData.estimatedSwapValue}
                    onChange={handleChange}
                    error={fieldErrors.estimatedSwapValue}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  className="w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-900 focus:border-forest-600 focus:outline-none focus:ring-1 focus:ring-forest-500"
                  placeholder="Describe material, fit, condition details, or swap preferences..."
                  value={formData.description}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
                {fieldErrors.description && (
                  <p className="text-xs text-red-600 font-medium">{fieldErrors.description}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input
                  id="imageUrl"
                  name="imageUrl"
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={formData.imageUrl}
                  onChange={handleChange}
                  error={fieldErrors.imageUrl}
                  disabled={isSubmitting}
                />
                <p className="text-xs text-slate-400">
                  Provide a valid image URL ending in .jpg, .jpeg, .png, .webp, or .gif.
                </p>
              </div>
            </CardContent>

            <CardFooter className="flex justify-end space-x-3 pt-4 border-t">
              <Link href="/my-listings">
                <Button type="button" variant="ghost" disabled={isSubmitting}>
                  Cancel
                </Button>
              </Link>
              <Button type="submit" isLoading={isSubmitting}>
                <PlusCircle className="h-4 w-4 mr-1.5" />
                Publish Listing
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </AuthGuard>
  );
}
