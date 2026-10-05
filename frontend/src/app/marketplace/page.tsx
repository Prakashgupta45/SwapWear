'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '../../lib/api';
import { ClothingListing, Category, Condition, ListingStatus } from '../../types/listing';
import { ListingCard } from '../../components/ListingCard';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import {
  Search,
  SlidersHorizontal,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Loader2,
  ArrowUpDown,
  RotateCcw,
} from 'lucide-react';
import { CURATED_SHOWCASE_LISTINGS } from '../../lib/curatedListings';

const CATEGORIES: { label: string; value: Category | 'ALL' }[] = [
  { label: 'All Categories', value: 'ALL' },
  { label: 'Topwear', value: 'TOPWEAR' },
  { label: 'Bottomwear', value: 'BOTTOMWEAR' },
  { label: 'Dresses', value: 'DRESS' },
  { label: 'Outerwear', value: 'OUTERWEAR' },
  { label: 'Footwear', value: 'FOOTWEAR' },
  { label: 'Accessories', value: 'ACCESSORIES' },
];

const CONDITIONS: { label: string; value: Condition | 'ALL' }[] = [
  { label: 'All Conditions', value: 'ALL' },
  { label: 'New (with tags)', value: 'NEW' },
  { label: 'Like New (Mint)', value: 'LIKE_NEW' },
  { label: 'Good (Light wear)', value: 'GOOD' },
  { label: 'Fair (Visible wear)', value: 'FAIR' },
];

