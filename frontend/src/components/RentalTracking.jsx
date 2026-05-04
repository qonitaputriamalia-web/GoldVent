import { useEffect, useState } from 'react';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';

export default function RentalTracking() {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pisahkan fungsi fetch agar bisa dipanggil ulang setelah update status
  const fetchRentals = () => {
    fetch('http://localhost:8787/api/rentals/tracking')
      .then((res) => res.json())
      .then((result) => {
        if (result.success) setRentals(result.data);
        setLoading(false);
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchRentals();
  }, []);

  // Fungsi untuk memproses pengembalian alat
  const handleReturn = async (rentalId) => {
    const confirmReturn = window.confirm('Yakin ingin memproses pengembalian untuk transaksi ini?');
    if (!confirmReturn) return;

    try {
      const res = await fetch(`http://localhost:8787/api/rentals/${rentalId}/return`, {
        method: 'POST'
      });
      const result = await res.json();
      
      if (result.success) {
        alert('Barang berhasil dikembalikan!');
        fetchRentals(); // Refresh tabel setelah sukses
      } else {
        alert('Gagal: ' + result.error);
        console.error('Gagal memproses pengembalian', result.error);
      }
    } catch (err) {
      console.error('Terjadi kesalahan koneksi', err);
    }
  };

  const getStatusStyle = (status) => {
    if (status === 'dipinjam') return { color: 'text-yellow-700 bg-yellow-100', icon: <Clock size={16} /> };
    if (status === 'kembali') return { color: 'text-green-700 bg-green-100', icon: <CheckCircle size={16} /> };
    return { color: 'text-red-700 bg-red-100', icon: <AlertCircle size={16} /> };
  };

  if (loading) return <div className="animate-pulse text-center p-10 text-slate-500">Memuat data dari Supabase...</div>;

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Tracking Status Alat</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-sm text-slate-500">
              <th className="pb-3 font-medium">Customer</th>
              <th className="pb-3 font-medium">Item Disewa</th>
              <th className="pb-3 font-medium">Tgl Sewa</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rentals.map((r) => {
              const { color, icon } = getStatusStyle(r.status);
              const isDipinjam = r.status.toLowerCase() === 'dipinjam';

              return (
                <tr key={r.rental_id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="py-4">
                    <p className="font-semibold text-slate-800">{r.customer?.nama || 'Unknown'}</p>
                    <p className="text-xs text-slate-500">{r.customer?.no_hp}</p>
                  </td>
                  <td className="py-4">
                    <ul className="text-sm text-slate-600">
                      {r.rental_detail?.map((detail, idx) => (
                        <li key={idx}>- {detail.equipment?.nama_alat} (x{detail.qty})</li>
                      ))}
                    </ul>
                  </td>
                  <td className="py-4 text-sm text-slate-600">{r.tanggal_sewa}</td>
                  <td className="py-4">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${color}`}>
                      {icon} {r.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    {/* Tombol hanya muncul jika statusnya masih dipinjam */}
                    {isDipinjam ? (
                      <button 
                        onClick={() => handleReturn(r.rental_id)}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
                      >
                        Kembalikan
                      </button>
                    ) : (
                      <span className="text-sm text-slate-400 italic">Selesai</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}