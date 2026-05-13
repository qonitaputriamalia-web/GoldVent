import { useState } from 'react';
import Login from './components/Login';
import Chatbot from './components/Chatbot';
import DashboardStats from './components/DashboardStats';
import MasterCustomer from './components/MasterCustomer';
import SignUp from './components/SignUp';
import MasterEquipment from './components/MasterEquipment';
// import MasterCategory from './components/MasterCategory';
// import MasterStaff from './components/MasterStaff';
// import MasterSupplier from './components/MasterSupplier';
// import TransactionRental from './components/TransactionRental';
// import TransactionPayment from './components/TransactionPayment';
// import TransactionReturn from './components/TransactionReturn';

import {
  Users, Package, Tags, Contact, Truck,
  ShoppingCart, CreditCard, RotateCcw, LogOut, Mountain, BarChart3
} from 'lucide-react';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('isAuth') === 'true');
  // State baru buat nyimpen portal mana yang dipilih pas login
  const [portalMode, setPortalMode] = useState(localStorage.getItem('portalMode') || '');

  // Default tab buat Admin
  const [activeTab, setActiveTab] = useState('alat');
  const [authView, setAuthView] = useState('login');

  // Terima mode dari Login.jsx (misal: 'analyst' atau 'admin_crud')
  const handleLoginSuccess = (mode) => {
    localStorage.setItem('isAuth', 'true');
    localStorage.setItem('portalMode', mode);
    setIsLoggedIn(true);
    setPortalMode(mode);
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuth');
    localStorage.removeItem('portalMode');
    setIsLoggedIn(false);
    setPortalMode('');
    setAuthView('login');
  };

  // ==========================================
  // LOGIKA RENDER PINTU DEPAN (BELUM LOGIN)
  // ==========================================
  if (!isLoggedIn) {
    if (authView === 'signup') {
      return <SignUp onSwitchToLogin={() => setAuthView('login')} />;
    }
    return (
      <Login
        onLoginSuccess={handleLoginSuccess}
        onSwitchToSignUp={() => setAuthView('signup')}
      />
    );
  }

  // ==========================================
  // TAMPILAN 1: PORTAL DATA ANALYST (DASHBOARD)
  // ==========================================
  if (portalMode === 'analyst') {
    return (
      <div className="flex flex-col h-screen bg-slate-50 font-sans overflow-hidden">
        <header className="bg-slate-900 text-white p-5 flex justify-between items-center shadow-md z-10">
          <div className="flex items-center gap-3">
            <BarChart3 className="text-blue-500" size={28} />
            <div>
              <h1 className="text-xl font-bold"> GoldVenture Analyst Dashboard</h1>
              <p className="text-xs text-slate-400">Pusat Pantauan Data & Statistik</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 bg-slate-800 hover:bg-red-500/20 text-red-400 hover:text-red-300 px-4 py-2 rounded-lg transition-colors text-sm font-medium">
            <LogOut size={18} /> Keluar
          </button>
        </header>

        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {/* Langsung panggil komponen Dashboard tanpa sidebar */}
            <DashboardStats />
          </div>
        </main>
      </div>
    );
  }

  // ==========================================
  // TAMPILAN 2: PORTAL ADMIN CRUD
  // ==========================================
  const renderContent = () => {
    switch (activeTab) {
      case 'customer': return <MasterCustomer />;
      case 'alat': return <MasterEquipment />;
      // Tinggal buka comment di bawah ini kalau komponennya udah lu buat nanti
      // case 'kategori': return <MasterCategory />;
      // case 'staff': return <MasterStaff />;
      // case 'supplier': return <MasterSupplier />;
      // case 'rental': return <TransactionRental />;
      // case 'payment': return <TransactionPayment />;
      // case 'returns': return <TransactionReturn />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-96 text-slate-400">
            <Mountain size={48} className="mb-4 opacity-50" />
            <h3 className="text-xl font-medium">Halaman {activeTab} Belum Dibuat</h3>
            <p>Silakan buat komponen React-nya terlebih dahulu bos!</p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* --- SIDEBAR MENU --- */}
      <aside className="w-64 bg-purple-950 text-slate-300 flex flex-col z-10 overflow-y-auto custom-scrollbar">
        <div className="p-6 border-b border-purple-800 sticky top-0 bg-purple-950 z-20">
          <h1 className="text-xl font-bold text-white flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black text-white shadow-lg shadow-black/20">
              <Mountain size={20} />
            </span>
            GoldVenture
          </h1>
          <p className="text-xs text-slate-400 mt-1">Sistem Manajemen Data</p>
        </div>

        <nav className="flex-1 p-4 space-y-6">

          {/* DATA MASTER */}
          <div>
            <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Data Master</p>
            <div className="space-y-1">
              <MenuButton icon={<Tags size={18} />} label="Kategori Alat" isActive={activeTab === 'kategori'} onClick={() => setActiveTab('kategori')} />
              <MenuButton icon={<Package size={18} />} label="Data Alat (Equipment)" isActive={activeTab === 'alat'} onClick={() => setActiveTab('alat')} />
              <MenuButton icon={<Users size={18} />} label="Data Customer" isActive={activeTab === 'customer'} onClick={() => setActiveTab('customer')} />
              <MenuButton icon={<Contact size={18} />} label="Data Staff" isActive={activeTab === 'staff'} onClick={() => setActiveTab('staff')} />
              <MenuButton icon={<Truck size={18} />} label="Data Supplier" isActive={activeTab === 'supplier'} onClick={() => setActiveTab('supplier')} />
            </div>
          </div>

          {/* TRANSAKSI */}
          <div>
            <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Transaksi</p>
            <div className="space-y-1">
              <MenuButton icon={<ShoppingCart size={18} />} label="Penyewaan (Rental)" isActive={activeTab === 'rental'} onClick={() => setActiveTab('rental')} />
              <MenuButton icon={<CreditCard size={18} />} label="Pembayaran" isActive={activeTab === 'payment'} onClick={() => setActiveTab('payment')} />
              <MenuButton icon={<RotateCcw size={18} />} label="Pengembalian & Denda" isActive={activeTab === 'returns'} onClick={() => setActiveTab('returns')} />
            </div>
          </div>
        </nav>

        {/* --- TOMBOL LOGOUT --- */}
        <div className="p-4 border-t border-slate-800 sticky bottom-0 bg-slate-900">
          <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors text-sm font-medium">
            <LogOut size={18} /> Keluar 
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <header className="mb-8 border-b border-slate-200 pb-4">
            <h2 className="text-2xl font-bold text-slate-800 capitalize">
              {activeTab.replace('-', ' ')}
            </h2>
            <p className="text-slate-500 text-sm mt-1">Kelola data {activeTab} untuk sistem rental.</p>
          </header>

          {/* Render Komponen yang Sedang Aktif */}
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {renderContent()}
          </div>
        </div>
      </main>

      <Chatbot />
    </div>
  );
}

// Komponen Helper untuk Tombol Menu (Sidebar Gelap)
function MenuButton({ icon, label, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:bg-purple-800 hover:text-white'
        }`}
    >
      {icon} {label}
    </button>
  );
}

export default App;