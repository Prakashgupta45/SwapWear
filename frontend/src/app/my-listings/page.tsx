'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AuthGuard } from '../../components/AuthGuard';
import { api } from '../../lib/api';
import { ClothingListing } from '../../types/listing';
import { Button } from '../../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Alert } from '../../components/ui/alert';
import { Badge } from '../../components/ui/badge';
import { Shirt, PlusCircle, Trash2, Edit, ExternalLink, Loader2, Tag, DollarSign } from 'lucide-react';

export default function MyListingsPage() {
  const [listings, setListings] = useState<ClothingListing[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'destructive'; text: string } | null>(null);

  const loadMyListings = async () => {
    try {
      setIsLoading(true);
      const res = await api.getMyListings();
      if (res.success && res.data?.listings) {
        setListings(res.data.listings);
      }
    } catch (err: any) {
      setMessage({ type: 'destructive', text: err.message || 'Failed to load your listings.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMyListings();
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await api.deleteListing(id);
      if (res.success) {
        setListings((prev) => prev.filter((item) => item.id !== id));
        setMessage({ type: 'success', text: `Listing "${title}" deleted successfully.` });
      }
    } catch (err: any) {
      setMessage({ type: 'destructive', text: err.message || 'Failed to delete listing.' });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AuthGuard>
      <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Clothing Listings</h1>
            <p className="text-sm text-slate-500">Manage garments you have posted for exchange</p>
          </div>

          <Link href="/listings/new">
            <Button className="shadow-sm">
              <PlusCircle className="h-4 w-4 mr-2" />
              List New Garment
            </Button>
          </Link>
        </div>

        {message && <Alert variant={message.type}>{message.text}</Alert>}

        {isLoading ? (
          <div className="min-h-[40vh] flex flex-col items-center justify-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-forest-700" />
            <p className="text-sm text-slate-500">Loading your listings...</p>
          </div>
        ) : listings.length === 0 ? (
          <Card className="p-12 text-center space-y-4 border-dashed border-2 border-slate-300">
            <div className="h-16 w-16 rounded-full bg-forest-100 text-forest-700 flex items-center justify-center mx-auto">
              <Shirt className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">No Clothing Listings Yet</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                You haven&apos;t posted any garments for swap yet. Start decluttering your wardrobe today!
              </p>
            </div>
            <Link href="/listings/new">
              <Button size="lg" className="mt-2">
                <PlusCircle className="h-4 w-4 mr-2" />
                Create Your First Listing
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((item) => (
              <Card key={item.id} className="flex flex-col overflow-hidden shadow-sm hover:shadow-md transition-shadow border-slate-200">
                {item.images && item.images.length > 0 ? (
                  <div className="h-48 w-full bg-slate-100 overflow-hidden relative">
                    <img
                      src={item.images[0].imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3">
                      <Badge variant={item.status === 'AVAILABLE' ? 'default' : 'outline'}>
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="h-48 w-full bg-slate-100 flex flex-col items-center justify-center text-slate-400 space-y-1 relative">
                    <Shirt className="h-10 w-10" />
                    <span className="text-xs">No Image Provided</span>
                    <div className="absolute top-3 right-3">
                      <Badge variant={item.status === 'AVAILABLE' ? 'default' : 'outline'}>
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                )}

                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg font-bold text-slate-900 line-clamp-1">{item.title}</CardTitle>
                  </div>
                </CardHeader>

                <CardContent className="p-4 pt-0 flex-1 space-y-3">
                  <p className="text-xs text-slate-500 line-clamp-2">
                    {item.description || 'No description provided.'}
                  </p>

                  <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-700">
                    <span className="inline-flex items-center px-2 py-1 rounded bg-slate-100">
                      <Tag className="h-3 w-3 mr-1 text-forest-700" />
                      {item.category}
                    </span>
                    <span className="inline-flex items-center px-2 py-1 rounded bg-slate-100">
                      Size: {item.size}
                    </span>
                    <span className="inline-flex items-center px-2 py-1 rounded bg-slate-100">
                      Condition: {item.condition.replace('_', ' ')}
                    </span>
                    {item.estimatedSwapValue && (
                      <span className="inline-flex items-center px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <DollarSign className="h-3 w-3 mr-0.5" />
                        {item.estimatedSwapValue.toFixed(2)}
                      </span>
                    )}
                  </div>
                </CardContent>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <Link href={`/listings/${item.id}`}>
                    <Button variant="ghost" size="sm" className="text-slate-600">
                      <ExternalLink className="h-3.5 w-3.5 mr-1" />
                      View
                    </Button>
                  </Link>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(item.id, item.title)}
                      isLoading={deletingId === item.id}
                      className="text-red-600 hover:bg-red-50 border-red-200"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
