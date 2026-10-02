'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '../lib/api';
import { ClothingListing } from '../types/listing';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ListingCard } from '../components/ListingCard';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Package,
  RefreshCw,
  Zap,
} from 'lucide-react';

interface HeroSlide {
  id: string;
  image: string;
  subtitle: string;
  title: string;
  description: string;
  ctaText: string;
  ctaLink: string;
}

const HERO_SLIDES: HeroSlide[] = [
  {
    id: 'hero-1',
    image: '/images/poshmark-hero-1.jpg',
    subtitle: 'CURATED CLOSETS & TRENDS',
    title: 'Style Favors the Curious',
    description: 'Explore pre-loved designer pieces, vintage gems, and everyday favorites.',
    ctaText: "Shop Women's",
    ctaLink: '/marketplace?department=women',
  },
  {
    id: 'hero-2',
    image: '/images/poshmark-hero-2.jpg',
    subtitle: 'NEW SEASON LOOKS',
    title: 'Your Next Favorite Outfit',
    description: 'Give great fashion a second life and discover one-of-a-kind styles.',
    ctaText: 'Explore Swaps',
    ctaLink: '/marketplace',
  },
];

import { CURATED_SHOWCASE_LISTINGS } from '../lib/curatedListings';

const POPULAR_BRANDS = [
  'Nike',
  'Lululemon',
  'Zara',
  'Reformation',
  'Free People',
  'Coach',
  'Gucci',
  "Levi's",
  'Aritzia',
  'Patagonia',
  'Madewell',
  'Chanel',
];

