import{ useState, useEffect } from 'react';

export default function RentalForm({ onRentalAdded }) {
  const [masterData, setMasterData] = useState({ customers: [], equipments: [], staffs: [] });
  const [formData, setFormData] = useState({
    customer_id: '',
    staff_id: '',
    equipment_id: '',
    qty: 1
  });
  const [loading, setLoading] = useState(false);

  // Ambil data untuk dropdown saat komponen dimuat
  useEffect(() => {
    fetch('http://localhost:8787/api/master-data')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMasterData({
            customers: data.customers || [],
            equipments: data.equipments || [],
            staffs: data.staffs || []
          });
          // Set default staff ke admin pertama yang ada
          if (data.staffs?.length > 0) {
            setFormData(prev => ({ ...prev, staff_id: data.staffs[0].staff_id }));
          }
        }
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('http://localhost:8787/api/rentals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const result = await res.json();
      
      if (result.success) {
        alert('Rental berhasil ditambahkan!');
        onRentalAdded(); // Refresh tabel tracking
      } else {
        alert('Gagal: ' + result.error);
      }
    } catch (err) {
      console.error('Terjadi kesalahan koneksi', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Buat Transaksi Baru</h3>
      
      <form onSubmit={handleSubmit} className="flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-slate-600 mb-1">Pilih Customer</label>
          <select 
            required
            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={formData.customer_id}
            onChange={(e) => setFormData({...formData, customer_id: e.target.value})}
          >
            <option value="">-- Pilih --</option>
            {masterData.customers.map(c => (
              <option key={c.customer_id} value={c.customer_id}>{c.nama}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-slate-600 mb-1">Pilih Alat</label>
          <select 
            required
            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={formData.equipment_id}
            onChange={(e) => setFormData({...formData, equipment_id: e.target.value})}
          >
            <option value="">-- Pilih --</option>
            {masterData.equipments.map(e => (
              <option key={e.equipment_id} value={e.equipment_id}>{e.nama_alat} (Rp{e.harga_sewa})</option>
            ))}
          </select>
        </div>

        <div className="w-24">
          <label className="block text-sm font-medium text-slate-600 mb-1">Qty</label>
          <input 
            type="number" 
            min="1" 
            required
            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={formData.qty}
            onChange={(e) => setFormData({...formData, qty: parseInt(e.target.value)})}
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-500 text-white font-medium py-2 px-6 rounded-lg transition-colors h-[42px]"
        >
          {loading ? 'Menyimpan...' : 'Simpan Transaksi'}
        </button>
      </form>
    </div>
  );
}