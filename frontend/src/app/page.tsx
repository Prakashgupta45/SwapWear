'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '../lib/api';
import { ClothingListing } from '../types/listing';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Shirt,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  MapPin,
  Tag,
  Loader2,
} from 'lucide-react';

const HERO_SLIDES = [
  {
    id: 1,
    title: 'Style Favors the Curious',
    subtitle: 'Discover pre-loved fashion treasures and swap your wardrobe with zero waste.',
    ctaText: 'Shop Women’s',
    ctaLink: '/?category=DRESS',
    image:
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1600&auto=format&fit=crop',
  },
  {
    id: 2,
    title: 'Circulate Your Closet',
    subtitle: 'Turn unworn garments into fresh outfits through sustainable peer-to-peer exchange.',
    ctaText: 'Explore Topwear',
    ctaLink: '/?category=TOPWEAR',
    image:
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1600&auto=format&fit=crop',
  },
  {
    id: 3,
    title: 'Curated Designer & Vintage',
    subtitle: 'Explore authentic pre-owned jackets, boots, dresses, and sustainable accessories.',
    ctaText: 'List an Item',
    ctaLink: '/listings/new',
    image:
      'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=1600&auto=format&fit=crop',
  },
];

const QUICK_CATEGORIES = [
  { name: 'Women', icon: '👗', href: '/?category=DRESS' },
  { name: 'Topwear', icon: '👕', href: '/?category=TOPWEAR' },
  { name: 'Bottomwear', icon: '👖', href: '/?category=BOTTOMWEAR' },
  { name: 'Outerwear', icon: '🧥', href: '/?category=OUTERWEAR' },
  { name: 'Footwear', icon: '👟', href: '/?category=FOOTWEAR' },
  { name: 'Accessories', icon: '👜', href: '/?category=ACCESSORIES' },
];