const SIZES = ['ALL', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36', '38'];

const VISUAL_CATEGORIES = [
  { label: 'Women', href: '/marketplace?department=women', img: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=300&q=80' },
  { label: 'Men', href: '/marketplace?department=men', img: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=300&q=80' },
  { label: 'Kids', href: '/marketplace?department=kids', img: 'https://images.unsplash.com/photo-1514090458221-65bb69cf63e6?auto=format&fit=crop&w=300&q=80' },
  { label: 'Home', href: '/marketplace?q=home', img: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=300&q=80' },
  { label: 'Pets', href: '/marketplace?q=pets', img: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=300&q=80' },
  { label: 'Electronics', href: '/marketplace?q=electronics', img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=300&q=80' },
  { label: 'Luxury', href: '/marketplace?sort=price_desc&q=luxury', img: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=300&q=80' },
  { label: 'Beauty', href: '/marketplace?category=ACCESSORIES&q=beauty', img: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=300&q=80' },
  { label: 'Plus', href: '/marketplace?size=XL', img: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=300&q=80' },
  { label: 'Petite', href: '/marketplace?size=XS', img: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=300&q=80' },
  { label: 'Trending', href: '/marketplace?sort=newest', img: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=300&q=80' },
  { label: 'Brand', href: '/marketplace?sort=newest', img: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=300&q=80' },
];

function MarketplaceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parse state from URL params
  const initialSearch = searchParams.get('search') || searchParams.get('q') || searchParams.get('department') || '';
  const initialCategory = (searchParams.get('category') as Category) || 'ALL';
  const initialBrand = searchParams.get('brand') || '';
  const initialSize = searchParams.get('size') || 'ALL';
  const initialCondition = (searchParams.get('condition') as Condition) || 'ALL';
  const initialMinValue = searchParams.get('minValue') || '';
  const initialMaxValue = searchParams.get('maxValue') || '';
  const initialLocation = searchParams.get('location') || '';
  const initialStatus = (searchParams.get('status') as ListingStatus) || 'AVAILABLE';
  const initialSort = (searchParams.get('sort') as 'newest' | 'price_asc' | 'price_desc') || 'newest';
  const requestedPage = Number(searchParams.get('page') || '1');
  const initialPage = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  // Component states
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState<Category | 'ALL'>(initialCategory);
  const [brand, setBrand] = useState(initialBrand);
  const [size, setSize] = useState(initialSize);
  const [condition, setCondition] = useState<Condition | 'ALL'>(initialCondition);
  const [minValue, setMinValue] = useState(initialMinValue);
  const [maxValue, setMaxValue] = useState(initialMaxValue);
  const [location, setLocation] = useState(initialLocation);
  const [status, setStatus] = useState<ListingStatus | 'ALL'>(initialStatus);
  const [sort, setSort] = useState<'newest' | 'price_asc' | 'price_desc'>(initialSort);
  const [page, setPage] = useState(initialPage);

  const [listings, setListings] = useState<ClothingListing[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Keep component state in sync whenever URL searchParams change (from Navbar search, back/forward buttons, or links)
  useEffect(() => {
    const qParam =
      searchParams.get('q') ||
      searchParams.get('query') ||
      searchParams.get('search') ||
      searchParams.get('department') ||
      '';
    const catParam = (searchParams.get('category') as Category) || 'ALL';
    const brandParam = searchParams.get('brand') || '';
    const sizeParam = searchParams.get('size') || 'ALL';
    const condParam = (searchParams.get('condition') as Condition) || 'ALL';
    const minParam = searchParams.get('minValue') || '';
    const maxParam = searchParams.get('maxValue') || '';
    const locParam = searchParams.get('location') || '';
    const statusParam = (searchParams.get('status') as ListingStatus) || 'AVAILABLE';
    const sortParam = (searchParams.get('sort') as 'newest' | 'price_asc' | 'price_desc') || 'newest';
    const pageParam = Number(searchParams.get('page') || '1');

    setSearch(qParam);
    setCategory(catParam);
    setBrand(brandParam);
    setSize(sizeParam);
    setCondition(condParam);
    setMinValue(minParam);
    setMaxValue(maxParam);
    setLocation(locParam);
    setStatus(statusParam);
    setSort(sortParam);
    setPage(Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1);
  }, [searchParams]);

  // Sync state to URL & fetch listings from database
  useEffect(() => {
    let cancelled = false;
    const timeoutId = window.setTimeout(async () => {
    async function fetchMarketplaceData() {
      setIsLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (search) queryParams.set('q', search);
        if (category !== 'ALL') queryParams.set('category', category);
        if (brand) queryParams.set('brand', brand);
        if (size !== 'ALL') queryParams.set('size', size);
        if (condition !== 'ALL') queryParams.set('condition', condition);
        if (minValue) queryParams.set('minValue', minValue);
        if (maxValue) queryParams.set('maxValue', maxValue);
        if (location) queryParams.set('location', location);
        queryParams.set('status', status);
        if (sort !== 'newest') queryParams.set('sort', sort);
        if (page > 1) queryParams.set('page', page.toString());
        queryParams.set('limit', '12');

        const queryString = queryParams.toString();
        const targetUrl = `/marketplace${queryString ? `?${queryString}` : ''}`;
        if (typeof window !== 'undefined' && window.location.pathname + window.location.search !== targetUrl) {
          router.replace(targetUrl, { scroll: false });
        }

        const response = await api.getListings({
          search: search || undefined,
          category: category === 'ALL' ? undefined : category,
          brand: brand || undefined,
          size: size === 'ALL' ? undefined : size,
          condition: condition === 'ALL' ? undefined : condition,
          minValue: minValue || undefined,
          maxValue: maxValue || undefined,
          location: location || undefined,
          status,
          sort,
          page,
          limit: 12,
        });

        if (!cancelled && response.success && response.data) {
          if (response.data.data && response.data.data.length > 0) {
            setListings(response.data.data);
            setTotal(response.data.total || 0);
            setTotalPages(response.data.totalPages || 1);
          } else {
            // Apply current filters to curated showcase items
            let filtered = [...CURATED_SHOWCASE_LISTINGS];
            if (category !== 'ALL') {
              filtered = filtered.filter((item) => item.category === category);
            }
            if (search) {
              const q = search.toLowerCase();
              filtered = filtered.filter(
                (item) =>
                  item.title.toLowerCase().includes(q) ||
                  (item.brand && item.brand.toLowerCase().includes(q)) ||
                  (item.description && item.description.toLowerCase().includes(q))
              );
            }
            if (brand) {
              filtered = filtered.filter((item) => item.brand && item.brand.toLowerCase().includes(brand.toLowerCase()));
            }
            if (size !== 'ALL') {
              filtered = filtered.filter((item) => item.size.toLowerCase() === size.toLowerCase());
            }
            if (condition !== 'ALL') {
              filtered = filtered.filter((item) => item.condition === condition);
            }
            setListings(filtered);
            setTotal(filtered.length);
            setTotalPages(Math.max(1, Math.ceil(filtered.length / 12)));
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.warn('Backend unavailable, showing curated showcase items:', err);
          let filtered = [...CURATED_SHOWCASE_LISTINGS];
          if (category !== 'ALL') {
            filtered = filtered.filter((item) => item.category === category);
          }
          if (search) {
            const q = search.toLowerCase();
            filtered = filtered.filter(
              (item) =>
                item.title.toLowerCase().includes(q) ||
                (item.brand && item.brand.toLowerCase().includes(q)) ||
                (item.description && item.description.toLowerCase().includes(q))
            );
          }
          setListings(filtered);
          setTotal(filtered.length);
          setTotalPages(Math.max(1, Math.ceil(filtered.length / 12)));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchMarketplaceData();
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [search, category, brand, size, condition, minValue, maxValue, location, status, sort, page, router]);

  const handleResetFilters = () => {
    setSearch('');
    setCategory('ALL');
    setBrand('');
    setSize('ALL');
    setCondition('ALL');
    setMinValue('');
    setMaxValue('');
    setLocation('');
    setStatus('AVAILABLE');
    setSort('newest');
    setPage(1);
  };

  const hasActiveFilters =
    search ||
    category !== 'ALL' ||
    brand ||
    size !== 'ALL' ||
    condition !== 'ALL' ||
    minValue ||
    maxValue ||
    location ||
    status !== 'AVAILABLE' ||
    sort !== 'newest';

  return (
    <div className="flex-1 flex flex-col bg-slate-50/50">
      {/* ── 1. Hero Section ───────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-[#1a050b] via-[#4a0d1d] to-[#1a050b] text-white py-14 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
          <div className="space-y-4 max-w-2xl text-center md:text-left">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#841d37]/80 border border-[#e5748e]/30 text-[#fbe5e9] text-xs font-semibold tracking-wide">
              <span>SwapWear Circular Marketplace</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-serif font-extrabold tracking-tight leading-tight">
              Give Your Clothes a Second Life
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl font-normal">
              Discover unique fashion, exchange unworn garments, and refresh your style with zero landfill impact.
            </p>

            <div className="pt-2 flex items-center justify-center md:justify-start space-x-3">
              <a href="#discovery">
                <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 font-bold rounded-full px-7">
                  Explore Swaps
                </Button>
              </a>
              <Link href="/listings/new">
                <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10 rounded-full px-7">
                  List Your Garment
                </Button>
              </Link>
            </div>
          </div>

          <div aria-hidden="true" className="hidden lg:block border-l border-white/25 pl-10 py-3">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#f0a7b6]">Wear well</p>
            <p className="mt-2 text-5xl font-serif font-bold leading-none">Swap often.</p>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-slate-300">
              A better find is already in someone&apos;s closet.
            </p>
          </div>
        </div>
      </section>

      {/* ── Visual Department Showcase with Images ─────────────────────────── */}
      <section className="bg-white border-b border-slate-200/80 py-5 px-4 sm:px-6 lg:px-8 shadow-2xs">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between pb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Browse by Department & Category
            </h2>
            <span className="text-[11px] text-slate-400 hidden sm:inline">Tap any category to filter</span>
          </div>

          <div className="flex items-center space-x-5 overflow-x-auto scrollbar-none pb-2 pt-1">
            {VISUAL_CATEGORIES.map((cat) => {
              const currentQ = search.toLowerCase();
              const isActive =
                (cat.label === 'Women' && currentQ === 'women') ||
                (cat.label === 'Men' && currentQ === 'men') ||
                (cat.label === 'Kids' && currentQ === 'kids') ||
                (cat.label === 'Home' && currentQ === 'home') ||
                (cat.label === 'Pets' && currentQ === 'pets') ||
                (cat.label === 'Electronics' && currentQ === 'electronics') ||
                (cat.label === 'Luxury' && currentQ === 'luxury') ||
                (cat.label === 'Beauty' && currentQ === 'beauty') ||
                (cat.label === 'Plus' && size === 'XL') ||
                (cat.label === 'Petite' && size === 'XS') ||
                (cat.label === 'Trending' && sort === 'newest' && !search);

              return (
                <Link
                  key={cat.label}
                  href={cat.href}
                  className="flex flex-col items-center group flex-shrink-0 focus:outline-none"
                >
                  <div
                    className={`h-16 w-16 sm:h-20 sm:w-20 rounded-full overflow-hidden border-2 transition-all p-0.5 shadow-2xs ${
                      isActive
                        ? 'border-[#841d37] ring-2 ring-[#841d37]/30 scale-105'
                        : 'border-slate-200 group-hover:border-[#841d37] group-hover:shadow-md'
                    }`}
                  >
                    <img
                      src={cat.img}
                      alt={cat.label}
                      referrerPolicy="no-referrer"
                      className="h-full w-full rounded-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <span
                    className={`mt-2 text-xs font-semibold tracking-tight transition-colors ${
                      isActive
                        ? 'text-[#841d37] font-bold'
                        : 'text-slate-700 group-hover:text-[#841d37]'
                    }`}
                  >
                    {cat.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 2. Top Category Navigation Bar ────────────────────────────────── */}
      <nav aria-label="Clothing categories" className="bg-slate-50 border-b border-slate-200 sticky top-40 lg:top-28 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center space-x-3 overflow-x-auto scrollbar-none py-2.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              aria-pressed={category === cat.value}
              onClick={() => {
                setCategory(cat.value);
                setPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                category === cat.value
                  ? 'bg-[#841d37] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </nav>

      {/* ── 3. Main Discovery & Search Section ────────────────────────────── */}
      <section id="discovery" className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Search & Sort Header Controls */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
          {/* Search Bar Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              aria-label="Search clothing by title, brand, category, or description"
              placeholder="Search by title, brand, category, or description..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-[#841d37] focus:ring-1 focus:ring-[#841d37]"
            />
            {search && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Controls: Filter Mobile Toggle & Sorting Selector */}
          <div className="flex items-center justify-between md:justify-end gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
              aria-expanded={isMobileFiltersOpen}
              aria-controls="marketplace-filters"
              className="lg:hidden text-xs font-semibold"
            >
              <SlidersHorizontal className="h-4 w-4 mr-1.5 text-[#841d37]" />
              Filters {hasActiveFilters && <span className="ml-1 text-[#841d37] font-bold">•</span>}
            </Button>

            <div className="flex items-center space-x-2 text-xs text-slate-600">
              <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
              <span className="font-semibold hidden sm:inline">Sort:</span>
              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value as any);
                  setPage(1);
                }}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#841d37]"
              >
                <option value="newest">Newest First</option>
                <option value="price_asc">Swap Value: Low to High</option>
                <option value="price_desc">Swap Value: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Layout Grid: Sidebar Filters + Products Container */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* ── Desktop Sidebar Filters ───────────────────────────────────── */}
          {isMobileFiltersOpen && (
            <button
              type="button"
              aria-label="Close filters"
              onClick={() => setIsMobileFiltersOpen(false)}
              className="fixed inset-0 z-30 bg-slate-950/35 lg:hidden"
            />
          )}
          <aside
            id="marketplace-filters"
            aria-label="Marketplace filters"
            role={isMobileFiltersOpen ? 'dialog' : undefined}
            aria-modal={isMobileFiltersOpen || undefined}
            className={`${isMobileFiltersOpen ? 'fixed inset-x-4 top-44 z-40 max-h-[calc(100vh-12rem)] overflow-y-auto lg:sticky lg:inset-auto lg:top-40 lg:max-h-none' : 'hidden lg:block'} space-y-6 bg-white p-5 rounded-lg border border-slate-200/80 shadow-2xs h-fit`}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 font-bold text-slate-900 text-sm">
                <Filter className="h-4 w-4 text-[#841d37]" />
                <span>Filters</span>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="text-xs text-[#841d37] font-semibold hover:underline flex items-center"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Reset
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsMobileFiltersOpen(false)}
                aria-label="Close filters"
                className="lg:hidden rounded p-1 text-slate-600 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Filter: Category */}
            <div className="space-y-2">
              <Label htmlFor="filter-category" className="text-xs font-bold text-slate-700 uppercase tracking-wider">Category</Label>
              <select
                id="filter-category"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value as Category | 'ALL');
                  setPage(1);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#841d37]"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter: Brand */}
            <div className="space-y-2">
              <Label htmlFor="filter-brand" className="text-xs font-bold text-slate-700 uppercase tracking-wider">Brand</Label>
              <Input
                id="filter-brand"
                placeholder="e.g. Levi's, Zara, Nike"
                value={brand}
                onChange={(e) => {
                  setBrand(e.target.value);
                  setPage(1);
                }}
                className="text-xs h-9"
              />
            </div>

            {/* Filter: Size */}
            <div className="space-y-2">
              <span id="filter-size-label" className="text-xs font-bold text-slate-700 uppercase tracking-wider">Size</span>
              <div role="group" aria-labelledby="filter-size-label" className="flex flex-wrap gap-1.5">
                {SIZES.map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    aria-pressed={size === sz}
                    onClick={() => {
                      setSize(sz);
                      setPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                      size === sz
                        ? 'bg-[#841d37] text-white border-[#841d37] font-bold'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter: Condition */}
            <div className="space-y-2">
              <Label htmlFor="filter-condition" className="text-xs font-bold text-slate-700 uppercase tracking-wider">Condition</Label>
              <select
                id="filter-condition"
                value={condition}
                onChange={(e) => {
                  setCondition(e.target.value as Condition | 'ALL');
                  setPage(1);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#841d37]"
              >
                {CONDITIONS.map((cond) => (
                  <option key={cond.value} value={cond.value}>
                    {cond.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-status" className="text-xs font-bold text-slate-700 uppercase tracking-wider">Availability</Label>
              <select
                id="filter-status"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as ListingStatus | 'ALL');
                  setPage(1);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#841d37]"
              >
                <option value="ALL">Any availability</option>
                <option value="AVAILABLE">Available</option>
                <option value="RESERVED">Reserved</option>
                <option value="SWAPPED">Swapped</option>
              </select>
            </div>

            {/* Filter: Estimated Swap Value Range */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Est. Swap Value ($)</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  aria-label="Minimum estimated swap value"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Min ($)"
                  value={minValue}
                  onChange={(e) => {
                    setMinValue(e.target.value);
                    setPage(1);
                  }}
                  className="text-xs h-9"
                />
                <Input
                  aria-label="Maximum estimated swap value"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Max ($)"
                  value={maxValue}
                  onChange={(e) => {
                    setMaxValue(e.target.value);
                    setPage(1);
                  }}
                  className="text-xs h-9"
                />
              </div>
            </div>

            {/* Filter: Location */}
            <div className="space-y-2">
              <Label htmlFor="filter-location" className="text-xs font-bold text-slate-700 uppercase tracking-wider">Owner Location</Label>
              <Input
                id="filter-location"
                placeholder="City or state..."
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  setPage(1);
                }}
                className="text-xs h-9"
              />
            </div>
          </aside>

          {/* ── Main Products Grid ────────────────────────────────────────── */}
          <section aria-label="Marketplace listings" className="lg:col-span-3 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-serif font-bold text-slate-900">
                Discover Something New
              </h2>
              <span className="text-xs font-semibold text-slate-500">
                Showing {listings.length} of {total} items
              </span>
            </div>

            {isLoading ? (
              <div className="min-h-[40vh] flex flex-col items-center justify-center space-y-3 bg-white rounded-lg border border-slate-200">
                <Loader2 className="h-8 w-8 animate-spin text-[#841d37]" />
                <p className="text-xs font-semibold text-slate-500">Searching database listings...</p>
              </div>
            ) : listings.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-lg border border-dashed border-slate-300 space-y-4">
                <RefreshCw className="h-10 w-10 text-slate-400 mx-auto" />
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900">No Matching Garments Found</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Try adjusting your search query, clearing specific filters, or checking back later!
                  </p>
                </div>
                {hasActiveFilters && (
                  <Button onClick={handleResetFilters} variant="outline" size="sm" className="rounded-full">
                    Reset All Filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                {listings.map((item) => (
                  <ListingCard key={item.id} listing={item} />
                ))}
              </div>
            )}

            {/* ── 4. Server-Side Pagination Controls ────────────────────────── */}
            {totalPages > 1 && (
              <nav aria-label="Marketplace pagination" className="flex items-center justify-between border-t border-slate-200 pt-6 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page <= 1 || isLoading}
                  className="text-xs font-semibold rounded-full"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>

                <span className="text-xs font-semibold text-slate-600">
                  Page <span className="text-slate-900 font-bold">{page}</span> of{' '}
                  <span className="text-slate-900 font-bold">{totalPages}</span>
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={page >= totalPages || isLoading}
                  className="text-xs font-semibold rounded-full"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </nav>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#841d37]" />
          <p className="text-xs font-semibold text-slate-500">Loading Marketplace...</p>
        </div>
      }
    >
      <MarketplaceContent />
    </Suspense>
  );
}
