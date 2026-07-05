import React, { useState, useEffect } from 'react';
import { Article, Category, User } from './types';
import { getCurrentUser, getStoredUsers, getBookmarks, toggleBookmark, OFFICIAL_ADMIN_USER } from './utils/storage';
import { INITIAL_USERS } from './data/initialData';
import { subscribeToArticles, subscribeToUsers } from './services/firestoreService';
import { updateArticleSEO } from './utils/seo';
import { isUserAdminOrVerified } from './components/VerifiedBadge';
import { Navbar } from './components/Navbar';
import { HeroHeadline } from './components/HeroHeadline';
import { TrendingSidebar } from './components/TrendingSidebar';
import { ArticleCard } from './components/ArticleCard';
import { ArticleDetail } from './components/ArticleDetail';
import { AuthorProfile } from './components/AuthorProfile';
import { AuthorDashboard } from './components/AuthorDashboard';
import { EditorDashboard } from './components/EditorDashboard';
import { LegalModal } from './components/LegalModal';
import { RoleSwitcherModal } from './components/RoleSwitcherModal';
import { EditProfileModal } from './components/EditProfileModal';
import { EditArticleModal } from './components/EditArticleModal';
import { BookmarksDrawer } from './components/BookmarksDrawer';
import { SitemapModal } from './components/SitemapModal';
import { Footer } from './components/Footer';
import { GoogleAdUnit } from './components/GoogleAdUnit';
import { Search } from 'lucide-react';

