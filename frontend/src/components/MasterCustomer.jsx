import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';

export default function MasterCustomer() {
  const [customers, setCustomers] = useState([]);
  const [formCustomer, setFormCustomer] = useState({ nama: '', email: '', no_hp: '' });

  const fetchCustomers = () => {
    fetch('http://localhost:8787/api/master-data')
      .then(res => res.json())
      .then(data => setCustomers(data.customers || []));
  };

  useEffect(() => { fetchCustomers(); }, []);

  const handleSubmitCustomer = async (e) => {
    e.preventDefault();
    await fetch('http://localhost:8787/api/customers', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formCustomer)
    });
    setFormCustomer({ nama: '', email: '', no_hp: '' });
    fetchCustomers();
  };

  const handleDeleteCustomer = async (id) => {
    if(window.confirm('Yakin hapus customer ini?')) {
      await fetch(`http://localhost:8787/api/customers/${id}`, { method: 'DELETE' });
      fetchCustomers();
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Master Data Customer</h3>
      
      <form onSubmit={handleSubmitCustomer} className="flex gap-3 mb-6">
        <input required placeholder="Nama" className="border p-2 rounded-lg flex-1 outline-none focus:border-blue-500" value={formCustomer.nama} onChange={e => setFormCustomer({...formCustomer, nama: e.target.value})} />
        <input required placeholder="Email" type="email" className="border p-2 rounded-lg flex-1 outline-none focus:border-blue-500" value={formCustomer.email} onChange={e => setFormCustomer({...formCustomer, email: e.target.value})} />
        <input required placeholder="No HP" className="border p-2 rounded-lg flex-1 outline-none focus:border-blue-500" value={formCustomer.no_hp} onChange={e => setFormCustomer({...formCustomer, no_hp: e.target.value})} />
        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium transition-colors">Tambah</button>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b text-slate-500 text-sm"><th className="pb-3 font-medium">Nama</th><th className="pb-3 font-medium">Email</th><th className="pb-3 font-medium">No HP</th><th className="pb-3 font-medium text-right">Aksi</th></tr>
          </thead>
          <tbody>
            {customers.map(c => (
              <tr key={c.customer_id} className="border-b hover:bg-slate-50 transition-colors">
                <td className="py-3 text-slate-800">{c.nama}</td><td className="py-3 text-slate-600">{c.email}</td><td className="py-3 text-slate-600">{c.no_hp}</td>
                <td className="py-3 text-right"><button onClick={() => handleDeleteCustomer(c.customer_id)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={18}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}