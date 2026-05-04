import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

// Tambahkan prop refreshKey
export default function DashboardStats({ refreshKey }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:8787/api/stats')
      .then(res => res.json())
      .then(result => {
        if (result.success) setData(result.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching stats:', err);
        setLoading(false);
      });
  }, [refreshKey]); // <-- Chart akan render ulang tiap refreshKey berubah

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm w-full h-80 mb-6 relative">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Tren Pendapatan (Sewa + Denda + Ganti Rugi)</h3>
      
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50">
          <p className="text-slate-500 font-medium">Menghitung Data...</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `Rp${value / 1000}k`} />
            <Tooltip cursor={{fill: '#f1f5f9'}} formatter={(value) => `Rp ${value.toLocaleString('id-ID')}`} />
            <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}