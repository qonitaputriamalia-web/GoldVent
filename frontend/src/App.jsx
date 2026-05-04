import { useState } from 'react';
import DashboardStats from './components/DashboardStats';
import RentalTracking from './components/RentalTracking';
import RentalForm from './components/RentalForm';
import MasterCustomer from './components/MasterCustomer'; // Import yang baru
import MasterEquipment from './components/MasterEquipment'; // Import yang baru
import Chatbot from './components/Chatbot';
import { LayoutDashboard, Users, Package, FolderKanban } from 'lucide-react'; // Tambah icon Package

function App() {
  const [refreshKey, setRefreshKey] = useState(0);
  
  // State sekarang ada 3: 'dashboard', 'customer', 'alat'
  const [activeTab, setActiveTab] = useState('dashboard'); 

  const handleRentalAdded = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      
      {/* --- SIDEBAR MENU --- */}
      <aside className="w-64 bg-white border-r border-slate-200 shadow-sm flex flex-col z-10">
        <div className="p-6 border-b border-slate-100">
          <h1 className="text-xl font-bold text-purple-600 flex items-center gap-2">
            <FolderKanban size={24} /> GoldVent
          </h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {/* Menu Dashboard */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'dashboard' ? 'bg-purple-50 text-purple-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <LayoutDashboard size={20} /> Dashboard Utama
          </button>
          
          {/* Menu Customer */}
          <button
            onClick={() => setActiveTab('customer')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'customer' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Users size={20} /> Data Customer
          </button>

          {/* Menu Alat */}
          <button
            onClick={() => setActiveTab('alat')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'alat' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Package size={20} /> Data Alat
          </button>
        </nav>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          
          {/* Header Dinamis Berdasarkan Tab */}
          <header className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800">
              {activeTab === 'dashboard' && 'Dashboard Utama'}
              {activeTab === 'customer' && 'Manajemen Customer'}
              {activeTab === 'alat' && 'Manajemen Alat & Harga'}
            </h2>
            <p className="text-slate-500 text-sm">
              {activeTab === 'dashboard' && 'Ringkasan dan Tracking Penyewaan'}
              {activeTab === 'customer' && 'Kelola daftar pelanggan rental'}
              {activeTab === 'alat' && 'Kelola inventaris dan harga sewa alat'}
            </p>
          </header>

          {/* Render Komponen Sesuai Tab */}
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {activeTab === 'dashboard' && (
              <>
                <DashboardStats key={`chart-${refreshKey}`} refreshKey={refreshKey} />
                <RentalForm onRentalAdded={handleRentalAdded} />
                <RentalTracking key={`track-${refreshKey}`} />
              </>
            )}
            
            {activeTab === 'customer' && <MasterCustomer />}
            
            {activeTab === 'alat' && <MasterEquipment />}
          </div>

        </div>
      </main>

      {/* --- WIDGET CHATBOT --- */}
      <Chatbot />
      
    </div>
  );
}

export default App;