const DEPARTMENT_TILES = [
  { name: 'Women', href: '/marketplace?department=women', img: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=400&q=80' },
  { name: 'Men', href: '/marketplace?department=men', img: 'https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?auto=format&fit=crop&w=400&q=80' },
  { name: 'Kids', href: '/marketplace?department=kids', img: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=400&q=80' },
  { name: 'Shoes', href: '/marketplace?category=FOOTWEAR', img: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=400&q=80' },
  { name: 'Handbags', href: '/marketplace?category=ACCESSORIES', img: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=400&q=80' },
  { name: 'Luxury', href: '/marketplace?sort=price_desc&q=luxury', img: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=400&q=80' },
];

export default function HomePage() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [listings, setListings] = useState<ClothingListing[]>([]);
  const [isLoadingListings, setIsLoadingListings] = useState(true);

  // Auto-advance hero slides every 7 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  // Fetch real listings from backend database
  useEffect(() => {
    async function loadListings() {
      try {
        setIsLoadingListings(true);
        const res = await api.getListings(1, 12);
        if (res.success && res.data?.data && res.data.data.length > 0) {
          setListings(res.data.data);
        } else {
          // If database is empty, fallback to rich curated showcase
          setListings(CURATED_SHOWCASE_LISTINGS);
        }
      } catch (err) {
        console.error('Error fetching listings, using showcase items:', err);
        setListings(CURATED_SHOWCASE_LISTINGS);
      } finally {
        setIsLoadingListings(false);
      }
    }
    loadListings();
  }, []);

  const currentSlide = HERO_SLIDES[activeSlide];

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* ── 1. Hero Banner / Carousel ────────────────────────────────────────── */}
      <section className="relative isolate min-h-[460px] sm:min-h-[520px] lg:min-h-[560px] overflow-hidden bg-slate-900 text-white">
        {/* Carousel Background Image */}
        <div className="absolute inset-0">
          <img
            src={currentSlide.image}
            alt={currentSlide.title}
            fetchPriority="high"
            className="h-full w-full object-cover transition-opacity duration-700 ease-in-out"
          />
          {/* Subtle gradient overlay to match Poshmark aesthetic and maintain high contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-black/15" />
        </div>

        {/* Hero Content Container */}
        <div className="relative mx-auto flex min-h-[460px] sm:min-h-[520px] lg:min-h-[560px] max-w-7xl items-center px-6 sm:px-12 lg:px-16 py-16">
          <div className="max-w-2xl space-y-6 text-left">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-white/90">
              <Sparkles className="h-4 w-4 text-[#e04768]" />
              {currentSlide.subtitle}
            </span>

            <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] text-white drop-shadow-sm">
              {currentSlide.title}
            </h1>

            <p className="max-w-xl text-sm sm:text-base text-white/90 font-normal leading-relaxed">
              {currentSlide.description}
            </p>

            <div className="pt-2">
              <Link href={currentSlide.ctaLink}>
                <button
                  type="button"
                  className="rounded-md bg-white px-8 py-3.5 text-sm font-bold text-slate-950 hover:bg-slate-100 transition-colors shadow-lg active:scale-95"
                >
                  {currentSlide.ctaText}
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Carousel Chevrons */}
        <button
          type="button"
          onClick={() => setActiveSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
          aria-label="Previous Slide"
          className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-black/35 hover:bg-black/60 text-white backdrop-blur-xs transition-colors"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        <button
          type="button"
          onClick={() => setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length)}
          aria-label="Next Slide"
          className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-black/35 hover:bg-black/60 text-white backdrop-blur-xs transition-colors"
        >
          <ChevronRight className="h-6 w-6" />
        </button>

        {/* Slide Indicator Bar at bottom (Poshmark dash pill style) */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {HERO_SLIDES.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => setActiveSlide(index)}
              aria-label={`Slide ${index + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === activeSlide ? 'w-10 bg-white' : 'w-2.5 bg-white/50 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      </section>

      {/* ── 2. Section: "Inspiration Starts Here" ──────────────────────────── */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
        <div className="space-y-1.5">
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900 tracking-tight">
            Inspiration Starts Here
          </h2>
          <p className="text-sm sm:text-base text-slate-600 font-normal">
            Explore curated trends and standout finds.
          </p>
        </div>

        {/* Listings Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {listings.map((item) => (
            <ListingCard key={item.id} listing={item} />
          ))}
        </div>

        <div className="text-center pt-6">
          <Link href="/marketplace">
            <Button
              variant="outline"
              size="lg"
              className="rounded-full px-8 py-3 font-semibold text-slate-800 border-slate-300 hover:border-[#841d37] hover:text-[#841d37]"
            >
              Discover More Curated Listings
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ── 3. Department Circles / Quick Categories ────────────────────────── */}
      <section className="bg-slate-50 border-y border-slate-200 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="text-center space-y-1">
            <h3 className="text-2xl font-serif font-bold text-slate-900">
              Shop by Department
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Find what fits your personal style across verified fashion closets
            </p>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 pt-2">
            {DEPARTMENT_TILES.map((dept) => (
              <Link
                key={dept.name}
                href={dept.href}
                className="group flex flex-col items-center space-y-2 text-center"
              >
                <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-full overflow-hidden border-2 border-transparent group-hover:border-[#841d37] shadow-sm transition-all duration-300 group-hover:scale-105">
                  <img
                    src={dept.img}
                    alt={dept.name}
                    className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-slate-800 group-hover:text-[#841d37] transition-colors">
                  {dept.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. Trending Brands Marquee ───────────────────────────────────────── */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-serif font-bold text-slate-900">
            Trending Brands on SwapWear
          </h3>
          <Link href="/marketplace" className="text-xs font-semibold text-[#841d37] hover:underline">
            View All Brands
          </Link>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {POPULAR_BRANDS.map((brand) => (
            <Link
              key={brand}
              href={`/marketplace?brand=${encodeURIComponent(brand)}`}
              className="px-4 py-2 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-700 hover:border-[#841d37] hover:text-[#841d37] hover:shadow-2xs transition-all"
            >
              {brand}
            </Link>
          ))}
        </div>
      </section>

      {/* ── 5. Sell Now Banner (Poshmark Seller CTA) ─────────────────────────── */}
      <section className="bg-[#841d37] text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center space-y-6">
          <Badge variant="outline" className="bg-white/10 text-white border-white/20 text-xs tracking-wider">
            SWAPWEAR SELLER COMMUNITY
          </Badge>

          <h2 className="text-3xl sm:text-5xl font-serif font-extrabold text-white">
            Turn Your Closet into Cash & Style
          </h2>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-white/90 leading-relaxed font-normal">
            List in under 60 seconds. Snap a photo, set your price or swap preference, and join millions of fashion lovers circulating good clothing.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/listings/new">
              <Button size="lg" className="bg-white hover:bg-slate-100 text-[#841d37] font-bold px-8 py-3.5 rounded-md shadow-lg">
                Sell an Item Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="outline" size="lg" className="text-white border-white/40 hover:bg-white/10 px-8 py-3.5 rounded-md">
                Create Free Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── 6. Trust & Safety Guarantee Bar ──────────────────────────────────── */}
      <section className="border-t border-slate-200 bg-white py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 text-center sm:text-left">
          <div className="flex items-start space-x-3.5">
            <div className="h-10 w-10 rounded-full bg-[#fdf2f4] flex items-center justify-center text-[#841d37] flex-shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Posh Protect Guarantee</h4>
              <p className="text-xs text-slate-500 mt-1">
                Full buyer and swapper protection on all eligible transactions.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3.5">
            <div className="h-10 w-10 rounded-full bg-[#fdf2f4] flex items-center justify-center text-[#841d37] flex-shrink-0">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Simple Shipping & Tracking</h4>
              <p className="text-xs text-slate-500 mt-1">
                Pre-paid labels and tracked delivery straight to your door.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3.5">
            <div className="h-10 w-10 rounded-full bg-[#fdf2f4] flex items-center justify-center text-[#841d37] flex-shrink-0">
              <RefreshCw className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Circular Sustainable Fashion</h4>
              <p className="text-xs text-slate-500 mt-1">
                Keep wearable clothes out of landfills and in active closets.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
