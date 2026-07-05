import React from 'react';
import { Category } from '../types';
import { BookOpen, PenTool, Mail, Phone, MapPin, ShieldCheck, FileCode, ExternalLink } from 'lucide-react';

interface FooterProps {
  onSelectCategory: (cat: Category | 'Semua') => void;
  onOpenLegalModal: () => void;
  onOpenWriteDashboard: () => void;
  onOpenRoleModal: () => void;
  onOpenSitemapModal?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onSelectCategory,
  onOpenLegalModal,
  onOpenWriteDashboard,
  onOpenRoleModal,
  onOpenSitemapModal
}) => {
  const categories: Category[] = [
    'Sepak Bola',
    'Teknologi',
    'Olahraga',
    'Hiburan',
    'Bisnis',
    'Gaya Hidup',
    'Sains'
  ];

  return (
    <footer className="bg-slate-950 text-slate-400 text-xs border-t border-slate-800">
      
      {/* Top Banner Callout for Authors */}
      <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-slate-900 text-white py-6 px-4 sm:px-8 border-b border-blue-800/60">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-extrabold text-base sm:text-lg tracking-tight uppercase">
              PORTAL BERITA TERKINI & WARTA WARGA INDONESIA - KIRIM TULISAN ANDA!
            </h3>
            <p className="text-xs text-slate-200">
              Kirimkan artikel berita terkini Sepak Bola, Teknologi, Hiburan, Bisnis, & Warta Daerah. Bergabunglah bersama komunitas penulis independen SGA News dan publikasikan karya Anda!
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenWriteDashboard}
              className="px-5 py-2.5 bg-white text-slate-950 hover:bg-slate-100 font-extrabold text-xs rounded-xl shadow-lg transition flex items-center gap-1.5"
            >
              <PenTool className="w-4 h-4 text-blue-600" />
              Tulis Berita Sekarang
            </button>
            <button
              onClick={onOpenRoleModal}
              className="px-4 py-2.5 bg-blue-950/80 hover:bg-blue-950 border border-blue-700 text-white font-bold text-xs rounded-xl transition"
            >
              Daftar Akun
            </button>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Col 1: SGA Brand (4 cols) */}
        <div className="md:col-span-4 space-y-3">
          <div className="flex items-center gap-2.5">
            <img 
              src="https://ik.imagekit.io/dxokd3m9y/sgaicon.png" 
              alt="SGA Logo" 
              className="w-9 h-9 rounded-lg object-cover border border-slate-800"
            />
            <span className="font-black text-xl text-white uppercase font-sans">
              SGA <span className="text-blue-500">NEWS</span>
            </span>
          </div>

          <p className="text-slate-400 leading-relaxed">
            Portal Berita & Media Komunitas SGA Media. Menghadirkan informasi tepercaya, independen, dan berimbang seputar Teknologi, Sains, Bisnis, dan Gaya Hidup Nusantara.
          </p>

          <div className="pt-2 space-y-1 text-slate-400 text-[11px]">
            <p className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-blue-500" />
              Gedung Pers Media SGA, Jakarta Pusat
            </p>
            <p className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-blue-500" />
              redaksi@sganews.id
            </p>
          </div>
        </div>

        {/* Col 2: Kategori (3 cols) */}
        <div className="md:col-span-3 space-y-3">
          <h4 className="font-bold text-white uppercase tracking-wider text-xs border-b border-slate-800 pb-2">
            Kategori Berita Utama
          </h4>
          <ul className="grid grid-cols-2 gap-2 text-xs">
            {categories.map((cat) => (
              <li key={cat}>
                <button
                  onClick={() => onSelectCategory(cat)}
                  className="hover:text-blue-400 transition"
                >
                  • {cat}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 3: Legal & Guidelines (5 cols) */}
        <div className="md:col-span-5 space-y-3">
          <h4 className="font-bold text-white uppercase tracking-wider text-xs border-b border-slate-800 pb-2">
            Pedoman Redaksi & Hukum
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <button onClick={onOpenLegalModal} className="hover:text-white flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                Panduan Menulis & Kode Etik
              </button>
            </li>
            <li>
              <button onClick={onOpenLegalModal} className="hover:text-white flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                Syarat & Ketentuan Layanan (TOS)
              </button>
            </li>
            <li>
              <button onClick={onOpenLegalModal} className="hover:text-white flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                Kebijakan Privasi Pengguna
              </button>
            </li>
          </ul>
        </div>

      </div>

      {/* Bottom Bar */}
      <div className="bg-slate-900 py-4 px-4 sm:px-8 border-t border-slate-800 text-center text-[11px] text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <p>© 2026 SGA News Portal (sganews.id). Hak Cipta Dilindungi Undang-Undang.</p>
          <p className="text-slate-400">Sistem Portal Berita Lengkap Komunitas & Redaksi</p>
        </div>
      </div>

    </footer>
  );
};