export default function App() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(getCurrentUser());
  const [selectedCategory, setSelectedCategory] = useState<Category | 'Semua'>('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);
  
  // Views
  const [activeView, setActiveView] = useState<'home' | 'detail' | 'author-cms' | 'editor-cms' | 'author-profile'>('home');
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [selectedAuthorId, setSelectedAuthorId] = useState<string | null>(null);
  const [selectedAuthorName, setSelectedAuthorName] = useState<string | null>(null);

  // Modals & Drawers
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false);
  const [bookmarksDrawerOpen, setBookmarksDrawerOpen] = useState(false);
  const [editArticleModalOpen, setEditArticleModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [sitemapModalOpen, setSitemapModalOpen] = useState(false);

  // Helper to generate clean SEO-friendly URL slugs without %20 or special chars
  const createSlug = (text: string) => {
    if (!text) return '';
    return text
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Helper to resolve current URL path to appropriate view and state
  const resolveRoute = (articlesList: Article[], usersList: User[]) => {
    const rawPathname = window.location.pathname;
    let decodedPath = rawPathname;
    try {
      decodedPath = decodeURIComponent(rawPathname);
    } catch (e) {
      decodedPath = rawPathname;
    }

    const searchParams = new URLSearchParams(window.location.search);
    const articleParam = searchParams.get('article');

    if (articleParam) {
      const art = articlesList.find(a => a.id === articleParam);
      if (art) {
        setSelectedArticleId(art.id);
        setActiveView('detail');
        try {
          const authorSlug = createSlug(art.authorName || 'penulis');
          const articleSlug = art.slug ? createSlug(art.slug) : createSlug(art.title);
          const cleanPath = `/${authorSlug}/${articleSlug || art.id}`;
          window.history.replaceState({ view: 'detail', articleId: art.id }, '', cleanPath);
        } catch (e) {}
        return;
      }
    }

    if (decodedPath === '/' || decodedPath === '') {
      setActiveView('home');
      setSelectedArticleId(null);
      setSelectedAuthorId(null);
      setSelectedAuthorName(null);
      return;
    }

    if (decodedPath.startsWith('/penulis/')) {
      const name = decodedPath.replace('/penulis/', '').trim();
      if (name) {
        const slugName = createSlug(name);
        if (
          name === 'user-admin-owner' || 
          name === 'user-admin-1' || 
          slugName === 'admin-sga-redaksi' || 
          slugName === 'admin'
        ) {
          setSelectedAuthorId('user-admin-owner');
          setSelectedAuthorName('Admin SGA Redaksi');
          setActiveView('author-profile');
          try {
            window.history.replaceState({ view: 'author-profile', authorId: 'user-admin-owner', authorName: 'Admin SGA Redaksi' }, '', '/admin-sga-redaksi');
          } catch (e) {}
          return;
        }

        const u = usersList.find(usr => 
          usr && usr.name && (
            usr.id === name ||
            usr.name.toLowerCase() === name.toLowerCase() ||
            createSlug(usr.name) === createSlug(name)
          )
        ) || INITIAL_USERS.find(usr =>
          usr.id === name ||
          usr.name.toLowerCase() === name.toLowerCase() ||
          createSlug(usr.name) === createSlug(name)
        );
        const resolvedAuthorId = u?.id || null;
        const resolvedAuthorName = u ? u.name : name;
        setSelectedAuthorId(resolvedAuthorId);
        setSelectedAuthorName(resolvedAuthorName);
        setActiveView('author-profile');
        try {
          const authorSlug = createSlug(resolvedAuthorName);
          window.history.replaceState({ view: 'author-profile', authorId: resolvedAuthorId, authorName: resolvedAuthorName }, '', '/' + (authorSlug || name));
        } catch (e) {}
        return;
      }
    }

    if (decodedPath === '/redaksi/penulis') {
      setActiveView('author-cms');
      return;
    }

    if (decodedPath === '/redaksi/editor') {
      setActiveView('editor-cms');
      return;
    }

    // Parse URL path segments (e.g. /nama-penulis/judul-artikel)
    const pathSegments = decodedPath.split('/').filter(p => p.trim().length > 0);

    if (pathSegments.length >= 2 && articlesList.length > 0) {
      // Structure: /nama-penulis/judul-artikel
      const authorSeg = pathSegments[0];
      const articleSeg = pathSegments[1];
      const targetAuthorSlug = createSlug(authorSeg);
      const targetArticleSlug = createSlug(articleSeg);

      // Find article by matching article slug/title/id and author slug
      const matched = articlesList.find(a => {
        const titleMatch = (
          a.id === articleSeg ||
          a.slug === articleSeg ||
          (a.slug && createSlug(a.slug) === targetArticleSlug) ||
          createSlug(a.title) === targetArticleSlug ||
          a.title.toLowerCase() === articleSeg.toLowerCase()
        );
        const authorMatch = (
          createSlug(a.authorName || '') === targetAuthorSlug ||
          a.authorId === authorSeg
        );
        return titleMatch && authorMatch;
      }) || articlesList.find(a => (
        a.id === articleSeg ||
        a.slug === articleSeg ||
        (a.slug && createSlug(a.slug) === targetArticleSlug) ||
        createSlug(a.title) === targetArticleSlug ||
        a.title.toLowerCase() === articleSeg.toLowerCase()
      ));

      if (matched) {
        setSelectedArticleId(matched.id);
        setActiveView('detail');
        return;
      }
    }

    if (pathSegments.length === 1) {
      // Fallback structure: /judul-artikel or /nama-penulis
      const rawTitleOrId = pathSegments[0];
      const slugOfPath = createSlug(rawTitleOrId);

      // Check article first if articles exist
      if (articlesList && articlesList.length > 0) {
        const matched = articlesList.find(a => 
          a.id === rawTitleOrId || 
          a.slug === rawTitleOrId ||
          (a.slug && createSlug(a.slug) === slugOfPath) ||
          createSlug(a.title) === slugOfPath ||
          a.title === rawTitleOrId || 
          a.title.toLowerCase() === rawTitleOrId.toLowerCase()
        );

        if (matched) {
          setSelectedArticleId(matched.id);
          setActiveView('detail');
          return;
        }
      }

      // Check if path directly matches an Author slug/name/id (e.g., /admin-sga-redaksi)
      if (
        rawTitleOrId === 'user-admin-owner' || 
        rawTitleOrId === 'user-admin-1' || 
        slugOfPath === 'admin-sga-redaksi' || 
        slugOfPath === 'admin'
      ) {
        setSelectedAuthorId('user-admin-owner');
        setSelectedAuthorName('Admin SGA Redaksi');
        setActiveView('author-profile');
        return;
      }

      const u = usersList.find(usr => 
        usr && usr.name && (
          usr.id === rawTitleOrId ||
          usr.name.toLowerCase() === rawTitleOrId.toLowerCase() ||
          createSlug(usr.name) === slugOfPath
        )
      ) || INITIAL_USERS.find(usr =>
        usr.id === rawTitleOrId ||
        usr.name.toLowerCase() === rawTitleOrId.toLowerCase() ||
        createSlug(usr.name) === slugOfPath
      );

      if (u) {
        setSelectedAuthorId(u.id);
        setSelectedAuthorName(u.name);
        setActiveView('author-profile');
        return;
      }
    }
  };

  // Subscribe to real-time Firestore synchronization
  useEffect(() => {
    setBookmarkedIds(getBookmarks());

    // Subscribe to Articles Collection in Firestore
    const unsubscribeArticles = subscribeToArticles((updatedArticles) => {
      setArticles(updatedArticles);
      setIsLiveConnected(true);
      resolveRoute(updatedArticles, users);
    });

    // Subscribe to Users Collection in Firestore
    const unsubscribeUsers = subscribeToUsers((updatedUsers) => {
      const stored = getStoredUsers();
      const userMap = new Map<string, User>();

      // 1. Initial base users
      INITIAL_USERS.forEach(u => {
        if (!u || !u.id) return;
        userMap.set(u.id, u);
      });
      userMap.set(OFFICIAL_ADMIN_USER.id, OFFICIAL_ADMIN_USER);

      // 2. Add stored local users as fallback
      stored.forEach(u => {
        if (!u || !u.id) return;
        const targetId = (u.id === OFFICIAL_ADMIN_USER.id || u.email === 'admin@sganews.id') ? OFFICIAL_ADMIN_USER.id : u.id;
        const existing = userMap.get(targetId) || {};
        userMap.set(targetId, { ...existing, ...u });
      });

      // 3. Apply real-time Firestore updates (Firestore is source of truth!)
      updatedUsers.forEach(u => {
        if (!u || !u.id) return;
        const targetId = (u.id === OFFICIAL_ADMIN_USER.id || u.email === 'admin@sganews.id') ? OFFICIAL_ADMIN_USER.id : u.id;
        const existing = userMap.get(targetId) || {};
        userMap.set(targetId, { ...existing, ...u });
      });

      const combined = Array.from(userMap.values());
      setUsers(combined);

      // 4. Real-time sync for current logged in user persona
      setCurrentUser(prevUser => {
        if (!prevUser) return prevUser;
        const targetId = (prevUser.id === OFFICIAL_ADMIN_USER.id || prevUser.email === 'admin@sganews.id') ? OFFICIAL_ADMIN_USER.id : prevUser.id;
        const updatedSelf = userMap.get(targetId);
        if (updatedSelf) {
          try {
            localStorage.setItem('sga_news_current_user_v1', JSON.stringify(updatedSelf));
          } catch (e) {}
          return updatedSelf;
        }
        return prevUser;
      });
    });

    return () => {
      unsubscribeArticles();
      unsubscribeUsers();
    };
  }, []);

  // Sync route on browser back/forward (popstate)
  useEffect(() => {
    const handlePopState = () => {
      resolveRoute(articles, users);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [articles, users]);

  // Automatically sync articles with latest user verification badges, roles, and avatars
  const syncedArticles = React.useMemo(() => {
    if (!articles || articles.length === 0) return [];
    return articles.map(art => {
      const authorUser = users.find(u => 
        u && (
          (art.authorId && u.id === art.authorId) ||
          (art.authorName && u.name && u.name.toLowerCase() === art.authorName.toLowerCase()) ||
          (art.authorEmail && u.email && u.email.toLowerCase() === art.authorEmail.toLowerCase())
        )
      );

      if (authorUser) {
        const isVerified = authorUser.isVerified ?? isUserAdminOrVerified(authorUser.role, authorUser.name, authorUser.isVerified);
        return {
          ...art,
          isVerified,
          authorRole: authorUser.role || art.authorRole,
          authorAvatar: authorUser.avatar || art.authorAvatar,
          authorName: authorUser.name || art.authorName
        };
      } else {
        const isVerified = art.isVerified ?? isUserAdminOrVerified(art.authorRole, art.authorName, art.isVerified);
        return {
          ...art,
          isVerified
        };
      }
    });
  }, [articles, users]);

  // Currently selected article (synced in real-time if updated)
  const selectedArticle = selectedArticleId 
    ? syncedArticles.find(a => a.id === selectedArticleId) || null 
    : null;

  // Dynamic SEO Meta Tags Sync Effect
  useEffect(() => {
    const authorUser = users.find(u => 
      u && (
        (selectedAuthorId && u.id === selectedAuthorId) || 
        (selectedAuthorName && u.name && u.name.toLowerCase() === selectedAuthorName.toLowerCase())
      )
    );
    const authorArticles = syncedArticles.filter(a => 
      a && (
        (selectedAuthorId && a.authorId === selectedAuthorId) || 
        (selectedAuthorName && a.authorName && a.authorName.toLowerCase() === selectedAuthorName.toLowerCase()) ||
        (authorUser && a.authorId === authorUser.id)
      )
    );

    updateArticleSEO(
      selectedArticle, 
      selectedCategory, 
      activeView, 
      selectedAuthorName,
      authorUser,
      authorArticles.filter(a => a.status === 'published' || !a.status).length,
      authorArticles
    );
  }, [selectedArticle, selectedCategory, activeView, selectedAuthorName, selectedAuthorId, users, syncedArticles]);

  const handleToggleBookmark = (id: string) => {
    toggleBookmark(id);
    setBookmarkedIds(getBookmarks());
  };

  const handleSelectArticle = (art: Article) => {
    setSelectedArticleId(art.id);
    setActiveView('detail');
    try {
      const authorSlug = createSlug(art.authorName || 'penulis');
      const articleSlug = art.slug ? createSlug(art.slug) : createSlug(art.title);
      const articlePath = `/${authorSlug}/${articleSlug || art.id}`;
      window.history.pushState({ view: 'detail', articleId: art.id }, '', articlePath);
    } catch (e) {
      console.error(e);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectAuthor = (authorId: string, authorName: string) => {
    setSelectedAuthorId(authorId);
    setSelectedAuthorName(authorName);
    setActiveView('author-profile');
    try {
      const slug = createSlug(authorName);
      window.history.pushState({ view: 'author-profile', authorId, authorName }, '', '/' + (slug || authorId));
    } catch (e) {
      console.error(e);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateHome = () => {
    setActiveView('home');
    setSelectedArticleId(null);
    setSelectedAuthorId(null);
    setSelectedAuthorName(null);
    try {
      window.history.pushState({ view: 'home' }, '', '/');
    } catch (e) {
      console.error(e);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filter published articles for home view
  const publishedArticles = syncedArticles.filter(a => a.status === 'published');
  
  const filteredArticles = publishedArticles.filter(a => {
    const matchCategory = selectedCategory === 'Semua' || a.category === selectedCategory;
    const matchSearch = !searchQuery || 
      (a.title && a.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (a.excerpt && a.excerpt.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (a.authorName && a.authorName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (a.tags && a.tags.some(t => t && t.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchCategory && matchSearch;
  });

  const bookmarkedArticles = publishedArticles.filter(a => bookmarkedIds.includes(a.id));

  return (
    <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      
      {/* Navbar Component */}
      <Navbar
        articles={syncedArticles}
        onSelectArticle={handleSelectArticle}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        currentUser={currentUser}
        onOpenRoleModal={() => setRoleModalOpen(true)}
        onOpenLegalModal={() => setLegalModalOpen(true)}
        onOpenBookmarks={() => setBookmarksDrawerOpen(true)}
        bookmarkCount={bookmarkedIds.length}
        onOpenWriteDashboard={() => {
          if (!currentUser) {
            setRoleModalOpen(true);
          } else {
            setActiveView('author-cms');
            try {
              window.history.pushState({ view: 'author-cms' }, '', '/redaksi/penulis');
            } catch (e) {}
          }
        }}
        onOpenRedaksiDashboard={() => {
          if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'editor')) {
            setRoleModalOpen(true);
          } else {
            setActiveView('editor-cms');
            try {
              window.history.pushState({ view: 'editor-cms' }, '', '/redaksi/editor');
            } catch (e) {}
          }
        }}
        activeView={activeView}
        onNavigateHome={handleNavigateHome}
        onOpenSitemapModal={() => setSitemapModalOpen(true)}
        onSelectAuthor={handleSelectAuthor}
      />

      {/* Header Google AdSense Banner (Renders if approved in Admin Dashboard) */}
      <GoogleAdUnit position="headerBanner" className="max-w-7xl w-full mx-auto px-3 sm:px-8 pt-3" />

      {/* Main Body View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-8 py-4 sm:py-6">
        
        {/* VIEW 1: HOME PAGE */}
        {activeView === 'home' && (
          <div className="space-y-10">
            
            {/* Hero Breaking News Section (Shows when no search query and 'Semua' category selected) */}
            {!searchQuery && selectedCategory === 'Semua' && (
              <HeroHeadline
                articles={syncedArticles}
                onSelectArticle={handleSelectArticle}
                onToggleBookmark={handleToggleBookmark}
                bookmarkedIds={bookmarkedIds}
                onSelectAuthor={handleSelectAuthor}
              />
            )}

            {/* Category Title / Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-6 bg-blue-600 rounded-sm"></span>
                <h2 className="text-xl font-extrabold uppercase tracking-tight text-slate-900 dark:text-white font-sans">
                  {searchQuery 
                    ? `HASIL PENCARIAN: "${searchQuery}"` 
                    : selectedCategory === 'Semua' 
                      ? 'INFORMATIF & TERKINI SEPUTAR INDONESIA' 
                      : `BERITA KATEGORI ${selectedCategory.toUpperCase()}`}
                </h2>
                <span className="text-xs font-bold text-slate-400">
                  ({filteredArticles.length} Warta)
                </span>
              </div>

              {selectedCategory !== 'Semua' && (
                <button
                  onClick={() => setSelectedCategory('Semua')}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  Lihat Semua Kategori
                </button>
              )}
            </div>

            {/* Main Content & Sidebar Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Main Articles Grid (8 cols) */}
              <div className="lg:col-span-8">
                {filteredArticles.length === 0 ? (
                  <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <Search className="w-10 h-10 text-slate-400 mx-auto" />
                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                      Tidak ditemukan berita yang cocok
                    </h3>
                    <p className="text-xs text-slate-500">
                      Coba gunakan kata kunci lain atau pilih kategori berita yang berbeda.
                    </p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('Semua');
                      }}
                      className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl"
                    >
                      Bersihkan Filter
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {filteredArticles.map((art) => (
                      <ArticleCard
                        key={art.id}
                        article={art}
                        onSelectArticle={handleSelectArticle}
                        onToggleBookmark={handleToggleBookmark}
                        isBookmarked={bookmarkedIds.includes(art.id)}
                        onSelectAuthor={handleSelectAuthor}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Sidebar Widget Area (4 cols) */}
              <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
                <TrendingSidebar
                  articles={publishedArticles}
                  onSelectArticle={handleSelectArticle}
                  onToggleBookmark={handleToggleBookmark}
                  bookmarkedIds={bookmarkedIds}
                  onSelectAuthor={handleSelectAuthor}
                />
              </div>

            </div>

          </div>
        )}

        {/* VIEW 2: ARTICLE DETAIL VIEW */}
        {activeView === 'detail' && selectedArticle && (
          <ArticleDetail
            article={selectedArticle}
            currentUser={currentUser}
            onBack={handleNavigateHome}
            onToggleBookmark={handleToggleBookmark}
            isBookmarked={bookmarkedIds.includes(selectedArticle.id)}
            onSelectArticle={handleSelectArticle}
            allArticles={syncedArticles}
            onSelectAuthor={handleSelectAuthor}
          />
        )}

        {/* VIEW 3: AUTHOR PROFILE VIEW */}
        {activeView === 'author-profile' && (
          <AuthorProfile
            authorId={selectedAuthorId}
            authorName={selectedAuthorName}
            usersList={users}
            allArticles={syncedArticles}
            onBack={handleNavigateHome}
            onSelectArticle={handleSelectArticle}
            onToggleBookmark={handleToggleBookmark}
            bookmarkedIds={bookmarkedIds}
            currentUser={currentUser}
            onOpenEditProfile={() => setEditProfileModalOpen(true)}
            onEditArticle={(art) => {
              setEditingArticle(art);
              setEditArticleModalOpen(true);
            }}
          />
        )}

        {/* VIEW 4: AUTHOR CMS DASHBOARD */}
        {activeView === 'author-cms' && currentUser && (
          <AuthorDashboard
            currentUser={currentUser}
            userArticles={syncedArticles.filter(a => a.authorId === currentUser.id)}
            onSelectArticle={handleSelectArticle}
            onOpenLegalModal={() => setLegalModalOpen(true)}
            onOpenEditProfile={() => setEditProfileModalOpen(true)}
          />
        )}

        {/* VIEW 4: REDAKSI / EDITOR CMS DASHBOARD */}
        {activeView === 'editor-cms' && currentUser && (
          <EditorDashboard
            currentUser={currentUser}
            allArticles={syncedArticles}
            onSelectArticle={handleSelectArticle}
            usersList={users}
            onOpenSitemapModal={() => setSitemapModalOpen(true)}
          />
        )}

      </main>

      {/* Footer Component */}
      <Footer
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          handleNavigateHome();
        }}
        onOpenLegalModal={() => setLegalModalOpen(true)}
        onOpenWriteDashboard={() => {
          if (!currentUser) {
            setRoleModalOpen(true);
          } else {
            setActiveView('author-cms');
          }
        }}
        onOpenRoleModal={() => setRoleModalOpen(true)}
        onOpenSitemapModal={() => setSitemapModalOpen(true)}
      />

      {/* Sitemap XML Generator Modal */}
      <SitemapModal
        isOpen={sitemapModalOpen}
        onClose={() => setSitemapModalOpen(false)}
        articles={articles}
      />

      {/* Role / Persona Switcher Modal */}
      <RoleSwitcherModal
        isOpen={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
        currentUser={currentUser}
        onUserChanged={(newUser) => {
          setCurrentUser(newUser);
        }}
        availableUsers={users}
        onOpenEditProfile={() => setEditProfileModalOpen(true)}
      />

      {/* Edit Profile & Avatar Modal */}
      <EditProfileModal
        isOpen={editProfileModalOpen}
        onClose={() => setEditProfileModalOpen(false)}
        currentUser={currentUser}
        onUserUpdated={(updatedUser) => {
          setCurrentUser(updatedUser);
          setUsers(prevUsers => {
            const exists = prevUsers.some(u => u.id === updatedUser.id || u.email === updatedUser.email);
            if (exists) {
              return prevUsers.map(u => (u.id === updatedUser.id || u.email === updatedUser.email) ? { ...u, ...updatedUser } : u);
            }
            return [...prevUsers, updatedUser];
          });
        }}
      />

      {/* Edit Article Modal */}
      <EditArticleModal
        isOpen={editArticleModalOpen}
        onClose={() => {
          setEditArticleModalOpen(false);
          setEditingArticle(null);
        }}
        article={editingArticle}
        currentUser={currentUser}
      />

      {/* Legal & Editorial Guidelines Modal */}
      <LegalModal
        isOpen={legalModalOpen}
        onClose={() => setLegalModalOpen(false)}
      />

      {/* Bookmarks Drawer */}
      <BookmarksDrawer
        isOpen={bookmarksDrawerOpen}
        onClose={() => setBookmarksDrawerOpen(false)}
        bookmarkedArticles={bookmarkedArticles}
        onSelectArticle={handleSelectArticle}
        onRemoveBookmark={handleToggleBookmark}
      />

      {/* Floating Bottom Sticky Google AdSense Banner */}
      <GoogleAdUnit position="bottomBanner" />

    </div>
  );
}
