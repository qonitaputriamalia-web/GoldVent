import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';

export default function MasterEquipment() {
  const [equipments, setEquipments] = useState([]);
  const [formAlat, setFormAlat] = useState({ nama_alat: '', harga_sewa: '' });

  const fetchEquipments = () => {
    fetch('http://localhost:8787/api/master-data')
      .then(res => res.json())
      .then(data => setEquipments(data.equipments || []));
  };

  useEffect(() => { fetchEquipments(); }, []);

  const handleSubmitAlat = async (e) => {
    e.preventDefault();
    await fetch('http://localhost:8787/api/equipments', {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ 
        nama_alat: formAlat.nama_alat, 
        harga_sewa: parseInt(formAlat.harga_sewa) || 0 
      })
    });
    setFormAlat({ nama_alat: '', harga_sewa: '' });
    fetchEquipments();
  };

  const handleDeleteAlat = async (id) => {
    if(window.confirm('Yakin hapus alat ini? Data riwayat sewa yang pakai alat ini bisa ikut terhapus lho!')) {
      await fetch(`http://localhost:8787/api/equipments/${id}`, { method: 'DELETE' });
      fetchEquipments();
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Master Data Alat (Equipment)</h3>
      
      <form onSubmit={handleSubmitAlat} className="flex gap-3 mb-6">
        <input required placeholder="Nama Alat (Misal: Sony A7III)" className="border p-2 rounded-lg flex-[2] outline-none focus:border-emerald-500" value={formAlat.nama_alat} onChange={e => setFormAlat({...formAlat, nama_alat: e.target.value})} />
        <input required type="number" min="0" placeholder="Harga Sewa / Hari (Rp)" className="border p-2 rounded-lg flex-1 outline-none focus:border-emerald-500" value={formAlat.harga_sewa} onChange={e => setFormAlat({...formAlat, harga_sewa: e.target.value})} />
        <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg font-medium transition-colors">Tambah</button>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b text-slate-500 text-sm"><th className="pb-3 font-medium">Nama Alat</th><th className="pb-3 font-medium">Harga Sewa / Hari</th><th className="pb-3 font-medium text-right">Aksi</th></tr>
          </thead>
          <tbody>
            {equipments.map(a => (
              <tr key={a.equipment_id} className="border-b hover:bg-slate-50 transition-colors">
                <td className="py-3 font-medium text-slate-800">{a.nama_alat}</td>
                <td className="py-3 text-slate-600">Rp {a.harga_sewa?.toLocaleString('id-ID')}</td>
                <td className="py-3 text-right"><button onClick={() => handleDeleteAlat(a.equipment_id)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={18}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}