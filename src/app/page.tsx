'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Grid3x3, Shield, Search, Download, ArrowLeft, Trash2, LogOut,
  Upload, Image as ImageIcon, Link2, Type, FileText, Tag, Eye, EyeOff,
  Calendar, ChevronRight, Menu, X, Loader2, AlertCircle, Zap, FolderOpen,
  TrendingUp, Settings, Pencil, Palette, FolderPlus, Check, ExternalLink,
  MousePointerClick, Bell, Star, Flame, TriangleAlert, Hash, ChevronUp, ChevronDown,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

// ─── Types ───────────────────────────────────────────────────
interface Category {
  id: string; name: string; slug: string; description: string;
  color: string; imageUrl: string; createdAt: string;
  _count?: { posts: number };
}

interface Post {
  id: string; title: string; description: string; imageUrl: string;
  downloadUrl: string; buttonText: string; buttonColor: string;
  buttonLink: string; warning: string; isVisible: boolean;
  categoryId: string; category: Category; createdAt: string;
}

interface SiteSettings { id: string; siteName: string; description: string; logoUrl: string; }

interface BottomButton {
  id: string; name: string; icon: string; link: string;
  color: string; textColor: string; bgColor: string;
  sortOrder: number; isVisible: boolean; createdAt: string;
}

type View = 'home' | 'categories' | 'category' | 'post' | 'login' | 'admin';
type AdminTab = 'upload' | 'posts' | 'categories' | 'buttons' | 'settings';
interface ViewHistory { view: View; params?: Record<string, string>; }

