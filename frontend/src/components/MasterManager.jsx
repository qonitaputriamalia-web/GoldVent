import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, Loader2 } from 'lucide-react';

export default function MasterManager({ tableName, columns, title }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({});

  const pkName = tableName === 'category' ? 'category_id' : 
                 tableName === 'customer' ? 'customer_id' : 
                 tableName === 'equipment' ? 'equipment_id' : 'id';

  // eslint-disable-next-line react-hooks/exhaustive-deps, no-undef
  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`http://127.0.0.1:8787/api/crud/${tableName}`);
    const json = await res.json();
    if (json.success) setData(json.data);
    setLoading(false);
  });

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchData(); }, [fetchData, tableName]);

  const handleSave = async (e) => {
    e.preventDefault();
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId 
      ? `http://127.0.0.1:8787/api/crud/${tableName}/${editingId}`
      : `http://127.0.0.1:8787/api/crud/${tableName}`;

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      setEditingId(null);
      setFormData({});
      fetchData();
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Yakin hapus data ini bos?")) return;
    await fetch(`http://127.0.0.1:8787/api/crud/${tableName}/${id}`, { method: 'DELETE' });
    fetchData();
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h3 className="font-bold text-slate-800 text-lg">{title}</h3>
        {!editingId && (
          <button onClick={() => {setEditingId('new'); setFormData({});}} className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold hover:bg-blue-700 transition-all">
            <Plus size={18} /> Tambah Baru
          </button>
        )}
      </div>

      {/* FORM INPUT (Dinamis sesuai kolom) */}
      {(editingId) && (
        <form onSubmit={handleSave} className="p-6 bg-blue-50/50 border-b border-blue-100 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4">
          {columns.map(col => (
            <div key={col.key}>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{col.label}</label>
              <input 
                className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                required
                value={formData[col.key] || ''}
                onChange={e => setFormData({...formData, [col.key]: e.target.value})}
                placeholder={`Input ${col.label}...`}
              />
            </div>
          ))}
          <div className="md:col-span-2 flex gap-2 justify-end mt-2">
            <button type="button" onClick={() => setEditingId(null)} className="px-4 py-2 text-slate-600 font-bold text-sm">Batal</button>
            <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg shadow-blue-200">
              <Save size={18} /> Simpan Data
            </button>
          </div>
        </form>
      )}

      {/* TABEL DATA */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-600 text-xs font-bold uppercase">
              {columns.map(col => <th key={col.key} className="px-6 py-4">{col.label}</th>)}
              <th className="px-6 py-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map(item => (
              <tr key={item[pkName]} className="hover:bg-slate-50/80 transition-colors">
                {columns.map(col => (
                  <td key={col.key} className="px-6 py-4 text-sm text-slate-700 font-medium">{item[col.key]}</td>
                ))}
                <td className="px-6 py-4 flex justify-center gap-3">
                  <button onClick={() => {setEditingId(item[pkName]); setFormData(item);}} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit size={18}/></button>
                  <button onClick={() => handleDelete(item[pkName])} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}