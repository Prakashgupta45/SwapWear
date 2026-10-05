'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Search,
  User as UserIcon,
  LogOut,
  Shirt,
  UserCheck,
  LayoutDashboard,
  ChevronDown,
  Radio,
  RefreshCw,
  Shield,
} from 'lucide-react';

const SEARCH_TYPES = ['Listings', 'Closets', 'Brands', 'Boutiques'];

const NAV_CATEGORIES = [
  { label: 'Women', href: '/marketplace?department=women' },
  { label: 'Men', href: '/marketplace?department=men' },
  { label: 'Kids', href: '/marketplace?department=kids' },
  { label: 'Home', href: '/marketplace?q=home' },
  { label: 'Pets', href: '/marketplace?q=pets' },
  { label: 'Electronics', href: '/marketplace?q=electronics' },
  { label: 'Luxury', href: '/marketplace?sort=price_desc&q=luxury' },
  { label: 'Beauty', href: '/marketplace?category=ACCESSORIES&q=beauty' },
  { label: 'Plus', href: '/marketplace?size=XL' },
  { label: 'Petite', href: '/marketplace?size=XS' },
  { label: 'Trending', href: '/marketplace?sort=newest' },
  { label: 'Brand', href: '/marketplace?sort=newest' },
  { label: 'Posh Live', href: '/marketplace?live=true', isLive: true },
];

interface CategoryMegaMenu {
  subcategoriesCol1: { label: string; href: string }[];
  subcategoriesCol2: { label: string; href: string }[];
  featuredCards: { title: string; href: string; img: string }[];
}