// ─── Main Component ─────────────────────────────────────────
export default function App() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [viewParams, setViewParams] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<ViewHistory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [singlePost, setSinglePost] = useState<Post | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    id: 'main', siteName: 'Official FF Community',
    description: 'Your one-stop destination for mod menus, glitches, and the latest game updates. Download and dominate!', logoUrl: '',
  });

  // Admin
  const [adminTab, setAdminTab] = useState<AdminTab>('upload');
  const [catForm, setCatForm] = useState({ name: '', description: '', color: '#00f0ff', imageUrl: '' });
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [postForm, setPostForm] = useState({
    title: '', description: '', imageUrl: '', downloadUrl: '',
    buttonText: 'Download', buttonColor: '#3b82f6', buttonLink: '', warning: '', categoryId: '',
  });
  const [settingsForm, setSettingsForm] = useState({ siteName: '', description: '', logoUrl: '' });
  const [postImagePreview, setPostImagePreview] = useState('');
  const [catImagePreview, setCatImagePreview] = useState('');
  const [bottomButtons, setBottomButtons] = useState<BottomButton[]>([]);
  const [btnForm, setBtnForm] = useState({
    name: '', icon: '⭐', link: '', color: '#00f0ff', textColor: '#ffffff', bgColor: '#1a1b2e', isVisible: true,
  });
  const [editingBtnId, setEditingBtnId] = useState<string | null>(null);

  const mainRef = useRef<HTMLDivElement>(null);

  // ─── Auth ────────────────────────────────────────────────
  useEffect(() => {
    if (localStorage.getItem('ff_admin_token')) setIsAuthenticated(true);
  }, []);

  // ─── Navigation ──────────────────────────────────────────
  const navigateTo = useCallback((view: View, params: Record<string, string> = {}) => {
    setHistory((p) => [...p, { view: currentView, params: viewParams }]);
    setCurrentView(view); setViewParams(params); setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    let hash = `#${view}`;
    if (view === 'category' && params.slug) hash = `#category/${params.slug}`;
    if (view === 'post' && params.id) hash = `#post/${params.id}`;
    window.location.hash = hash;
  }, [currentView, viewParams]);

  const goBack = useCallback(() => {
    if (history.length > 0) {
      const prev = history[history.length - 1];
      setHistory((h) => h.slice(0, -1));
      setCurrentView(prev.view); setViewParams(prev.params || {});
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else { setCurrentView('home'); setViewParams({}); window.location.hash = '#home'; }
  }, [history]);

  useEffect(() => {
    const h = () => {
      const hash = window.location.hash.slice(1) || 'home';
      if (hash.startsWith('category/')) { setCurrentView('category'); setViewParams({ slug: hash.replace('category/', '') }); }
      else if (hash.startsWith('post/')) { setCurrentView('post'); setViewParams({ id: hash.replace('post/', '') }); }
      else if (hash === 'admin') { setCurrentView('admin'); setViewParams({}); }
      else if (hash === 'login') { setCurrentView('login'); setViewParams({}); }
      else { setCurrentView('home'); setViewParams({}); }
    };
    h(); window.addEventListener('hashchange', h);
    return () => window.removeEventListener('hashchange', h);
  }, []);

  // ─── API ─────────────────────────────────────────────────
  const fetchCategories = useCallback(async () => {
    try { const r = await fetch('/api/categories'); if (!r.ok) { setCategories([]); return; } const d = await r.json(); setCategories(Array.isArray(d) ? d : []); } catch { setCategories([]); }
  }, []);

  const fetchPosts = useCallback(async (p?: { slug?: string; search?: string; admin?: boolean }) => {
    setIsLoading(true);
    try {
      let u = '/api/posts?';
      if (p?.slug) u += `slug=${p.slug}`;
      if (p?.search) u += `&search=${encodeURIComponent(p.search)}`;
      if (p?.admin) u += '&admin=true';
      const r = await fetch(u); if (!r.ok) { setPosts([]); return; } const d = await r.json();
      setPosts(Array.isArray(d) ? d : []);
    } catch { setPosts([]); }
    finally { setIsLoading(false); }
  }, []);

  const fetchSinglePost = useCallback(async (id: string) => {
    setIsLoading(true);
    try { const r = await fetch(`/api/posts/${id}`); const d = await r.json(); setSinglePost(d); }
    catch { toast({ title: 'Error', description: 'Failed to load post', variant: 'destructive' }); }
    finally { setIsLoading(false); }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const r = await fetch('/api/settings'); const d = await r.json();
      setSiteSettings(d);
      setSettingsForm({ siteName: d.siteName, description: d.description, logoUrl: d.logoUrl });
    } catch { /* */ }
  }, []);

  const fetchBottomButtons = useCallback(async (admin?: boolean) => {
    try {
      const r = await fetch(`/api/bottom-buttons${admin ? '?admin=true' : ''}`);
      if (!r.ok) { setBottomButtons([]); return; }
      const d = await r.json();
      setBottomButtons(Array.isArray(d) ? d : []);
    } catch { setBottomButtons([]); }
  }, []);

  // Load data on mount
  useEffect(() => { fetchCategories(); fetchSettings(); fetchBottomButtons(); }, [fetchCategories, fetchSettings, fetchBottomButtons]);

  // Load posts based on view
  useEffect(() => {
    if (currentView === 'home') fetchPosts();
    else if (currentView === 'category' && viewParams.slug) fetchPosts({ slug: viewParams.slug });
    else if (currentView === 'post' && viewParams.id) fetchSinglePost(viewParams.id);
    else if (currentView === 'admin' && isAuthenticated) { fetchPosts({ admin: true }); fetchCategories(); fetchBottomButtons(true); }
  }, [currentView, viewParams, fetchPosts, fetchSinglePost, isAuthenticated]);

  // ─── Helpers ─────────────────────────────────────────────
  const readFile = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = (e) => resolve(e.target?.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });

  const refreshAdminData = () => { fetchCategories(); fetchPosts({ admin: true }); };

  // ─── Auth Actions ────────────────────────────────────────
  const handleLogin = async (u: string, p: string) => {
    try {
      const r = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: u, password: p }) });
      const d = await r.json();
      if (d.success) { localStorage.setItem('ff_admin_token', d.token); setIsAuthenticated(true); toast({ title: 'Welcome, Admin!' }); navigateTo('admin'); }
      else toast({ title: 'Login Failed', description: d.message, variant: 'destructive' });
    } catch { toast({ title: 'Error', description: 'Login failed', variant: 'destructive' }); }
  };

  const handleLogout = () => { localStorage.removeItem('ff_admin_token'); setIsAuthenticated(false); toast({ title: 'Logged out' }); navigateTo('home'); };

  // ─── Category Actions ────────────────────────────────────
  const handleSaveCategory = async () => {
    if (!catForm.name.trim()) return toast({ title: 'Error', description: 'Name is required', variant: 'destructive' });
    try {
      const isNew = !editingCatId;
      const r = await fetch('/api/categories', {
        method: isNew ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isNew ? catForm : { id: editingCatId, ...catForm }),
      });
      const d = await r.json();
      if (r.ok) {
        setCatForm({ name: '', description: '', color: '#00f0ff', imageUrl: '' });
        setCatImagePreview('');
        setEditingCatId(null);
        await refreshAdminData();
        toast({ title: isNew ? 'Category created!' : 'Category updated!', description: d.name });
      } else toast({ title: 'Error', description: d.error, variant: 'destructive' });
    } catch { toast({ title: 'Error', description: 'Failed to save category', variant: 'destructive' }); }
  };

  const handleEditCategory = (cat: Category) => {
    setEditingCatId(cat.id);
    setCatForm({ name: cat.name, description: cat.description || '', color: cat.color, imageUrl: cat.imageUrl });
    setCatImagePreview(cat.imageUrl);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEditCategory = () => {
    setEditingCatId(null);
    setCatForm({ name: '', description: '', color: '#00f0ff', imageUrl: '' });
    setCatImagePreview('');
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete this category and all its posts?')) return;
    try {
      const r = await fetch(`/api/categories?id=${id}`, { method: 'DELETE' });
      if (r.ok) { await refreshAdminData(); toast({ title: 'Category deleted' }); }
      else toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    } catch { toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' }); }
  };

  // ─── Post Actions ────────────────────────────────────────
  const handleCreatePost = async () => {
    const { title, description, imageUrl, downloadUrl, buttonText, buttonColor, buttonLink, warning, categoryId } = postForm;
    if (!title || !description || !downloadUrl || !categoryId) {
      return toast({ title: 'Error', description: 'Fill all required fields (Title, Description, Download Link, Category)', variant: 'destructive' });
    }
    try {
      const r = await fetch('/api/posts', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, imageUrl: imageUrl || '', downloadUrl, buttonText, buttonColor, buttonLink, warning, categoryId }) });
      const d = await r.json();
      if (r.ok) {
        setPostForm({ title: '', description: '', imageUrl: '', downloadUrl: '', buttonText: 'Download', buttonColor: '#3b82f6', buttonLink: '', warning: '', categoryId: '' });
        setPostImagePreview('');
        await refreshAdminData();
        toast({ title: 'Post created!', description: d.title });
      } else toast({ title: 'Error', description: d.error, variant: 'destructive' });
    } catch { toast({ title: 'Error', description: 'Failed to create post', variant: 'destructive' }); }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm('Delete this post permanently?')) return;
    try {
      const r = await fetch(`/api/posts?id=${id}`, { method: 'DELETE' });
      if (r.ok) { await fetchPosts({ admin: true }); toast({ title: 'Post deleted' }); }
    } catch { toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' }); }
  };

  const handleToggleVisibility = async (id: string, v: boolean) => {
    try {
      const r = await fetch('/api/posts', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, isVisible: v }) });
      if (r.ok) {
        setPosts((p) => p.map((x) => x.id === id ? { ...x, isVisible: v } : x));
        toast({ title: v ? 'Now visible' : 'Now hidden' });
      }
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
  };

  const handleSaveSettings = async () => {
    try {
      const r = await fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settingsForm) });
      if (r.ok) { const d = await r.json(); setSiteSettings(d); toast({ title: 'Settings saved!' }); }
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
  };

  // ─── Bottom Button Actions ──────────────────────────────
  const handleSaveBottomButton = async () => {
    if (!btnForm.name.trim()) return toast({ title: 'Error', description: 'Button name is required', variant: 'destructive' });
    try {
      const isNew = !editingBtnId;
      const r = await fetch('/api/bottom-buttons', {
        method: isNew ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isNew ? btnForm : { id: editingBtnId, ...btnForm }),
      });
      const d = await r.json();
      if (r.ok) {
        setBtnForm({ name: '', icon: '⭐', link: '', color: '#00f0ff', textColor: '#ffffff', bgColor: '#1a1b2e', isVisible: true });
        setEditingBtnId(null);
        await fetchBottomButtons(true);
        toast({ title: isNew ? 'Button added!' : 'Button updated!', description: d.name });
      } else toast({ title: 'Error', description: d.error, variant: 'destructive' });
    } catch { toast({ title: 'Error', description: 'Failed to save button', variant: 'destructive' }); }
  };

  const handleEditBottomButton = (btn: BottomButton) => {
    setEditingBtnId(btn.id);
    setBtnForm({ name: btn.name, icon: btn.icon, link: btn.link, color: btn.color, textColor: btn.textColor, bgColor: btn.bgColor, isVisible: btn.isVisible });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteBottomButton = async (id: string) => {
    if (!confirm('Delete this button?')) return;
    try {
      const r = await fetch(`/api/bottom-buttons?id=${id}`, { method: 'DELETE' });
      if (r.ok) { await fetchBottomButtons(true); toast({ title: 'Button deleted' }); }
      else toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    } catch { toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' }); }
  };

  const handleToggleBtnVisibility = async (id: string, v: boolean) => {
    try {
      const r = await fetch('/api/bottom-buttons', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, isVisible: v }) });
      if (r.ok) { setBottomButtons((p) => p.map((x) => x.id === id ? { ...x, isVisible: v } : x)); toast({ title: v ? 'Button visible' : 'Button hidden' }); }
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
  };

  const handleMoveBtn = async (id: string, dir: 'up' | 'down') => {
    const idx = bottomButtons.findIndex((b) => b.id === id);
    if (idx < 0) return;
    if (dir === 'up' && idx === 0) return;
    if (dir === 'down' && idx === bottomButtons.length - 1) return;
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    const btn1 = bottomButtons[idx];
    const btn2 = bottomButtons[swapIdx];
    try {
      await fetch('/api/bottom-buttons', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: btn1.id, sortOrder: btn2.sortOrder }) });
      await fetch('/api/bottom-buttons', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: btn2.id, sortOrder: btn1.sortOrder }) });
      await fetchBottomButtons(true);
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
  };

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); if (searchQuery.trim()) fetchPosts({ search: searchQuery.trim() }); };

  // ─── RENDER: Login ───────────────────────────────────────
  const renderLogin = () => (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
        <Card className="glass-card border-dark-border p-0 overflow-hidden">
          <div className="p-6 border-b border-dark-border bg-gradient-to-r from-neon/5 to-transparent">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-neon/10 flex items-center justify-center"><Shield className="w-5 h-5 text-neon" /></div>
              <h2 className="text-xl font-bold text-white">Admin Access</h2>
            </div>
            <p className="text-sm text-muted-foreground">Enter credentials to access the admin panel</p>
          </div>
          <LoginForm onLogin={handleLogin} />
        </Card>
      </motion.div>
    </div>
  );

  // ─── RENDER: Home ────────────────────────────────────────
  const renderHome = () => (
    <div className="space-y-6">
      {/* Hero Banner */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-2xl">
        <img src="/hero-banner.png" alt="Hero" className="w-full h-44 sm:h-56 md:h-72 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-dark-bg/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7">
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-neon/20 text-neon border-neon/30 text-[10px]"><Star className="w-3 h-3 mr-1" /> Official</Badge>
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px]"><Bell className="w-3 h-3 mr-1" /> New</Badge>
          </div>
          <h1 className="text-xl sm:text-3xl md:text-4xl font-black text-white">
            {siteSettings.siteName.split(' ').map((w, i) => w === 'FF' ? <span key={i} className="neon-text">{w} </span> : w + ' ')}
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-md">{siteSettings.description}</p>
        </div>
      </motion.div>

      {/* Search Bar */}
      <motion.form onSubmit={handleSearch} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input type="text" placeholder="Search files, mods, tools..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-12 h-12 rounded-xl bg-dark-input border-dark-border text-white placeholder:text-muted-foreground input-glow" />
        {searchQuery && (
          <button type="button" onClick={() => { setSearchQuery(''); fetchPosts(); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white">
            <X className="w-4 h-4" />
          </button>
        )}
      </motion.form>

      {/* Categories Grid - Like the screenshot */}
      {categories.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2"><Flame className="w-5 h-5 text-orange-400" /> Categories</h2>
            <button onClick={() => navigateTo('categories')} className="text-xs text-neon flex items-center gap-1 hover:underline">View All <ChevronRight className="w-3 h-3" /></button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {categories.map((cat, i) => (
              <motion.button key={cat.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                onClick={() => navigateTo('category', { slug: cat.slug })}
                className="relative rounded-xl overflow-hidden text-left group cursor-pointer border border-dark-border hover:border-neon/30 transition-all duration-300">
                {/* Category Image */}
                <div className="relative h-28 sm:h-32 overflow-hidden">
                  {cat.imageUrl ? (
                    <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: `${cat.color}15` }}>
                      <FolderOpen className="w-10 h-10" style={{ color: cat.color }} />
                    </div>
                  )}
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                  {/* Category title on image */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="text-sm font-bold text-white leading-tight">{cat.name.toUpperCase()}</h3>
                    <p className="text-[10px] text-gray-300 mt-0.5 line-clamp-2">{cat.description}</p>
                  </div>
                  {/* Color dot */}
                  <div className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color, boxShadow: `0 0 8px ${cat.color}80` }} />
                </div>
                {/* Post count bar */}
                <div className="bg-dark-card px-3 py-1.5 flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">{cat._count?.posts || 0} files</span>
                  <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:text-neon transition-colors" />
                </div>
              </motion.button>
            ))}
          </div>
        </section>
      )}

      {/* Latest Posts Section - Like the screenshot */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2"><TrendingUp className="w-5 h-5 text-neon" /> Latest Posts</h2>
          <Badge variant="outline" className="border-neon/30 text-neon text-[10px]">{posts.length} files</Badge>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 text-neon animate-spin" /></div>
        ) : posts.length === 0 ? (
          <EmptyState icon={<FolderOpen className="w-12 h-12 text-muted-foreground" />} title="No files yet" description="Check back soon!" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {posts.map((post, i) => (
              <motion.div key={post.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <PostCard post={post} onClick={() => navigateTo('post', { id: post.id })} />
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Bottom Buttons / Quick Links */}
      {bottomButtons.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2"><Zap className="w-5 h-5 text-neon" /> Quick Links</h2>
            <Badge variant="outline" className="border-neon/30 text-neon text-[10px]">{bottomButtons.filter(b => b.isVisible).length} links</Badge>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {bottomButtons.filter(b => b.isVisible).map((btn, i) => (
              <motion.a key={btn.id} href={btn.link || '#'} target="_blank" rel="noopener noreferrer"
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all hover:scale-105 active:scale-95 group"
                style={{ borderColor: `${btn.color}30`, backgroundColor: btn.bgColor }}
                whileHover={{ boxShadow: `0 0 20px ${btn.color}20` }}>
                <span className="text-2xl group-hover:scale-110 transition-transform">{btn.icon}</span>
                <span className="text-[10px] sm:text-[11px] font-medium text-center leading-tight line-clamp-1" style={{ color: btn.textColor }}>{btn.name}</span>
              </motion.a>
            ))}
          </div>
        </section>
      )}
    </div>
  );

  // ─── RENDER: Categories Page ─────────────────────────────
  const renderCategories = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={goBack} className="text-muted-foreground hover:text-white hover:bg-dark-surface"><ArrowLeft className="w-5 h-5" /></Button>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Grid3x3 className="w-6 h-6 text-neon" /> All Categories</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{categories.length} categories available</p>
        </div>
      </div>
      {categories.length === 0 ? (
        <EmptyState icon={<Grid3x3 className="w-12 h-12 text-muted-foreground" />} title="No categories" description="Create some in admin panel." />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {categories.map((cat, i) => (
            <motion.button key={cat.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              onClick={() => navigateTo('category', { slug: cat.slug })}
              className="relative rounded-xl overflow-hidden text-left group cursor-pointer border border-dark-border hover:border-neon/30 transition-all duration-300">
              <div className="relative h-32 sm:h-40 overflow-hidden">
                {cat.imageUrl ? (
                  <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: `${cat.color}15` }}>
                    <FolderOpen className="w-12 h-12" style={{ color: cat.color }} />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-base font-bold text-white">{cat.name}</h3>
                  {cat.description && <p className="text-xs text-gray-300 mt-1 line-clamp-2">{cat.description}</p>}
                </div>
                <div className="absolute top-2 right-2 w-3 h-3 rounded-full" style={{ backgroundColor: cat.color, boxShadow: `0 0 8px ${cat.color}80` }} />
              </div>
              <div className="bg-dark-card px-3 py-2 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{cat._count?.posts || 0} files</span>
                <ChevronRight className="w-3 h-3 text-muted-foreground" />
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );

  // ─── RENDER: Category Page ───────────────────────────────
  const renderCategory = () => {
    const cat = categories.find((c) => c.slug === viewParams.slug);
    const name = cat?.name || viewParams.slug || 'Category';
    const color = cat?.color || '#00f0ff';
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={goBack} className="text-muted-foreground hover:text-white hover:bg-dark-surface"><ArrowLeft className="w-5 h-5" /></Button>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center border" style={{ borderColor: `${color}30`, backgroundColor: `${color}10` }}>
            {cat?.imageUrl ? <img src={cat.imageUrl} alt="" className="w-7 h-7 rounded object-cover" /> : <FolderOpen className="w-5 h-5" style={{ color }} />}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">{name}</h1>
            {cat?.description && <p className="text-xs text-muted-foreground">{cat.description}</p>}
          </div>
          <Badge variant="outline" className="text-[10px]" style={{ borderColor: `${color}30`, color }}>{posts.length} files</Badge>
        </div>
        {isLoading ? <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 text-neon animate-spin" /></div>
          : posts.length === 0 ? <EmptyState icon={<FolderOpen className="w-12 h-12 text-muted-foreground" />} title="No files here" description="Admin hasn't uploaded anything yet." />
          : <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{posts.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <PostCard post={p} onClick={() => navigateTo('post', { id: p.id })} />
              </motion.div>))}</div>}
      </div>
    );
  };

  // ─── RENDER: Post Detail ─────────────────────────────────
  const renderPost = () => {
    if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-neon animate-spin" /></div>;
    if (!singlePost) return <EmptyState icon={<AlertCircle className="w-12 h-12 text-destructive" />} title="Post not found" description="This post may have been deleted." />;
    const btnStyle = { backgroundColor: singlePost.buttonColor, boxShadow: `0 0 20px ${singlePost.buttonColor}40` };
    const btnLink = singlePost.buttonLink || `/go?id=${singlePost.id}`;

    return (
      <div className="space-y-5">
        <Button variant="ghost" onClick={goBack} className="text-muted-foreground hover:text-white hover:bg-dark-surface -ml-2"><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Post Image */}
          <div className="relative overflow-hidden rounded-2xl border border-dark-border">
            <PostImage src={singlePost.imageUrl} alt={singlePost.title} className="w-full h-52 sm:h-64 md:h-80" />
            <div className="absolute top-3 left-3">
              <Badge className="backdrop-blur-sm border text-[10px]" style={{ backgroundColor: `${singlePost.category.color}30`, color: singlePost.category.color, borderColor: `${singlePost.category.color}50` }}>{singlePost.category.name}</Badge>
            </div>
            {singlePost.warning && (
              <div className="absolute top-3 right-3">
                <Badge className="backdrop-blur-sm bg-yellow-500/20 text-yellow-400 border-yellow-500/40 text-[10px]"><TriangleAlert className="w-3 h-3 mr-1" />{singlePost.warning}</Badge>
              </div>
            )}
          </div>
          {/* Title & Meta */}
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white">{singlePost.title}</h1>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(singlePost.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
              <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{singlePost.category.name}</span>
            </div>
          </div>
          {/* Description */}
          <div className="glass-card rounded-xl p-4 border border-dark-border">
            <h3 className="text-xs font-semibold text-neon mb-2 flex items-center gap-2"><FileText className="w-3.5 h-3.5" /> Description</h3>
            <p className="text-gray-300 whitespace-pre-wrap leading-relaxed text-sm">{singlePost.description}</p>
          </div>
          {/* Custom Button */}
          <a href={btnLink} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-4 rounded-xl text-base font-bold transition-all hover:opacity-90 hover:scale-[1.01] active:scale-[0.99]"
            style={{ ...btnStyle, color: '#fff' }}>
            {singlePost.buttonLink ? <ExternalLink className="w-5 h-5" /> : <Download className="w-5 h-5" />}
            {singlePost.buttonText || 'Download'}
          </a>
        </motion.div>
      </div>
    );
  };

  // ─── RENDER: Admin ───────────────────────────────────────
  const renderAdmin = () => {
    if (!isAuthenticated) { navigateTo('login'); return null; }
    const visCount = posts.filter((p) => p.isVisible).length;
    const hidCount = posts.filter((p) => !p.isVisible).length;

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigateTo('home')} className="w-9 h-9 rounded-lg bg-dark-input border border-dark-border flex items-center justify-center text-muted-foreground hover:text-white hover:border-neon/30 transition-colors"><Home className="w-4 h-4" /></button>
            <div className="w-10 h-10 rounded-xl bg-neon/10 flex items-center justify-center"><Shield className="w-5 h-5 text-neon" /></div>
            <div><h1 className="text-xl font-bold text-white">Admin Panel</h1><p className="text-xs text-muted-foreground">{siteSettings.siteName}</p></div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateTo('home')} className="border-dark-border text-muted-foreground hover:text-white hover:border-neon/30 text-xs"><Home className="w-3 h-3 mr-1.5" /> Site</Button>
            <Button variant="outline" size="sm" onClick={handleLogout} className="border-destructive/30 text-destructive hover:bg-destructive/10 text-xs"><LogOut className="w-3 h-3 mr-1.5" /> Logout</Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-dark-input border border-dark-border overflow-x-auto">
          {([
            { key: 'upload' as AdminTab, icon: <Upload className="w-3.5 h-3.5" />, label: 'Upload Post' },
            { key: 'posts' as AdminTab, icon: <FileText className="w-3.5 h-3.5" />, label: `Posts (${posts.length})` },
            { key: 'categories' as AdminTab, icon: <Tag className="w-3.5 h-3.5" />, label: `Categories (${categories.length})` },
            { key: 'buttons' as AdminTab, icon: <Zap className="w-3.5 h-3.5" />, label: `Buttons (${bottomButtons.length})` },
            { key: 'settings' as AdminTab, icon: <Settings className="w-3.5 h-3.5" />, label: 'Settings' },
          ]).map((t) => (
            <button key={t.key} onClick={() => setAdminTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-1 justify-center ${adminTab === t.key ? 'bg-neon text-dark-bg shadow-lg shadow-neon/20' : 'text-muted-foreground hover:text-white hover:bg-dark-surface'}`}>
              {t.icon} <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={adminTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>

            {/* ── UPLOAD POST TAB ── */}
            {adminTab === 'upload' && (
              <Card className="glass-card border-dark-border overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4 border-b border-dark-border bg-gradient-to-r from-neon/5 to-transparent">
                    <h2 className="font-bold text-white flex items-center gap-2"><Upload className="w-4 h-4 text-neon" /> Upload New Post</h2>
                  </div>
                  <div className="p-4 space-y-4">
                    {/* Image upload */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block flex items-center gap-1"><ImageIcon className="w-3 h-3" /> Cover Image</label>
                      <div className="relative rounded-xl border-2 border-dashed border-dark-border hover:border-neon/30 transition-colors overflow-hidden">
                        {postImagePreview ? (
                          <div className="relative">
                            <img src={postImagePreview} alt="Preview" className="w-full h-40 object-cover" />
                            <button onClick={() => { setPostForm((p) => ({ ...p, imageUrl: '' })); setPostImagePreview(''); }}
                              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-red-500/80 transition-colors">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div onClick={() => document.getElementById('post-img')?.click()} className="flex flex-col items-center justify-center py-10 cursor-pointer hover:bg-dark-surface/50 transition-colors">
                            <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                            <span className="text-xs text-muted-foreground">Click to upload or paste URL below</span>
                          </div>
                        )}
                      </div>
                      <Input placeholder="Or paste image URL here..." value={postForm.imageUrl} onChange={(e) => { setPostForm((p) => ({ ...p, imageUrl: e.target.value })); if (e.target.value) setPostImagePreview(e.target.value); }}
                        className="mt-2 bg-dark-input border-dark-border text-white placeholder:text-muted-foreground input-glow" />
                      <input type="file" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { const d = await readFile(f); setPostForm((p) => ({ ...p, imageUrl: d })); setPostImagePreview(d); } }} className="hidden" id="post-img" />
                    </div>
                    {/* Title & Category */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Category *</label>
                        <select value={postForm.categoryId} onChange={(e) => setPostForm((p) => ({ ...p, categoryId: e.target.value }))}
                          className="w-full p-2.5 rounded-lg bg-dark-input border border-dark-border text-white text-sm input-glow">
                          <option value="">Select category...</option>
                          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Title *</label>
                        <Input placeholder="Post title" value={postForm.title} onChange={(e) => setPostForm((p) => ({ ...p, title: e.target.value }))} className="bg-dark-input border-dark-border text-white placeholder:text-muted-foreground input-glow" />
                      </div>
                    </div>
                    {/* Description */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Description *</label>
                      <textarea placeholder="Describe the content..." value={postForm.description} onChange={(e) => setPostForm((p) => ({ ...p, description: e.target.value }))} rows={3}
                        className="w-full p-2.5 rounded-lg bg-dark-input border border-dark-border text-white text-sm placeholder:text-muted-foreground input-glow resize-none" />
                    </div>
                    {/* Warning Tag */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block flex items-center gap-1"><TriangleAlert className="w-3 h-3" /> Warning Tag (optional)</label>
                      <Input placeholder="e.g. FF MAX only, Must use 2nd" value={postForm.warning} onChange={(e) => setPostForm((p) => ({ ...p, warning: e.target.value }))} className="bg-dark-input border-dark-border text-white placeholder:text-muted-foreground input-glow" />
                    </div>
                    {/* Download Link & Custom Link */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block flex items-center gap-1"><Link2 className="w-3 h-3" /> Download Link *</label>
                        <Input placeholder="https://mediafire.com/..." value={postForm.downloadUrl} onChange={(e) => setPostForm((p) => ({ ...p, downloadUrl: e.target.value }))} className="bg-dark-input border-dark-border text-white placeholder:text-muted-foreground input-glow" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block flex items-center gap-1"><MousePointerClick className="w-3 h-3" /> Custom Link (optional)</label>
                        <Input placeholder="https://telegram.me/..." value={postForm.buttonLink} onChange={(e) => setPostForm((p) => ({ ...p, buttonLink: e.target.value }))} className="bg-dark-input border-dark-border text-white placeholder:text-muted-foreground input-glow" />
                      </div>
                    </div>
                    {/* Button Text & Color */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block flex items-center gap-1"><Type className="w-3 h-3" /> Button Text</label>
                        <Input placeholder="Download" value={postForm.buttonText} onChange={(e) => setPostForm((p) => ({ ...p, buttonText: e.target.value }))} className="bg-dark-input border-dark-border text-white placeholder:text-muted-foreground input-glow" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block flex items-center gap-1"><Palette className="w-3 h-3" /> Button Color</label>
                        <div className="flex items-center gap-2">
                          <input type="color" value={postForm.buttonColor} onChange={(e) => setPostForm((p) => ({ ...p, buttonColor: e.target.value }))} className="w-9 h-9 rounded-lg border border-dark-border cursor-pointer bg-transparent" />
                          <Input value={postForm.buttonColor} onChange={(e) => setPostForm((p) => ({ ...p, buttonColor: e.target.value }))} className="flex-1 bg-dark-input border-dark-border text-white input-glow font-mono text-xs" />
                        </div>
                      </div>
                    </div>
                    {/* Button Preview */}
                    {postForm.buttonText && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Preview:</span>
                        <div className="px-4 py-2 rounded-lg font-bold text-sm text-white" style={{ backgroundColor: postForm.buttonColor, boxShadow: `0 0 12px ${postForm.buttonColor}40` }}>
                          {postForm.buttonText}
                        </div>
                      </div>
                    )}
                    <Button onClick={handleCreatePost} className="neon-glow-btn w-full py-3"><Upload className="w-4 h-4 mr-2" /> Upload Post</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── POSTS TAB ── */}
            {adminTab === 'posts' && (
              <Card className="glass-card border-dark-border overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4 border-b border-dark-border bg-gradient-to-r from-neon/5 to-transparent flex items-center justify-between">
                    <h2 className="font-bold text-white flex items-center gap-2"><FileText className="w-4 h-4 text-neon" /> All Posts</h2>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-green-500/30 text-green-400 text-[10px]"><Eye className="w-3 h-3 mr-1" />{visCount}</Badge>
                      <Badge variant="outline" className="border-yellow-500/30 text-yellow-400 text-[10px]"><EyeOff className="w-3 h-3 mr-1" />{hidCount}</Badge>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="max-h-[60vh] overflow-y-auto space-y-2">
                      {posts.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No posts yet.</p>
                        : posts.map((post) => (
                          <div key={post.id} className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${post.isVisible ? 'bg-dark-input border-dark-border' : 'bg-yellow-500/5 border-yellow-500/20'}`}>
                            <PostImage src={post.imageUrl} alt={post.title} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h4 className="text-sm font-semibold text-white truncate">{post.title}</h4>
                                {!post.isVisible && <Badge variant="outline" className="border-yellow-500/30 text-yellow-400 text-[9px] px-1 py-0">Hidden</Badge>}
                              </div>
                              <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{post.description}</p>
                              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                <Badge variant="outline" className="text-[9px] px-1 py-0" style={{ borderColor: `${post.category.color}40`, color: post.category.color }}>{post.category.name}</Badge>
                                <span className="text-[9px] px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: `${post.buttonColor}30`, color: post.buttonColor }}>{post.buttonText}</span>
                                {post.warning && <span className="text-[9px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400">{post.warning}</span>}
                              </div>
                            </div>
                            <div className="flex flex-col gap-1 flex-shrink-0">
                              <button onClick={() => handleToggleVisibility(post.id, !post.isVisible)}
                                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${post.isVisible ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' : 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20'}`}
                                title={post.isVisible ? 'Hide' : 'Show'}>
                                {post.isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                              </button>
                              <button onClick={() => handleDeletePost(post.id)} className="w-7 h-7 rounded-lg flex items-center justify-center bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── CATEGORIES TAB ── */}
            {adminTab === 'categories' && (
              <Card className="glass-card border-dark-border overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4 border-b border-dark-border bg-gradient-to-r from-neon/5 to-transparent flex items-center justify-between">
                    <h2 className="font-bold text-white flex items-center gap-2"><FolderPlus className="w-4 h-4 text-neon" /> {editingCatId ? 'Edit Category' : 'Create New Category'}</h2>
                    {editingCatId && <button onClick={handleCancelEditCategory} className="text-xs text-muted-foreground hover:text-white">Cancel</button>}
                  </div>
                  <div className="p-4 space-y-4 border-b border-dark-border">
                    {/* Category Image Upload */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block flex items-center gap-1"><ImageIcon className="w-3 h-3" /> Category Image</label>
                      <div className="relative rounded-xl border-2 border-dashed border-dark-border hover:border-neon/30 transition-colors overflow-hidden">
                        {catImagePreview ? (
                          <div className="relative">
                            <img src={catImagePreview} alt="Preview" className="w-full h-28 object-cover" />
                            <button onClick={() => { setCatForm((p) => ({ ...p, imageUrl: '' })); setCatImagePreview(''); }}
                              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-red-500/80 transition-colors">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div onClick={() => document.getElementById('cat-img')?.click()} className="flex flex-col items-center justify-center py-8 cursor-pointer hover:bg-dark-surface/50 transition-colors">
                            <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                            <span className="text-xs text-muted-foreground">Click to upload image</span>
                          </div>
                        )}
                      </div>
                      <Input placeholder="Or paste image URL..." value={catForm.imageUrl} onChange={(e) => { setCatForm((p) => ({ ...p, imageUrl: e.target.value })); if (e.target.value) setCatImagePreview(e.target.value); }}
                        className="mt-2 bg-dark-input border-dark-border text-white placeholder:text-muted-foreground input-glow" />
                      <input type="file" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { const d = await readFile(f); setCatForm((p) => ({ ...p, imageUrl: d })); setCatImagePreview(d); } }} className="hidden" id="cat-img" />
                    </div>
                    {/* Name & Color */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Name *</label>
                        <Input placeholder="e.g. Mod Menu" value={catForm.name} onChange={(e) => setCatForm((p) => ({ ...p, name: e.target.value }))} className="bg-dark-input border-dark-border text-white placeholder:text-muted-foreground input-glow" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block flex items-center gap-1"><Palette className="w-3 h-3" /> Color</label>
                        <div className="flex items-center gap-2">
                          <input type="color" value={catForm.color} onChange={(e) => setCatForm((p) => ({ ...p, color: e.target.value }))} className="w-9 h-9 rounded-lg border border-dark-border cursor-pointer bg-transparent" />
                          <Input value={catForm.color} onChange={(e) => setCatForm((p) => ({ ...p, color: e.target.value }))} className="flex-1 bg-dark-input border-dark-border text-white input-glow font-mono text-xs" />
                        </div>
                      </div>
                    </div>
                    {/* Description */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
                      <Input placeholder="Short description..." value={catForm.description} onChange={(e) => setCatForm((p) => ({ ...p, description: e.target.value }))} className="bg-dark-input border-dark-border text-white placeholder:text-muted-foreground input-glow" />
                    </div>
                    <Button onClick={handleSaveCategory} className="neon-glow-btn w-full py-3">
                      {editingCatId ? <><Check className="w-4 h-4 mr-2" /> Update Category</> : <><FolderPlus className="w-4 h-4 mr-2" /> Create Category</>}
                    </Button>
                  </div>
                  {/* Existing Categories List */}
                  <div className="p-4">
                    <h3 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Existing Categories ({categories.length})</h3>
                    <div className="max-h-[40vh] overflow-y-auto space-y-2">
                      {categories.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">No categories yet.</p>
                        : categories.map((cat) => (
                          <div key={cat.id} className="flex items-center gap-3 p-3 rounded-xl bg-dark-input border border-dark-border">
                            <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-dark-border">
                              {cat.imageUrl ? <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: `${cat.color}15` }}><FolderOpen className="w-5 h-5" style={{ color: cat.color }} /></div>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-medium text-white">{cat.name}</span>
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color, boxShadow: `0 0 6px ${cat.color}60` }} />
                              </div>
                              {cat.description && <p className="text-[11px] text-muted-foreground line-clamp-1">{cat.description}</p>}
                              <span className="text-[11px] text-muted-foreground">{cat._count?.posts || 0} posts</span>
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                              <button onClick={() => handleEditCategory(cat)} className="w-7 h-7 rounded-lg flex items-center justify-center bg-neon/10 text-neon hover:bg-neon/20 transition-colors" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                              <button onClick={() => handleDeleteCategory(cat.id)} className="w-7 h-7 rounded-lg flex items-center justify-center bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── BUTTONS TAB ── */}
            {adminTab === 'buttons' && (
              <Card className="glass-card border-dark-border overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4 border-b border-dark-border bg-gradient-to-r from-neon/5 to-transparent flex items-center justify-between">
                    <h2 className="font-bold text-white flex items-center gap-2"><Zap className="w-4 h-4 text-neon" /> {editingBtnId ? 'Edit Button' : 'Add New Button'}</h2>
                    {editingBtnId && <button onClick={() => { setEditingBtnId(null); setBtnForm({ name: '', icon: '⭐', link: '', color: '#00f0ff', textColor: '#ffffff', bgColor: '#1a1b2e', isVisible: true }); }} className="text-xs text-muted-foreground hover:text-white">Cancel</button>}
                  </div>
                  <div className="p-4 space-y-4 border-b border-dark-border">
                    {/* Button Name & Icon */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block flex items-center gap-1"><Type className="w-3 h-3" /> Button Name *</label>
                        <Input placeholder="e.g. Telegram" value={btnForm.name} onChange={(e) => setBtnForm((p) => ({ ...p, name: e.target.value }))} className="bg-dark-input border-dark-border text-white placeholder:text-muted-foreground input-glow" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block flex items-center gap-1"><Star className="w-3 h-3" /> Icon / Emoji</label>
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-lg border border-dark-border bg-dark-input flex items-center justify-center text-xl flex-shrink-0">{btnForm.icon || '⭐'}</div>
                          <Input placeholder="⭐" value={btnForm.icon} onChange={(e) => setBtnForm((p) => ({ ...p, icon: e.target.value }))} className="bg-dark-input border-dark-border text-white placeholder:text-muted-foreground input-glow" />
                        </div>
                      </div>
                    </div>
                    {/* Link */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block flex items-center gap-1"><Link2 className="w-3 h-3" /> Link URL</label>
                      <Input placeholder="https://t.me/example" value={btnForm.link} onChange={(e) => setBtnForm((p) => ({ ...p, link: e.target.value }))} className="bg-dark-input border-dark-border text-white placeholder:text-muted-foreground input-glow" />
                    </div>
                    {/* Colors */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block flex items-center gap-1"><Palette className="w-3 h-3" /> Border/Accent Color</label>
                        <div className="flex items-center gap-2">
                          <input type="color" value={btnForm.color} onChange={(e) => setBtnForm((p) => ({ ...p, color: e.target.value }))} className="w-9 h-9 rounded-lg border border-dark-border cursor-pointer bg-transparent" />
                          <Input value={btnForm.color} onChange={(e) => setBtnForm((p) => ({ ...p, color: e.target.value }))} className="flex-1 bg-dark-input border-dark-border text-white input-glow font-mono text-xs" />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block flex items-center gap-1"><Type className="w-3 h-3" /> Text Color</label>
                        <div className="flex items-center gap-2">
                          <input type="color" value={btnForm.textColor} onChange={(e) => setBtnForm((p) => ({ ...p, textColor: e.target.value }))} className="w-9 h-9 rounded-lg border border-dark-border cursor-pointer bg-transparent" />
                          <Input value={btnForm.textColor} onChange={(e) => setBtnForm((p) => ({ ...p, textColor: e.target.value }))} className="flex-1 bg-dark-input border-dark-border text-white input-glow font-mono text-xs" />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block flex items-center gap-1"><Hash className="w-3 h-3" /> Background Color</label>
                        <div className="flex items-center gap-2">
                          <input type="color" value={btnForm.bgColor} onChange={(e) => setBtnForm((p) => ({ ...p, bgColor: e.target.value }))} className="w-9 h-9 rounded-lg border border-dark-border cursor-pointer bg-transparent" />
                          <Input value={btnForm.bgColor} onChange={(e) => setBtnForm((p) => ({ ...p, bgColor: e.target.value }))} className="flex-1 bg-dark-input border-dark-border text-white input-glow font-mono text-xs" />
                        </div>
                      </div>
                    </div>
                    {/* Button Preview */}
                    {btnForm.name && (
                      <div>
                        <span className="text-xs text-muted-foreground mb-2 block">Preview:</span>
                        <div className="flex items-center gap-2 p-3 rounded-xl border transition-all hover:scale-[1.02]"
                          style={{ borderColor: `${btnForm.color}50`, backgroundColor: btnForm.bgColor }}>
                          <span className="text-lg">{btnForm.icon}</span>
                          <span className="text-sm font-semibold" style={{ color: btnForm.textColor }}>{btnForm.name}</span>
                          {btnForm.link && <ExternalLink className="w-3 h-3 ml-auto" style={{ color: btnForm.color }} />}
                        </div>
                      </div>
                    )}
                    <Button onClick={handleSaveBottomButton} className="neon-glow-btn w-full py-3">
                      {editingBtnId ? <><Check className="w-4 h-4 mr-2" /> Update Button</> : <><Zap className="w-4 h-4 mr-2" /> Add Button</>}
                    </Button>
                  </div>
                  {/* Existing Buttons List */}
                  <div className="p-4">
                    <h3 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">All Buttons ({bottomButtons.length})</h3>
                    <div className="max-h-[50vh] overflow-y-auto space-y-2">
                      {bottomButtons.length === 0 ? (
                        <div className="text-center py-8">
                          <Zap className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">No buttons yet. Add your first one above!</p>
                          <p className="text-[11px] text-muted-foreground/60 mt-1">Minimum 15 recommended for a great look</p>
                        </div>
                      ) : bottomButtons.map((btn, i) => (
                        <div key={btn.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${btn.isVisible ? 'bg-dark-input border-dark-border' : 'bg-yellow-500/5 border-yellow-500/20'}`}>
                          <div className="flex flex-col gap-0.5">
                            <button onClick={() => handleMoveBtn(btn.id, 'up')} disabled={i === 0} className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-neon disabled:opacity-20 transition-colors"><ChevronUp className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handleMoveBtn(btn.id, 'down')} disabled={i === bottomButtons.length - 1} className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-neon disabled:opacity-20 transition-colors"><ChevronDown className="w-3.5 h-3.5" /></button>
                          </div>
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0 border" style={{ borderColor: `${btn.color}30`, backgroundColor: btn.bgColor }}>
                            {btn.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-medium text-white">{btn.name}</span>
                              {!btn.isVisible && <Badge variant="outline" className="border-yellow-500/30 text-yellow-400 text-[9px] px-1 py-0">Hidden</Badge>}
                            </div>
                            <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{btn.link || 'No link'}</p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <div className="w-3 h-3 rounded-sm border border-white/10" style={{ backgroundColor: btn.color }} />
                              <div className="w-3 h-3 rounded-sm border border-white/10" style={{ backgroundColor: btn.bgColor }} />
                              <div className="w-3 h-3 rounded-sm border border-white/10" style={{ backgroundColor: btn.textColor }} />
                            </div>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <button onClick={() => handleToggleBtnVisibility(btn.id, !btn.isVisible)}
                              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${btn.isVisible ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' : 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20'}`}
                              title={btn.isVisible ? 'Hide' : 'Show'}>
                              {btn.isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                            </button>
                            <button onClick={() => handleEditBottomButton(btn)} className="w-7 h-7 rounded-lg flex items-center justify-center bg-neon/10 text-neon hover:bg-neon/20 transition-colors" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handleDeleteBottomButton(btn.id)} className="w-7 h-7 rounded-lg flex items-center justify-center bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── SETTINGS TAB ── */}
            {adminTab === 'settings' && (
              <Card className="glass-card border-dark-border overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4 border-b border-dark-border bg-gradient-to-r from-neon/5 to-transparent"><h2 className="font-bold text-white flex items-center gap-2"><Settings className="w-4 h-4 text-neon" /> Website Settings</h2></div>
                  <div className="p-4 space-y-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Website Name</label>
                      <Input value={settingsForm.siteName} onChange={(e) => setSettingsForm((p) => ({ ...p, siteName: e.target.value }))} className="bg-dark-input border-dark-border text-white input-glow" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
                      <textarea value={settingsForm.description} onChange={(e) => setSettingsForm((p) => ({ ...p, description: e.target.value }))} rows={3} className="w-full p-2.5 rounded-lg bg-dark-input border border-dark-border text-white text-sm input-glow resize-none" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block flex items-center gap-1"><ImageIcon className="w-3 h-3" /> Logo URL</label>
                      <Input value={settingsForm.logoUrl} onChange={(e) => setSettingsForm((p) => ({ ...p, logoUrl: e.target.value }))} className="bg-dark-input border-dark-border text-white input-glow" />
                      {siteSettings.logoUrl && <div className="mt-2 flex items-center gap-2"><img src={siteSettings.logoUrl} alt="Logo" className="w-8 h-8 rounded object-cover border border-dark-border" /><span className="text-[11px] text-muted-foreground">Current logo</span></div>}
                    </div>
                    <Button onClick={handleSaveSettings} className="neon-glow-btn w-full py-3"><Settings className="w-4 h-4 mr-2" /> Save Settings</Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  };

  // ─── Layout ──────────────────────────────────────────────
  const showNav = currentView !== 'admin' && currentView !== 'login';

  return (
    <div className="min-h-screen bg-dark-bg grid-bg text-foreground flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-dark-bg/95 backdrop-blur-xl border-b border-dark-border">
        <div className="max-w-5xl mx-auto flex items-center justify-between h-14 px-4">
          <button onClick={() => navigateTo('home')} className="flex items-center gap-2.5">
            {siteSettings.logoUrl ? <img src={siteSettings.logoUrl} alt="" className="w-7 h-7 rounded-lg object-cover border border-dark-border" /> : <div className="w-7 h-7 rounded-lg bg-neon/10 flex items-center justify-center"><Zap className="w-4 h-4 text-neon" /></div>}
            <span className="text-white font-bold text-sm sm:text-base">{siteSettings.siteName}</span>
          </button>
          <div className="hidden sm:flex items-center gap-1">
            <NavBtn label="Home" active={currentView === 'home'} onClick={() => navigateTo('home')} />
            <NavBtn label="Categories" active={currentView === 'categories' || currentView === 'category'} onClick={() => navigateTo('categories')} />
          </div>
          <div className="flex items-center gap-2">
            <button className="relative w-9 h-9 rounded-lg bg-dark-input border border-dark-border flex items-center justify-center text-muted-foreground hover:text-white hover:border-neon/30 transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-[9px] text-white font-bold flex items-center justify-center">8</span>
            </button>
            <button className="sm:hidden w-9 h-9 rounded-lg bg-dark-input border border-dark-border flex items-center justify-center text-muted-foreground hover:text-white" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <AnimatePresence>{menuOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="sm:hidden border-t border-dark-border bg-dark-bg/95 backdrop-blur-xl overflow-hidden">
            <div className="p-3 space-y-1">
              <MobItem icon={<Home className="w-4 h-4" />} label="Home" onClick={() => navigateTo('home')} />
              <MobItem icon={<Grid3x3 className="w-4 h-4" />} label="Categories" onClick={() => navigateTo('categories')} />
            </div>
          </motion.div>
        )}</AnimatePresence>
      </header>

      {/* Main Content */}
      <main ref={mainRef} className={`flex-1 max-w-5xl w-full mx-auto px-4 py-5 ${showNav ? 'pb-24' : 'pb-6'}`}>
        <AnimatePresence mode="wait">
          <motion.div key={currentView + JSON.stringify(viewParams)} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
            {currentView === 'home' && renderHome()}
            {currentView === 'categories' && renderCategories()}
            {currentView === 'category' && renderCategory()}
            {currentView === 'post' && renderPost()}
            {currentView === 'login' && renderLogin()}
            {currentView === 'admin' && renderAdmin()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Nav */}
      {showNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-dark-bg/95 backdrop-blur-xl border-t border-dark-border">
          <div className="max-w-lg mx-auto flex items-center justify-around py-2 px-4">
            <BtmNav icon={<Home className="w-5 h-5" />} label="Home" active={currentView === 'home'} onClick={() => navigateTo('home')} />
            <BtmNav icon={<Grid3x3 className="w-5 h-5" />} label="Categories" active={currentView === 'categories' || currentView === 'category'} onClick={() => navigateTo('categories')} />
          </div>
        </nav>
      )}
    </div>
  );
}

// ─── Sub Components ─────────────────────────────────────────

function LoginForm({ onLogin }: { onLogin: (u: string, p: string) => void }) {
  const [u, setU] = useState(''); const [p, setP] = useState(''); const [loading, setLoading] = useState(false); const [err, setErr] = useState('');
  const submit = async (e: React.FormEvent) => { e.preventDefault(); setErr(''); if (!u || !p) { setErr('Enter both fields'); return; } setLoading(true); await onLogin(u, p); setLoading(false); };
  return (
    <form onSubmit={submit} className="p-6 space-y-4">
      {err && <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm"><AlertCircle className="w-4 h-4" />{err}</div>}
      <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Username</label><Input type="text" placeholder="admin" value={u} onChange={(e) => setU(e.target.value)} className="bg-dark-input border-dark-border text-white placeholder:text-muted-foreground input-glow" /></div>
      <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Password</label><Input type="password" placeholder="•••••••••" value={p} onChange={(e) => setP(e.target.value)} className="bg-dark-input border-dark-border text-white placeholder:text-muted-foreground input-glow" /></div>
      <Button type="submit" disabled={loading} className="neon-glow-btn w-full py-3">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Shield className="w-4 h-4 mr-2" /> Access Admin Panel</>}</Button>
    </form>
  );
}

function PostImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return (
      <div className={`${className || ''} bg-dark-surface flex items-center justify-center border border-dark-border`}>
        <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
      </div>
    );
  }
  return <img src={src} alt={alt} className={className || ''} onError={() => setErr(true)} />;
}

function PostCard({ post, onClick }: { post: Post; onClick: () => void }) {
  return (
    <Card className="glass-card border-dark-border overflow-hidden cursor-pointer group" onClick={onClick}>
      <div className="relative overflow-hidden">
        <PostImage src={post.imageUrl} alt={post.title} className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute top-2 left-2">
          <Badge className="backdrop-blur-sm border text-[9px]" style={{ backgroundColor: `${post.category.color}30`, color: post.category.color, borderColor: `${post.category.color}50` }}>{post.category.name}</Badge>
        </div>
        {post.warning && (
          <div className="absolute top-2 right-2">
            <Badge className="backdrop-blur-sm bg-yellow-500/20 text-yellow-400 border-yellow-500/40 text-[9px]"><TriangleAlert className="w-2.5 h-2.5 mr-0.5" />{post.warning}</Badge>
          </div>
        )}
      </div>
      <CardContent className="p-3">
        <h3 className="font-bold text-white text-xs line-clamp-1">{post.title}</h3>
        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{post.description}</p>
        <div className="mt-2.5 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          <button
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold text-white transition-all hover:opacity-90 active:scale-95"
            style={{ backgroundColor: post.buttonColor, boxShadow: `0 0 8px ${post.buttonColor}30` }}
            onClick={(e) => { e.stopPropagation(); window.open(post.buttonLink || `/go?id=${post.id}`, '_blank'); }}>
            <Download className="w-3 h-3" />{post.buttonText}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (<div className="flex flex-col items-center justify-center py-16 text-center">{icon}<h3 className="text-lg font-semibold text-white mt-4">{title}</h3><p className="text-sm text-muted-foreground mt-1 max-w-sm">{description}</p></div>);
}

function BtmNav({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-0.5 py-1 px-4 rounded-lg transition-all ${active ? 'text-neon' : 'text-muted-foreground hover:text-white'}`}>
      <div className={active ? 'drop-shadow-[0_0_6px_rgba(0,240,255,0.5)]' : ''}>{icon}</div>
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}

function NavBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (<Button variant="ghost" size="sm" onClick={onClick} className={`text-sm ${active ? 'text-neon bg-neon/10' : 'text-muted-foreground hover:text-white hover:bg-dark-surface'}`}>{label}</Button>);
}

function MobItem({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (<button onClick={onClick} className="flex items-center gap-3 w-full p-2.5 rounded-lg text-sm transition-colors text-muted-foreground hover:text-white hover:bg-dark-surface">{icon} {label}</button>);
}
