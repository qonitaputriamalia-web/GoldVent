import { useState } from 'react';
import { UserPlus } from 'lucide-react'; // Pakai icon UserPlus biar beda sama Login

export default function SignUp({ onSwitchToLogin }) {
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '' });
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setStatusMsg({ type: '', text: '' });

    // Validasi dasar: Pastikan password sama
    if (form.password !== form.confirmPassword) {
      setStatusMsg({ type: 'error', text: 'Password konfirmasi nggak sama bos!' });
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('http://localhost:8787/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password })
      });
      const data = await res.json();

      if (data.success) {
        setStatusMsg({ type: 'success', text: 'Mantap! Akun berhasil dibuat.' });
        // Kosongin form kalau sukses
        setForm({ email: '', password: '', confirmPassword: '' });
      } else {
        setStatusMsg({ type: 'error', text: data.message });
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Gagal nyambung ke server backend!',err });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-slate-900 font-sans">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-300">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-emerald-100 p-4 rounded-full mb-4 text-emerald-600">
            <UserPlus size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Daftar Akun Baru</h1>
          <p className="text-slate-500 text-sm">Bikin akses baru untuk RentalApp</p>
        </div>

        {/* Kotak Pesan Error / Success */}
        {statusMsg.text && (
          <div className={`p-3 rounded-lg text-sm mb-4 text-center font-medium ${statusMsg.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700'}`}>
            {statusMsg.text}
          </div>
        )}

        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input 
              type="email" required
              className="w-full border border-slate-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500" 
              placeholder="staf@rental.com"
              value={form.email} 
              onChange={e => setForm({...form, email: e.target.value})} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input 
              type="password" required
              className="w-full border border-slate-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500" 
              placeholder="••••••••"
              value={form.password} 
              onChange={e => setForm({...form, password: e.target.value})} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Konfirmasi Password</label>
            <input 
              type="password" required
              className="w-full border border-slate-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500" 
              placeholder="••••••••"
              value={form.confirmPassword} 
              onChange={e => setForm({...form, confirmPassword: e.target.value})} 
            />
          </div>
          
          <button disabled={isLoading} type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold py-3 rounded-xl transition-all shadow-lg active:scale-95 mt-2">
            {isLoading ? 'Mendaftarkan...' : 'Buat Akun'}
          </button>
        </form>

        {/* Tombol Balik ke Login */}
        <div className="mt-6 text-center text-sm text-slate-500">
          Udah punya akun? {' '}
          <button onClick={onSwitchToLogin} className="text-blue-600 hover:underline font-bold">
            Login di sini
          </button>
        </div>
      </div>
    </div>
  );
}