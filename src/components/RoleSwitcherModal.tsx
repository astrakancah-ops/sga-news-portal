import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { VerifiedBadge, isUserAdminOrVerified } from './VerifiedBadge';
import { Shield, Lock, X, PlusCircle, LogIn, LogOut, UserCheck, Camera } from 'lucide-react';
import { getStoredUsers, setCurrentUser } from '../utils/storage';
import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

interface RoleSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onUserChanged: (newUser: User | null) => void;
  availableUsers?: User[];
  onOpenEditProfile?: () => void;
}

export const RoleSwitcherModal: React.FC<RoleSwitcherModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChanged,
  availableUsers,
  onOpenEditProfile
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register Form State
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newBio, setNewBio] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState('');

  if (!isOpen) return null;

  // Preset Accounts for Instant Switch / Quick Sign In
  const PRESET_ACCOUNTS: User[] = [
    {
      id: 'user-admin-owner',
      name: 'Admin SGA Redaksi',
      email: 'admin@sganews.id',
      role: 'admin',
      avatar: 'https://ik.imagekit.io/dxokd3m9y/sgaicon.png',
      bio: 'Pemimpin Redaksi Utama & Owner SGA News Portal. Bertanggung jawab atas kebijakan jurnalistik, verifikasi berita, dan pengawasan tim redaksi.',
      joinedDate: 'Januari 2024',
      articlesCount: 18
    },
    {
      id: 'user-editor-1',
      name: 'Dewi Redaktur',
      email: 'editor@sganews.id',
      role: 'editor',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200',
      bio: 'Editor Senior Berita Nasional & Ekonomi SGA News.',
      joinedDate: 'Maret 2024',
      articlesCount: 12
    },
    {
      id: 'user-author-1',
      name: 'Rahadian Penulis',
      email: 'penulis@sganews.id',
      role: 'author',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
      bio: 'Jurnalis Teknologi & Sains SGA Media.',
      joinedDate: 'April 2024',
      articlesCount: 8
    }
  ];

  const handleSelectPreset = (user: User) => {
    setCurrentUser(user);
    onUserChanged(user);
    onClose();
  };

  // Handles Login for Admin SGA Redaksi & Registered Writers
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const cleanEmail = loginEmail.trim().toLowerCase();
    const cleanPass = loginPassword.trim();

    if (!cleanEmail) {
      setLoginError('Harap isi email/ID Anda.');
      return;
    }

    // 1. Check Owner / Admin SGA Redaksi Authentication
    if (
      cleanEmail === 'admin@sganews.id' || cleanEmail === 'astrakancah@gmail.com' || cleanEmail === 'admin'
    ) {
      if (cleanPass !== 'SGA2026-Pemred-Owner') {
        setLoginError('Kombinasi ID atau Kata Sandi Admin salah! Akses ditolak.');
        return;
      }
      const adminUser = PRESET_ACCOUNTS[0];
      setCurrentUser(adminUser);
      onUserChanged(adminUser);
      onClose();
      return;
    }

    // 2. Check Registered Users in Local Storage / Firestore
    const storedUsers = getStoredUsers();
    const matchedUser = storedUsers.find(u => u.email.toLowerCase() === cleanEmail);

    if (matchedUser) {
      setCurrentUser(matchedUser);
      onUserChanged(matchedUser);
      onClose();
      return;
    }

    setLoginError('Kombinasi Email atau ID tidak ditemukan. Anda dapat mendaftar di tab "Daftar Penulis Baru".');
  };

  // Handles New Author Registration
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail || !newPassword) {
      setLoginError('Harap lengkapi semua bidang pendaftaran.');
      return;
    }

    const newUser: User = {
      id: 'user-' + Date.now(),
      name: newName,
      email: newEmail.trim(),
      role: 'author',
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200`,
      bio: newBio || 'Penulis Komunitas Baru di SGA News Portal.',
      joinedDate: new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
      articlesCount: 0,
      followersCount: 0,
      profileLikesCount: 0,
      followers: []
    };

    try {
      if (db) {
        await setDoc(doc(db, 'users', newUser.id), newUser);
      }
    } catch (err) {
      console.error('Failed to sync user to Firestore', err);
    }

    const existingUsers = getStoredUsers();
    const updated = [...existingUsers, newUser];
    localStorage.setItem('sga_news_users_v1', JSON.stringify(updated));

    setCurrentUser(newUser);
    onUserChanged(newUser);
    setRegisterSuccess('Pendaftaran berhasil! Akun Penulis Anda telah aktif.');
    setTimeout(() => {
      onClose();
    }, 600);
  };

  // Handle Logout / Sign Out
  const handleLogout = () => {
    setCurrentUser(null);
    onUserChanged(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden p-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-lg flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Sign in / Sign up SGA News
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Masuk atau buat akun untuk mengakses fitur redaksi & publikasi
            </p>
          </div>
          <button 
            onClick={onClose}
            aria-label="Tutup Dialog"
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Account Status */}
        {currentUser ? (
          <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0 group">
                <img 
                  src={currentUser.avatar} 
                  alt={currentUser.name}
                  className="w-10 h-10 rounded-full object-cover border border-slate-300 dark:border-slate-600 shadow-sm" 
                />
                {onOpenEditProfile && (
                  <button
                    onClick={onOpenEditProfile}
                    title="Ubah Foto Profil"
                    className="absolute -bottom-1 -right-1 p-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-md transition"
                  >
                    <Camera className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                  <span className="truncate">{currentUser.name}</span>
                  {isUserAdminOrVerified(currentUser.role, currentUser.name, currentUser.isVerified) && <VerifiedBadge size="xs" />}
                  <span className="px-1.5 py-0.5 text-[9px] font-black uppercase rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 shrink-0">
                    {currentUser.role}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[180px]">
                  {currentUser.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 text-xs font-bold rounded-lg transition flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-300 text-xs font-medium flex items-center gap-2">
            <UserCheck className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400" />
            <span>Anda belum masuk. Silakan Sign in / Sign up untuk melanjutkan.</span>
          </div>
        )}



        {/* Tabs: Login vs Register */}
        <div className="mt-4 flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
          <button
            onClick={() => {
              setActiveTab('login');
              setLoginError('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
              activeTab === 'login'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            Masuk Akun
          </button>
          <button
            onClick={() => {
              setActiveTab('register');
              setLoginError('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
              activeTab === 'register'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Daftar Penulis Baru
          </button>
        </div>

        {/* TAB 1: LOGIN FORM */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="mt-4 space-y-3.5">
            {loginError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs rounded-xl font-medium">
                {loginError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Alamat Email / ID Pengguna
              </label>
              <input
                type="text"
                required
                placeholder="misal: nama@email.com"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kata Sandi
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              Masuk ke Sistem SGA
            </button>
          </form>
        )}

        {/* TAB 2: REGISTER FORM */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="mt-4 space-y-3">
            {registerSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl font-bold flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                {registerSuccess}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nama Lengkap Penulis
              </label>
              <input
                type="text"
                required
                placeholder="misal: Rahadian Maulana"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Alamat Email
              </label>
              <input
                type="email"
                required
                placeholder="rahadian@sganews.id"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kata Sandi Akun
              </label>
              <input
                type="password"
                required
                placeholder="Buat kata sandi minimal 6 karakter"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Biografi Singkat Penulis
              </label>
              <textarea
                rows={2}
                placeholder="Pengamat teknologi dan kontributor jurnalistik..."
                value={newBio}
                onChange={e => setNewBio(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs rounded-xl hover:bg-slate-800 transition shadow-md flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              Daftar & Masuk sebagai Penulis
            </button>
          </form>
        )}

      </div>
    </div>
  );
};

