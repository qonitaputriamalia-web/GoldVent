import { useState, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { TrendingUp, Users, Package, Wallet, Loader2 } from 'lucide-react';

const COLORS = ['#10b981', '#3b82f6', '#ef4444']; // Hijau, Biru, Merah

const formatRupiah = (number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);
};

export default function DashboardStats() {
  // State buat nyimpen data dari backend
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Minta data ke backend pas halaman pertama dibuka
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await fetch('http://127.0.0.1:8787/api/dashboard');
        const json = await res.json();
        
        if (json.success) {
          setStats(json.data);
        }
      } catch (error) {
        console.error("Gagal ambil data dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Kalau lagi loading, tampilin animasi muter
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-blue-600">
        <Loader2 size={48} className="animate-spin mb-4" />
        <p className="text-slate-500 font-medium animate-pulse">Menarik data dari database...</p>
      </div>
    );
  }

  // Kalau datanya gagal ditarik (misal backend mati)
  if (!stats) {
    return <div className="text-red-500 text-center mt-10">Gagal memuat data dashboard. Pastikan backend menyala.</div>;
  }

  return (
    <div className="space-y-6 font-sans">
      
      {/* 1. KARTU RINGKASAN */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard 
          title="Total Pendapatan" 
          value={formatRupiah(stats.summary.totalPendapatan)} 
          trend="Total Uang Masuk" 
          icon={<Wallet size={24} className="text-emerald-600" />} 
          bgIcon="bg-emerald-100" 
        />
        <SummaryCard 
          title="Penyewaan Aktif" 
          value={`${stats.summary.activeRentals} Transaksi`} 
          trend="Sedang Berlangsung" 
          icon={<TrendingUp size={24} className="text-blue-600" />} 
          bgIcon="bg-blue-100" 
        />
        <SummaryCard 
          title="Total Pelanggan" 
          value={`${stats.summary.totalCustomer} Orang`} 
          trend="Terdaftar" 
          icon={<Users size={24} className="text-purple-600" />} 
          bgIcon="bg-purple-100" 
        />
        <SummaryCard 
          title="Total Alat" 
          value={`${stats.summary.totalAlat} Unit`} 
          trend="Tersedia" 
          icon={<Package size={24} className="text-amber-600" />} 
          bgIcon="bg-amber-100" 
        />
      </div>

      {/* 2. GRAFIK UTAMA (TREN PENDAPATAN) */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-6">Tren Pendapatan Tahun Ini (Sewa vs Denda)</h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.trendPendapatan} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="bulan" stroke="#64748b" tick={{fontSize: 12}} />
              {/* Sumbu Y disederhanakan formatnya biar ga nabrak */}
              <YAxis tickFormatter={(val) => `Rp${val/1000}k`} stroke="#64748b" tick={{fontSize: 12}} />
              <Tooltip formatter={(value) => formatRupiah(value)} />
              <Legend wrapperStyle={{ paddingTop: '20px' }}/>
              <Line type="monotone" dataKey="sewa" name="Pendapatan Sewa" stroke="#3b82f6" strokeWidth={3} activeDot={{ r: 8 }} />
              <Line type="monotone" dataKey="denda" name="Pendapatan Denda" stroke="#ef4444" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. GRAFIK KEDUA (BAR CHART & PIE CHART) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* BAR CHART */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Kategori Alat Paling Sering Disewa</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.kategoriFavorit} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" tick={{fontSize: 12}} />
                <YAxis stroke="#64748b" tick={{fontSize: 12}} allowDecimals={false} />
                <Tooltip cursor={{fill: '#f1f5f9'}} />
                <Bar dataKey="total_sewa" name="Total Unit Disewa" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PIE CHART */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Status Transaksi Keseluruhan</h3>
          <div className="h-64 w-full flex items-center justify-center">
            {/* Cek kalau transaksinya kosong melompong */}
            {stats.summary.totalPendapatan === 0 && stats.summary.activeRentals === 0 ? (
                <p className="text-slate-400 italic">Belum ada transaksi rental</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.statusSewa}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => value > 0 ? `${name} (${value})` : ''}
                  >
                    {stats.statusSewa.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

function SummaryCard({ title, value, trend, icon, bgIcon }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between hover:shadow-md transition-shadow">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <h4 className="text-2xl font-bold text-slate-800 truncate max-w-[150px]">{value}</h4>
        <p className="text-xs font-semibold mt-2 text-slate-400">
          {trend}
        </p>
      </div>
      <div className={`${bgIcon} p-4 rounded-full shrink-0`}>
        {icon}
      </div>
    </div>
  );
}