const MEGA_MENU_DATA: Record<string, CategoryMegaMenu> = {
  Women: {
    subcategoriesCol1: [
      { label: 'All Women', href: '/marketplace?department=women' },
      { label: 'Dresses', href: '/marketplace?category=DRESS&department=women' },
      { label: 'Tops & Blouses', href: '/marketplace?category=TOPWEAR&department=women' },
      { label: 'Sweaters & Knits', href: '/marketplace?q=sweater&department=women' },
      { label: 'Jackets & Coats', href: '/marketplace?category=OUTERWEAR&department=women' },
      { label: 'Jeans', href: '/marketplace?q=jeans&department=women' },
      { label: 'Pants', href: '/marketplace?category=BOTTOMWEAR&department=women' },
      { label: 'Skirts', href: '/marketplace?q=skirt&department=women' },
      { label: 'Shoes', href: '/marketplace?category=FOOTWEAR&department=women' },
      { label: 'Bags & Handbags', href: '/marketplace?category=ACCESSORIES&department=women' },
    ],
    subcategoriesCol2: [
      { label: 'Jewelry', href: '/marketplace?q=jewelry' },
      { label: 'Accessories', href: '/marketplace?category=ACCESSORIES' },
      { label: 'Swim', href: '/marketplace?q=swim' },
      { label: 'Intimates & Sleepwear', href: '/marketplace?q=sleepwear' },
      { label: 'Activewear', href: '/marketplace?q=activewear' },
      { label: 'Plus Size', href: '/marketplace?size=XL' },
      { label: 'Petite', href: '/marketplace?size=XS' },
    ],
    featuredCards: [
      { title: 'Evening Elegance', href: '/marketplace?category=DRESS&q=luxury', img: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=400&q=80' },
      { title: 'Capsule Wardrobe', href: '/marketplace?department=women&sort=newest', img: 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=400&q=80' },
      { title: 'Autumn Trench & Knits', href: '/marketplace?category=OUTERWEAR', img: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=400&q=80' },
    ],
  },
  Men: {
    subcategoriesCol1: [
      { label: 'All Men', href: '/marketplace?department=men' },
      { label: 'Accessories', href: '/marketplace?category=ACCESSORIES&department=men' },
      { label: 'Bags', href: '/marketplace?q=bag&department=men' },
      { label: 'Jackets & Coats', href: '/marketplace?category=OUTERWEAR&department=men' },
      { label: 'Jeans', href: '/marketplace?q=jeans&department=men' },
      { label: 'Pants', href: '/marketplace?category=BOTTOMWEAR&department=men' },
      { label: 'Shirts', href: '/marketplace?category=TOPWEAR&department=men' },
      { label: 'Shoes', href: '/marketplace?category=FOOTWEAR&department=men' },
      { label: 'Shorts', href: '/marketplace?q=shorts&department=men' },
      { label: 'Suits & Blazers', href: '/marketplace?q=blazer&department=men' },
    ],
    subcategoriesCol2: [
      { label: 'Sweaters', href: '/marketplace?q=sweater&department=men' },
      { label: 'Swim', href: '/marketplace?q=swim&department=men' },
      { label: 'Underwear & Socks', href: '/marketplace?q=socks&department=men' },
      { label: 'Grooming', href: '/marketplace?q=grooming' },
      { label: 'Other', href: '/marketplace?department=men' },
    ],
    featuredCards: [
      { title: 'Formalwear', href: '/marketplace?q=blazer&department=men', img: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=400&q=80' },
      { title: 'Activewear', href: '/marketplace?q=activewear&department=men', img: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=400&q=80' },
      { title: 'Fall Essentials', href: '/marketplace?category=OUTERWEAR&department=men', img: 'https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?auto=format&fit=crop&w=400&q=80' },
    ],
  },
  Kids: {
    subcategoriesCol1: [
      { label: 'All Kids', href: '/marketplace?department=kids' },
      { label: "Girls' Clothing", href: '/marketplace?q=girls&department=kids' },
      { label: "Boys' Clothing", href: '/marketplace?q=boys&department=kids' },
      { label: 'Baby & Toddler', href: '/marketplace?q=baby&department=kids' },
      { label: "Kids' Shoes", href: '/marketplace?category=FOOTWEAR&department=kids' },
      { label: "Kids' Outerwear & Coats", href: '/marketplace?category=OUTERWEAR&department=kids' },
    ],
    subcategoriesCol2: [
      { label: 'Pajamas & Robes', href: '/marketplace?q=pajamas&department=kids' },
      { label: 'Costumes & Dress Up', href: '/marketplace?q=costume&department=kids' },
      { label: 'Backpacks & Bags', href: '/marketplace?category=ACCESSORIES&department=kids' },
      { label: 'Toys & Games', href: '/marketplace?q=toy' },
    ],
    featuredCards: [
      { title: 'Playful Denim & Sets', href: '/marketplace?department=kids', img: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=400&q=80' },
      { title: 'Cozy Outerwear', href: '/marketplace?category=OUTERWEAR&department=kids', img: 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&w=400&q=80' },
      { title: 'School Essentials', href: '/marketplace?category=ACCESSORIES&department=kids', img: 'https://images.unsplash.com/photo-1514090458221-65bb69cf63e6?auto=format&fit=crop&w=400&q=80' },
    ],
  },
  Home: {
    subcategoriesCol1: [
      { label: 'All Home', href: '/marketplace?q=home' },
      { label: 'Bedding & Blankets', href: '/marketplace?q=blanket' },
      { label: 'Throw Pillows & Accents', href: '/marketplace?q=pillow' },
      { label: 'Wall Art & Prints', href: '/marketplace?q=art' },
      { label: 'Dining & Tabletop', href: '/marketplace?q=dining' },
    ],
    subcategoriesCol2: [
      { label: 'Lighting & Lamps', href: '/marketplace?q=lamp' },
      { label: 'Candles & Fragrance', href: '/marketplace?q=candle' },
      { label: 'Organization & Storage', href: '/marketplace?q=storage' },
      { label: 'Holiday & Seasonal', href: '/marketplace?q=holiday' },
    ],
    featuredCards: [
      { title: 'Handwoven Throws', href: '/marketplace?q=blanket', img: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=400&q=80' },
      { title: 'Artisanal Ceramics', href: '/marketplace?q=ceramic', img: 'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=400&q=80' },
      { title: 'Living Room Styling', href: '/marketplace?q=decor', img: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&q=80' },
    ],
  },
  Pets: {
    subcategoriesCol1: [
      { label: 'All Pets', href: '/marketplace?q=pets' },
      { label: 'Dog Apparel & Sweaters', href: '/marketplace?q=dog+sweater' },
      { label: 'Collars, Leashes & Harnesses', href: '/marketplace?q=collar' },
      { label: 'Raincoats & Outerwear', href: '/marketplace?q=dog+coat' },
    ],
    subcategoriesCol2: [
      { label: 'Pet Beds & Blankets', href: '/marketplace?q=pet+bed' },
      { label: 'Pet Toys', href: '/marketplace?q=pet+toy' },
      { label: 'Pet Carriers & Travel', href: '/marketplace?q=carrier' },
      { label: 'Feeding & Bowls', href: '/marketplace?q=bowl' },
    ],
    featuredCards: [
      { title: 'Knit Dog Sweaters', href: '/marketplace?q=dog+sweater', img: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=400&q=80' },
      { title: 'Outdoor Walking Gear', href: '/marketplace?q=leash', img: 'https://images.unsplash.com/photo-1535930891776-0c2dfb7fda1a?auto=format&fit=crop&w=400&q=80' },
      { title: 'Cozy Pet Nooks', href: '/marketplace?q=pets', img: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=400&q=80' },
    ],
  },
  Electronics: {
    subcategoriesCol1: [
      { label: 'All Electronics', href: '/marketplace?q=electronics' },
      { label: 'Smartwatch Bands & Straps', href: '/marketplace?q=smartwatch' },
      { label: 'Headphones & Audio', href: '/marketplace?q=headphones' },
      { label: 'Phone Cases & Wallets', href: '/marketplace?q=case' },
    ],
    subcategoriesCol2: [
      { label: 'Camera Bags & Straps', href: '/marketplace?q=camera' },
      { label: 'Portable Tech Accessories', href: '/marketplace?q=cable' },
      { label: 'Laptop Sleeves & Bags', href: '/marketplace?q=laptop+bag' },
    ],
    featuredCards: [
      { title: 'Wireless Audio', href: '/marketplace?q=headphones', img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80' },
      { title: 'Leather Watch Bands', href: '/marketplace?q=smartwatch', img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80' },
      { title: 'Designer Tech Cases', href: '/marketplace?q=case', img: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=400&q=80' },
    ],
  },
  Luxury: {
    subcategoriesCol1: [
      { label: 'All Luxury', href: '/marketplace?sort=price_desc&q=luxury' },
      { label: 'Designer Handbags', href: '/marketplace?sort=price_desc&category=ACCESSORIES' },
      { label: 'Luxury Watches & Fine Jewelry', href: '/marketplace?sort=price_desc&q=watch' },
      { label: 'Designer Shoes & Pumps', href: '/marketplace?sort=price_desc&category=FOOTWEAR' },
      { label: 'Luxury Outerwear & Furs', href: '/marketplace?sort=price_desc&category=OUTERWEAR' },
    ],
    subcategoriesCol2: [
      { label: 'Silk Scarves & Wraps', href: '/marketplace?sort=price_desc&q=scarf' },
      { label: 'Designer Wallets & Small Leather Goods', href: '/marketplace?sort=price_desc&q=wallet' },
      { label: 'Haute Couture Dresses', href: '/marketplace?sort=price_desc&category=DRESS' },
    ],
    featuredCards: [
      { title: 'Iconic Quilted Leather', href: '/marketplace?sort=price_desc&q=chanel', img: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=400&q=80' },
      { title: 'Italian Silk Twill', href: '/marketplace?sort=price_desc&q=gucci', img: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&w=400&q=80' },
      { title: 'High-End Timepieces', href: '/marketplace?sort=price_desc&q=watch', img: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=400&q=80' },
    ],
  },
  Beauty: {
    subcategoriesCol1: [
      { label: 'All Beauty', href: '/marketplace?category=ACCESSORIES&q=beauty' },
      { label: 'Luxury Fragrance & Perfume', href: '/marketplace?q=perfume' },
      { label: 'Skincare & Serums', href: '/marketplace?q=skincare' },
      { label: 'Makeup & Palettes', href: '/marketplace?q=makeup' },
    ],
    subcategoriesCol2: [
      { label: 'Cosmetic Cases & Pouches', href: '/marketplace?q=cosmetic+bag' },
      { label: 'Hair Tools & Silk Wraps', href: '/marketplace?q=hair' },
      { label: 'Bath & Body Care', href: '/marketplace?q=bath' },
    ],
    featuredCards: [
      { title: 'Luxury Vanity Pouches', href: '/marketplace?q=vanity', img: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80' },
      { title: 'Artisanal Perfumes', href: '/marketplace?q=perfume', img: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=400&q=80' },
      { title: 'Radiant Skincare', href: '/marketplace?q=skincare', img: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=400&q=80' },
    ],
  },
  Plus: {
    subcategoriesCol1: [
      { label: 'All Plus Size', href: '/marketplace?size=XL' },
      { label: 'Plus Dresses & Gowns', href: '/marketplace?size=XL&category=DRESS' },
      { label: 'Plus Tops & Sweaters', href: '/marketplace?size=XL&category=TOPWEAR' },
      { label: 'Plus Jackets & Outerwear', href: '/marketplace?size=XL&category=OUTERWEAR' },
    ],
    subcategoriesCol2: [
      { label: 'Plus Jeans & Pants', href: '/marketplace?size=XL&category=BOTTOMWEAR' },
      { label: 'Plus Activewear & Leggings', href: '/marketplace?size=XL&q=activewear' },
      { label: 'Plus Swimwear', href: '/marketplace?size=XL&q=swim' },
    ],
    featuredCards: [
      { title: 'Velvet Evening Wrap', href: '/marketplace?size=XL&category=DRESS', img: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=400&q=80' },
      { title: 'Tailored Wide-Legs', href: '/marketplace?size=XL&category=BOTTOMWEAR', img: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=400&q=80' },
      { title: 'Chic Everyday Knits', href: '/marketplace?size=XL&category=TOPWEAR', img: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=400&q=80' },
    ],
  },
  Petite: {
    subcategoriesCol1: [
      { label: 'All Petite', href: '/marketplace?size=XS' },
      { label: 'Petite Blazers & Suits', href: '/marketplace?size=XS&category=OUTERWEAR' },
      { label: 'Petite Dresses', href: '/marketplace?size=XS&category=DRESS' },
      { label: 'Petite Pants & Jeans', href: '/marketplace?size=XS&category=BOTTOMWEAR' },
    ],
    subcategoriesCol2: [
      { label: 'Petite Tops & Silk Shirts', href: '/marketplace?size=XS&category=TOPWEAR' },
      { label: 'Petite Skirts', href: '/marketplace?size=XS&q=skirt' },
      { label: 'Petite Outerwear', href: '/marketplace?size=XS&category=OUTERWEAR' },
    ],
    featuredCards: [
      { title: 'Houndstooth Blazer', href: '/marketplace?size=XS&category=OUTERWEAR', img: 'https://images.unsplash.com/photo-1554412933-514a83d2f3c8?auto=format&fit=crop&w=400&q=80' },
      { title: 'Satin Slip Skirt', href: '/marketplace?size=XS&category=BOTTOMWEAR', img: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=400&q=80' },
      { title: 'Petite Cocktail Dress', href: '/marketplace?size=XS&category=DRESS', img: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=400&q=80' },
    ],
  },
  Trending: {
    subcategoriesCol1: [
      { label: 'All Trending Now', href: '/marketplace?sort=newest' },
      { label: 'Viral Streetwear', href: '/marketplace?q=streetwear&sort=newest' },
      { label: 'Chunky Lug Footwear', href: '/marketplace?category=FOOTWEAR&sort=newest' },
      { label: '90s Vintage Denim', href: '/marketplace?q=vintage&sort=newest' },
    ],
    subcategoriesCol2: [
      { label: 'Oversized Blazers', href: '/marketplace?q=blazer&sort=newest' },
      { label: 'Baguette & Shoulder Bags', href: '/marketplace?category=ACCESSORIES&sort=newest' },
      { label: 'Leather Bomber Jackets', href: '/marketplace?category=OUTERWEAR&sort=newest' },
    ],
    featuredCards: [
      { title: 'Heavyweight Hoodies', href: '/marketplace?q=hoodie', img: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=400&q=80' },
      { title: 'Platform Lug Loafers', href: '/marketplace?category=FOOTWEAR', img: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=400&q=80' },
      { title: 'Retro Streetwear', href: '/marketplace?sort=newest', img: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=400&q=80' },
    ],
  },
  Brand: {
    subcategoriesCol1: [
      { label: 'Nike', href: '/marketplace?brand=Nike' },
      { label: "Levi's", href: "/marketplace?brand=Levi's" },
      { label: 'Zara', href: '/marketplace?brand=Zara' },
      { label: 'Reformation', href: '/marketplace?brand=Reformation' },
      { label: 'Aritzia', href: '/marketplace?brand=Aritzia' },
      { label: 'Patagonia', href: '/marketplace?brand=Patagonia' },
    ],
    subcategoriesCol2: [
      { label: 'Ralph Lauren', href: '/marketplace?brand=Ralph+Lauren' },
      { label: 'Lululemon', href: '/marketplace?brand=Lululemon' },
      { label: 'Coach', href: '/marketplace?brand=Coach' },
      { label: 'Gucci', href: '/marketplace?brand=Gucci' },
      { label: 'Chanel', href: '/marketplace?brand=Chanel' },
      { label: 'Schott NYC', href: '/marketplace?brand=Schott+NYC' },
    ],
    featuredCards: [
      { title: "Levi's Heritage Denim", href: "/marketplace?brand=Levi's", img: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=400&q=80' },
      { title: 'Aritzia Modern Coats', href: '/marketplace?brand=Aritzia', img: 'https://images.unsplash.com/photo-1520975954732-35dd22299614?auto=format&fit=crop&w=400&q=80' },
      { title: 'Reformation Silks', href: '/marketplace?brand=Reformation', img: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=400&q=80' },
    ],
  },
};

const POPULAR_SUGGESTIONS = [
  { text: 'kids', type: 'Department' },
  { text: 'kids clothing', type: 'Category' },
  { text: 'kids jacket', type: 'Category' },
  { text: 'men', type: 'Department' },
  { text: "men's jacket", type: 'Category' },
  { text: "men's shirt", type: 'Category' },
  { text: "men's jeans", type: 'Category' },
  { text: 'women', type: 'Department' },
  { text: "women's dress", type: 'Category' },
  { text: 'Nike', type: 'Brand' },
  { text: "Levi's", type: 'Brand' },
  { text: 'Zara', type: 'Brand' },
  { text: 'Patagonia', type: 'Brand' },
  { text: 'Ralph Lauren', type: 'Brand' },
  { text: 'Aritzia', type: 'Brand' },
  { text: 'Schott NYC', type: 'Brand' },
];

export function Navbar() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('Listings');
  const [isSearchFilterOpen, setIsSearchFilterOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const menuTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Sync searchQuery with URL query parameter on mount and route changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const q =
        params.get('q') ||
        params.get('query') ||
        params.get('search') ||
        params.get('department') ||
        '';
      if (q) setSearchQuery(q);
    }
  }, []);

  // Click outside listener for search suggestions
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMouseEnter = (label: string) => {
    if (menuTimeoutRef.current) clearTimeout(menuTimeoutRef.current);
    if (label !== 'Posh Live' && MEGA_MENU_DATA[label]) {
      setActiveMegaMenu(label);
    } else {
      setActiveMegaMenu(null);
    }
  };

  const handleMouseLeave = () => {
    menuTimeoutRef.current = setTimeout(() => {
      setActiveMegaMenu(null);
    }, 220);
  };

  const handleMegaMenuEnter = () => {
    if (menuTimeoutRef.current) clearTimeout(menuTimeoutRef.current);
  };

  const handleMegaMenuLeave = () => {
    menuTimeoutRef.current = setTimeout(() => {
      setActiveMegaMenu(null);
    }, 180);
  };

  const executeSearch = (queryText: string) => {
    const trimmed = queryText.trim();
    setSearchQuery(trimmed);
    setIsSearchFocused(false);
    if (trimmed) {
      router.push(`/marketplace?q=${encodeURIComponent(trimmed)}&type=${selectedFilter.toLowerCase()}`);
    } else {
      router.push('/marketplace');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(searchQuery);
  };

  const filteredSuggestions = POPULAR_SUGGESTIONS.filter((s) =>
    s.text.toLowerCase().includes(searchQuery.trim().toLowerCase())
  ).slice(0, 6);

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-slate-200">
      {/* ── Top Header Row ─────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center space-x-2 flex-shrink-0 group">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[#841d37] flex items-center justify-center text-white shadow-sm">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z"/>
              </svg>
            </div>
            <span className="text-2xl sm:text-[24px] font-serif font-black tracking-[0.1em] text-[#841d37] group-hover:text-[#731c33] transition-colors">
              SWAPWEAR
            </span>
          </div>
        </Link>

        {/* Search Bar Container with Autocomplete Suggestions */}
        <div ref={searchContainerRef} className="flex-1 max-w-2xl hidden md:block relative">
          <form
            onSubmit={handleSearch}
            className="flex items-center rounded-full border border-slate-300 bg-white hover:border-slate-400 focus-within:border-[#841d37] focus-within:ring-1 focus-within:ring-[#841d37] transition-all h-10 px-3 shadow-2xs"
          >
            {/* Listings Type Dropdown */}
            <div className="relative flex-shrink-0">
              <button
                type="button"
                onClick={() => setIsSearchFilterOpen(!isSearchFilterOpen)}
                className="flex items-center text-xs font-semibold text-slate-700 hover:text-slate-900 py-1 pr-1.5 focus:outline-none"
              >
                <span>{selectedFilter}</span>
                <ChevronDown className="h-3.5 w-3.5 ml-1 text-slate-400" />
              </button>

              {isSearchFilterOpen && (
                <div
                  className="absolute left-0 top-full mt-2 w-32 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50 animate-in fade-in slide-in-from-top-1"
                  onMouseLeave={() => setIsSearchFilterOpen(false)}
                >
                  {SEARCH_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setSelectedFilter(type);
                        setIsSearchFilterOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-slate-50 transition-colors ${
                        selectedFilter === type ? 'text-[#841d37] font-bold bg-[#fdf2f4]' : 'text-slate-700'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Vertical Divider */}
            <div className="h-4 w-px bg-slate-200 mx-2 flex-shrink-0" />

            {/* Search Input Field */}
            <input
              type="text"
              aria-label="Search clothing listings"
              placeholder="What are you looking for?"
              value={searchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchFocused(true);
              }}
              className="flex-1 bg-transparent px-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />

            {/* Clear button if text entered */}
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  router.push('/marketplace');
                }}
                className="p-1 text-slate-400 hover:text-slate-600 focus:outline-none mr-1 text-xs"
                title="Clear search"
              >
                &times;
              </button>
            )}

            {/* Search Submit Button */}
            <button
              type="submit"
              className="p-1.5 text-slate-500 hover:text-[#841d37] transition-colors focus:outline-none"
              aria-label="Submit Search"
            >
              <Search className="h-4 w-4" />
            </button>
          </form>

          {/* Autocomplete Suggestions Dropdown */}
          {isSearchFocused && searchQuery.trim().length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-200/90 overflow-hidden z-50 py-1.5 animate-in fade-in slide-in-from-top-1 divide-y divide-slate-100">
              {/* Direct Query Option */}
              <button
                type="button"
                onMouseDown={() => executeSearch(searchQuery.trim())}
                className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center justify-between text-xs font-semibold text-[#841d37]"
              >
                <div className="flex items-center gap-2">
                  <Search className="h-3.5 w-3.5 text-[#841d37]" />
                  <span>Search for &ldquo;{searchQuery.trim()}&rdquo;</span>
                </div>
                <span className="text-[10px] text-slate-400 font-normal">in {selectedFilter}</span>
              </button>

              {/* Suggestions List */}
              {filteredSuggestions.length > 0 && (
                <div className="py-1">
                  <div className="px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Suggestions
                  </div>
                  {filteredSuggestions.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onMouseDown={() => executeSearch(item.text)}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center justify-between text-xs text-slate-800 transition-colors"
                    >
                      <span className="font-medium text-slate-900">{item.text}</span>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                        {item.type}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center space-x-4 flex-shrink-0">
          {/* Sell Now Button / Link */}
          <Link
            href={isAuthenticated ? '/listings/new' : '/login?redirect=/listings/new'}
            className="text-xs font-semibold text-slate-700 hover:text-[#841d37] transition-colors whitespace-nowrap px-1 py-1"
          >
            Sell Now
          </Link>

          {/* User Authentication Actions */}
          {isLoading ? (
            <div className="h-9 w-24 bg-slate-100 rounded-full animate-pulse" />
          ) : isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-full border border-slate-200 hover:border-slate-300 bg-slate-50/80 transition-colors text-xs font-semibold text-slate-800"
              >
                <div className="h-6 w-6 rounded-full bg-[#841d37] text-white flex items-center justify-center text-xs font-bold overflow-hidden shrink-0">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                  ) : (
                    user.name[0]?.toUpperCase()
                  )}
                </div>
                <span className="hidden sm:inline max-w-[100px] truncate">{user.name}</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2"
                  onMouseLeave={() => setIsUserMenuOpen(false)}
                >
                  <div className="px-4 py-2.5 border-b border-slate-100 flex items-center space-x-3">
                    <div className="h-9 w-9 rounded-full bg-[#841d37] text-white flex items-center justify-center text-sm font-bold overflow-hidden shrink-0">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                      ) : (
                        user.name[0]?.toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                      <Badge variant={user.role === 'ADMIN' ? 'admin' : 'default'} className="mt-1 text-[9px]">
                        {user.role}
                      </Badge>
                    </div>
                  </div>

                  <Link
                    href="/my-listings"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[#841d37]"
                  >
                    <Shirt className="h-3.5 w-3.5 mr-2 text-[#841d37]" />
                    My Closet & Listings
                  </Link>

                  <Link
                    href="/swap-requests"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[#841d37]"
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-2 text-[#841d37]" />
                    Swap Requests
                  </Link>

                  <Link
                    href="/profile"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[#841d37]"
                  >
                    <UserCheck className="h-3.5 w-3.5 mr-2 text-[#841d37]" />
                    My Profile
                  </Link>

                  <Link
                    href="/dashboard"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[#841d37]"
                  >
                    <LayoutDashboard className="h-3.5 w-3.5 mr-2 text-[#841d37]" />
                    Account Dashboard
                  </Link>

                  {user?.role === 'ADMIN' && (
                    <Link
                      href="/admin"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50"
                    >
                      <Shield className="h-3.5 w-3.5 mr-2 text-rose-600" />
                      Admin Panel
                    </Link>
                  )}

                  <div className="border-t border-slate-100 my-1" />

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 text-left"
                  >
                    <LogOut className="h-3.5 w-3.5 mr-2 text-red-500" />
                    Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login">
              <button
                type="button"
                className="bg-[#1c1c1c] text-white hover:bg-black rounded-md px-4 py-2 text-xs font-semibold shadow-xs transition-colors whitespace-nowrap"
              >
                Log in / Sign up
              </button>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Search Row */}
      <form
        onSubmit={handleSearch}
        className="md:hidden px-4 pb-2.5 flex items-center gap-2"
      >
        <div className="flex-1 flex items-center rounded-full border border-slate-300 bg-white px-3 py-1.5 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-600 mr-2 flex-shrink-0">{selectedFilter}</span>
          <div className="h-3.5 w-px bg-slate-200 mr-2 flex-shrink-0" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="What are you looking for?"
            className="min-w-0 flex-1 bg-transparent text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          aria-label="Search Marketplace"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1c1c1c] text-white hover:bg-black transition-colors flex-shrink-0"
        >
          <Search className="h-3.5 w-3.5" />
        </button>
      </form>

      {/* ── Sub-Header Category Navigation Bar with Mega Menu Dropdown ─────────────────────────────── */}
      <div className="relative border-t border-slate-200 bg-white" onMouseLeave={handleMouseLeave}>
        <nav aria-label="Marketplace categories" className="overflow-x-auto scrollbar-none">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between space-x-6 sm:space-x-8 h-10 text-xs font-medium text-slate-700 whitespace-nowrap">
            {NAV_CATEGORIES.map((cat) => (
              <div
                key={cat.label}
                onMouseEnter={() => handleMouseEnter(cat.label)}
                className="h-full flex items-center"
              >
                <Link
                  href={cat.href}
                  onClick={(e) => {
                    if (cat.label !== 'Posh Live' && MEGA_MENU_DATA[cat.label]) {
                      // On click, if menu is closed, open it; if open, let navigation occur
                      if (activeMegaMenu !== cat.label) {
                        e.preventDefault();
                        setActiveMegaMenu(cat.label);
                      } else {
                        setActiveMegaMenu(null);
                      }
                    }
                  }}
                  className={`py-2 transition-all flex items-center space-x-1.5 h-full ${
                    activeMegaMenu === cat.label
                      ? 'text-[#841d37] border-b-2 border-[#841d37] font-bold'
                      : 'hover:text-[#841d37]'
                  } ${cat.isLive ? 'text-[#d54868] font-bold' : ''}`}
                >
                  {cat.isLive && (
                    <span className="flex items-center space-x-1 text-[#d54868]">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                      </span>
                      <Radio className="h-3 w-3" />
                    </span>
                  )}
                  <span>{cat.label}</span>
                </Link>
              </div>
            ))}
          </div>
        </nav>

        {/* ── Mega Menu Dropdown Panel (Poshmark Style) ────────────────────────── */}
        {activeMegaMenu && MEGA_MENU_DATA[activeMegaMenu] && (
          <div
            onMouseEnter={handleMegaMenuEnter}
            onMouseLeave={handleMegaMenuLeave}
            className="absolute left-0 right-0 top-full bg-white border-b border-slate-200/90 shadow-2xl z-50 animate-in fade-in slide-in-from-top-1 duration-150"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row justify-between gap-10">
              {/* Left Side: Subcategories in 2 Columns */}
              <div className="flex gap-12 sm:gap-20 flex-shrink-0">
                {/* Column 1 */}
                <div className="space-y-2.5 min-w-[140px]">
                  {MEGA_MENU_DATA[activeMegaMenu].subcategoriesCol1.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setActiveMegaMenu(null)}
                      className="block text-xs text-slate-700 hover:text-[#841d37] hover:underline font-normal transition-colors"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>

                {/* Column 2 */}
                <div className="space-y-2.5 min-w-[140px]">
                  {MEGA_MENU_DATA[activeMegaMenu].subcategoriesCol2.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setActiveMegaMenu(null)}
                      className="block text-xs text-slate-700 hover:text-[#841d37] hover:underline font-normal transition-colors"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Right Side: 3 Featured Photo Cards with Titles */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 flex-1 max-w-2xl border-t lg:border-t-0 lg:border-l border-slate-100 pt-6 lg:pt-0 lg:pl-10">
                {MEGA_MENU_DATA[activeMegaMenu].featuredCards.map((card) => (
                  <Link
                    key={card.title}
                    href={card.href}
                    onClick={() => setActiveMegaMenu(null)}
                    className="group flex flex-col block"
                  >
                    <div className="aspect-[3/4] w-full overflow-hidden bg-slate-100 shadow-2xs">
                      <img
                        src={card.img}
                        alt={card.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <span className="mt-2 text-xs font-semibold text-slate-900 group-hover:text-[#841d37] transition-colors">
                      {card.title}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
