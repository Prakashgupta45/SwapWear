'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ClothingListing } from '../types/listing';
import { Badge } from './ui/badge';
import { Heart, MapPin, Shirt } from 'lucide-react';

interface ListingCardProps {
  listing: ClothingListing;
  originalPrice?: number;
}

export function ListingCard({ listing, originalPrice }: ListingCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [imgError, setImgError] = useState(false);

  const primaryImage =
    listing.images && listing.images.length > 0 ? listing.images[0].imageUrl : null;

  // Reset error state whenever the image URL changes
  useEffect(() => {
    setImgError(false);
  }, [primaryImage]);

  const [likesCount, setLikesCount] = useState(
    Math.floor((listing.title.charCodeAt(0) || 7) % 15) + 2
  );

  const handleToggleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLiked) {
      setIsLiked(false);
      setLikesCount((prev) => Math.max(0, prev - 1));
    } else {
      setIsLiked(true);
      setLikesCount((prev) => prev + 1);
    }
  };

  // (primaryImage already declared above)

  // Approximate retail price if not provided for consignment styling
  const estimatedValue = listing.estimatedSwapValue || 45;
  const retailComparison = originalPrice || Math.round(estimatedValue * 2.4);

  const conditionDisplay =
    listing.condition === 'NEW'
      ? 'NWT'
      : listing.condition === 'LIKE_NEW'
      ? 'Like New'
      : listing.condition === 'GOOD'
      ? 'Good'
      : 'Fair';

  return (
    <article className="group flex flex-col bg-white border border-slate-200/90 rounded-lg overflow-hidden shadow-2xs hover:shadow-md transition-all duration-200">
      {/* Image Container with Zoom and Overlays */}
      <Link href={`/marketplace/${listing.id}`} className="relative aspect-square w-full bg-slate-100 overflow-hidden block">
        {primaryImage && !imgError ? (
          <img
            src={primaryImage}
            alt={listing.title}
            loading="lazy"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 space-y-1">
            <Shirt className="h-12 w-12 stroke-[1.5]" />
            <span className="text-[11px] font-medium">No Photo</span>
          </div>
        )}

        {/* NWT / Condition Ribbon */}
        {listing.condition === 'NEW' && (
          <div className="absolute top-2 left-2 bg-[#841d37] text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded shadow-sm">
            NWT
          </div>
        )}

        {/* Heart / Favorite Button */}
        <button
          type="button"
          onClick={handleToggleLike}
          aria-label={isLiked ? 'Unlike item' : 'Like item'}
          className={`absolute bottom-2 right-2 flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-semibold backdrop-blur-md transition-all ${
            isLiked
              ? 'bg-[#841d37] text-white shadow-md scale-105'
              : 'bg-white/80 text-slate-700 hover:bg-white hover:text-[#841d37] shadow-xs'
          }`}
        >
          <Heart
            className={`h-3.5 w-3.5 transition-transform ${
              isLiked ? 'fill-current scale-110' : ''
            }`}
          />
          <span className="text-[11px]">{likesCount}</span>
        </button>
      </Link>

      {/* Details Container */}
      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
        <Link href={`/marketplace/${listing.id}`} className="space-y-1 block group-hover:text-[#841d37] transition-colors">
          {/* Brand & Size Header */}
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <span className="truncate max-w-[130px] font-semibold text-slate-600">
              {listing.brand || 'Consignment'}
            </span>
            <span className="text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded font-mono text-[10px]">
              Size {listing.size}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-sm font-semibold text-slate-900 group-hover:text-[#841d37] line-clamp-1 leading-snug">
            {listing.title}
          </h3>
        </Link>

        {/* Price & Retail Value */}
        <div className="flex items-baseline justify-between pt-1 border-t border-slate-100">
          <div className="flex items-baseline space-x-2">
            <span className="text-base font-extrabold text-slate-900">
              ${estimatedValue.toFixed(0)}
            </span>
            <span className="text-xs text-slate-400 line-through">
              ${retailComparison}
            </span>
          </div>

          <span className="text-[10px] font-semibold text-slate-600 px-1.5 py-0.5 rounded bg-slate-100">
            {conditionDisplay}
          </span>
        </div>

        {/* Seller Info Row */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center space-x-1.5 min-w-0">
            <div className="h-5 w-5 rounded-full bg-[#841d37] text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0">
              {listing.owner.name?.[0]?.toUpperCase() || 'P'}
            </div>
            <span className="truncate text-slate-600 font-medium max-w-[100px]">
              @{listing.owner.name.toLowerCase().replace(/\s+/g, '')}
            </span>
          </div>

          {listing.owner.city && (
            <span className="flex items-center text-[10px] text-slate-400 truncate max-w-[90px]">
              <MapPin className="h-2.5 w-2.5 mr-0.5 text-slate-400 flex-shrink-0" />
              {listing.owner.city}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