export default function HomePage() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [listings, setListings] = useState<ClothingListing[]>([]);
  const [isLoadingListings, setIsLoadingListings] = useState(true);
  const [likedListings, setLikedListings] = useState<Record<string, boolean>>({});

  // Fetch real listings from backend database
  useEffect(() => {
    async function loadListings() {
      try {
        setIsLoadingListings(true);
        const res = await api.getListings(1, 12);
        if (res.success && res.data?.data) {
          setListings(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching listings:', err);
      } finally {
        setIsLoadingListings(false);
      }
    }
    loadListings();
  }, []);

  // Auto carousel slide timer
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const toggleLike = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    setLikedListings((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* ── 1. Hero Fashion Carousel (Poshmark Style) ────────────────────── */}
      <section className="relative w-full h-[420px] sm:h-[500px] bg-slate-900 overflow-hidden group">
        {HERO_SLIDES.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === activeSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            {/* Slide Background Image */}
            <div
              className="absolute inset-0 bg-cover bg-center transform scale-105 transition-transform duration-10000"
              style={{ backgroundImage: `url(${slide.image})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-900/50 to-transparent" />
            </div>

            {/* Slide Content Overlay */}
            <div className="relative z-20 max-w-7xl mx-auto h-full px-6 sm:px-12 flex flex-col justify-center items-start text-white space-y-4">
              <span className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-posh-900/80 backdrop-blur-md text-[11px] font-semibold tracking-wider uppercase border border-posh-500/30">
                <Sparkles className="h-3 w-3 text-posh-300" />
                <span>Sustainable Swap Marketplace</span>
              </span>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-extrabold tracking-tight max-w-2xl leading-tight">
                {slide.title}
              </h1>

              <p className="text-sm sm:text-base text-slate-200 max-w-lg font-normal leading-relaxed">
                {slide.subtitle}
              </p>

              <div className="pt-2">
                <Link href={slide.ctaLink}>
                  <Button
                    size="lg"
                    className="bg-white text-slate-900 hover:bg-slate-100 font-bold px-8 py-3 rounded-none shadow-lg text-sm tracking-wide transition-all transform hover:-translate-y-0.5"
                  >
                    {slide.ctaText}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ))}

        {/* Carousel Navigation Arrows */}
        <button
          onClick={() =>
            setActiveSlide((prev) => (prev === 0 ? HERO_SLIDES.length - 1 : prev - 1))
          }
          className="absolute left-4 top-1/2 -translate-y-1/2 z-30 h-10 w-10 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/70 transition-all opacity-0 group-hover:opacity-100"
          aria-label="Previous Slide"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        <button
          onClick={() => setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length)}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-30 h-10 w-10 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/70 transition-all opacity-0 group-hover:opacity-100"
          aria-label="Next Slide"
        >
          <ChevronRight className="h-6 w-6" />
        </button>

        {/* Pagination Indicators */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center space-x-2">
          {HERO_SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveSlide(idx)}
              className={`h-1.5 transition-all duration-300 rounded-full ${
                idx === activeSlide ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </section>

      {/* ── 2. Quick Category Circular Badges ──────────────────────────────── */}
      <section className="border-b border-slate-100 bg-slate-50/50 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 text-center">
            {QUICK_CATEGORIES.map((cat) => (
              <Link
                key={cat.name}
                href={cat.href}
                className="group flex flex-col items-center space-y-2 p-2 rounded-2xl hover:bg-white hover:shadow-xs transition-all"
              >
                <div className="h-14 w-14 rounded-full bg-white border border-slate-200 group-hover:border-posh-800 flex items-center justify-center text-2xl shadow-xs transition-colors">
                  {cat.icon}
                </div>
                <span className="text-xs font-bold text-slate-700 group-hover:text-posh-900">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. Section: "Inspiration Starts Here" ──────────────────────────── */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
        <div className="space-y-1">
          <h2 className="text-3xl font-serif font-extrabold text-slate-900 tracking-tight">
            Inspiration Starts Here
          </h2>
          <p className="text-sm text-slate-500 font-normal">
            Explore curated trends and standout finds from fashion swap closets.
          </p>
        </div>

        {/* Listings Grid */}
        {isLoadingListings ? (
          <div className="min-h-[30vh] flex flex-col items-center justify-center space-y-3 py-12">
            <Loader2 className="h-8 w-8 animate-spin text-posh-800" />
            <p className="text-xs font-semibold text-slate-500">Loading marketplace listings...</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-16 px-4 bg-slate-50 rounded-3xl border border-dashed border-slate-200 space-y-3">
            <Shirt className="h-12 w-12 text-slate-400 mx-auto" />
            <h3 className="text-lg font-bold text-slate-900">No Listings Found</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Be the first to list a garment in our sustainable fashion marketplace!
            </p>
            <Link href="/listings/new">
              <Button className="mt-2 bg-posh-900 hover:bg-posh-950 text-white rounded-full">
                List an Item Now
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {listings.map((item) => {
              const isLiked = likedListings[item.id];
              return (
                <Link
                  key={item.id}
                  href={`/listings/${item.id}`}
                  className="group flex flex-col bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs hover:shadow-md transition-all transform hover:-translate-y-1"
                >
                  {/* Item Image Container */}
                  <div className="relative aspect-4/5 w-full bg-slate-100 overflow-hidden">
                    {item.images && item.images.length > 0 ? (
                      <img
                        src={item.images[0].imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 space-y-1">
                        <Shirt className="h-10 w-10" />
                        <span className="text-[10px]">No Photo</span>
                      </div>
                    )}

                    {/* Category Badge Overlay */}
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-semibold text-white uppercase tracking-wider">
                        {item.category}
                      </span>
                    </div>

                    {/* Like / Heart Button */}
                    <button
                      onClick={(e) => toggleLike(item.id, e)}
                      className={`absolute top-2 right-2 h-8 w-8 rounded-full flex items-center justify-center backdrop-blur-md transition-colors ${
                        isLiked
                          ? 'bg-red-500 text-white'
                          : 'bg-white/80 text-slate-600 hover:bg-white hover:text-red-500'
                      }`}
                      aria-label="Save item"
                    >
                      <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  {/* Card Content (Poshmark Format) */}
                  <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                    <div className="space-y-1">
                      {/* Brand & Size Row */}
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                        <span className="truncate max-w-[120px]">
                          {item.brand || 'Unbranded'}
                        </span>
                        <span className="text-slate-400 font-mono">Size {item.size}</span>
                      </div>

                      {/* Title */}
                      <h3 className="text-sm font-semibold text-slate-900 group-hover:text-posh-900 line-clamp-1 leading-snug">
                        {item.title}
                      </h3>
                    </div>

                    {/* Swap Value & Condition */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <span className="text-xs font-bold text-posh-900">
                          {item.estimatedSwapValue
                            ? `$${item.estimatedSwapValue.toFixed(2)}`
                            : 'Free Swap'}
                        </span>
                      </div>

                      <span className="text-[10px] font-medium text-slate-500 px-1.5 py-0.5 rounded bg-slate-100">
                        {item.condition.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Owner Info Bar */}
                    <div className="pt-1.5 flex items-center space-x-1.5 text-[11px] text-slate-500">
                      <div className="h-4 w-4 rounded-full bg-posh-900 text-white flex items-center justify-center font-bold text-[9px]">
                        {item.owner.name[0]}
                      </div>
                      <span className="truncate max-w-[90px] font-medium text-slate-700">
                        @{item.owner.name.toLowerCase().replace(/\s+/g, '')}
                      </span>
                      {item.owner.city && (
                        <span className="truncate text-slate-400">
                          • {item.owner.city}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ── 4. Poshmark Style Banner: "Join the Circular Fashion Community" ──── */}
      <section className="bg-sand-100/70 border-y border-slate-200/80 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center space-y-6">
          <Badge variant="outline" className="bg-white text-posh-900 border-posh-200">
            Sustainable Wardrobe Exchange
          </Badge>

          <h2 className="text-3xl sm:text-4xl font-serif font-extrabold text-slate-900">
            Clear your closet. Swap what you don’t wear.
          </h2>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
            Join thousands of fashion lovers trading high-quality pre-loved clothes, boots, dresses, and vintage finds with zero landfill impact.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/listings/new">
              <Button size="lg" className="bg-posh-900 hover:bg-posh-950 text-white font-bold px-8 rounded-full">
                List an Item Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="outline" size="lg" className="rounded-full px-8 border-slate-300">
                Join SwapWear Free
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
