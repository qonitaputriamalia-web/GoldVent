import { useState } from 'react';
import { Lock, BarChart3, Database } from 'lucide-react';

// UBAH BARIS INI: Tambahin props onSwitchToSignUp
export default function Login({ onLoginSuccess, onSwitchToSignUp }) {
    const [loginType, setLoginType] = useState('admin_crud');

    const [loginForm, setLoginForm] = useState({ email: '', password: '' });
    const [loginError, setLoginError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e) => {
        // ... (KODE HANDLE LOGIN LU TETEP SAMA KAYA SEBELUMNYA) ...
        e.preventDefault();
        setLoginError('');
        setIsLoading(true);

        try {
            const res = await fetch('http://localhost:8787/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: loginForm.email, password: loginForm.password })
            });
            const data = await res.json();

            if (data.success) {
                onLoginSuccess(loginType);
            } else {
                setLoginError(data.message);
            }
        } catch (err) {
            setLoginError('Gagal nyambung ke server backend!', err);
        } finally {
            setIsLoading(false);
        }
    };

    const isAnalyst = loginType === 'analyst';
    const themeColor = isAnalyst ? 'blue' : 'emerald';
    const IconHeader = isAnalyst ? BarChart3 : Database;

    return (
        <div className={`flex h-screen items-center justify-center font-sans transition-colors duration-500 ${isAnalyst ? 'bg-slate-900' : 'bg-slate-50'}`}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300 border border-slate-200">

                {/* ... (KODE TABS PORTAL KIRI-KANAN TETEP SAMA) ... */}
                <div className="flex w-full bg-slate-100 border-b border-slate-200">
                    <button
                        type="button"
                        onClick={() => { setLoginType('admin_crud'); setLoginError(''); }}
                        className={`flex-1 py-4 text-sm font-bold flex justify-center items-center gap-2 transition-all ${!isAnalyst ? 'bg-white text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        <Database size={18} /> Admin Operasional
                    </button>
                    <button
                        type="button"
                        onClick={() => { setLoginType('analyst'); setLoginError(''); }}
                        className={`flex-1 py-4 text-sm font-bold flex justify-center items-center gap-2 transition-all ${isAnalyst ? 'bg-slate-900 text-blue-400 border-b-2 border-blue-500' : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        <BarChart3 size={18} /> Data Analyst
                    </button>
                </div>

                <div className="p-8">
                    {/* ... (KODE HEADER DAN FORM INPUT TETEP SAMA) ... */}
                    <div className="flex flex-col items-center mb-8">
                        <div className={`bg-${themeColor}-100 p-4 rounded-full mb-4 text-${themeColor}-600 shadow-inner transition-colors`}>
                            <IconHeader size={32} />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-800">
                            {isAnalyst ? 'Portal Data Analyst' : 'GoldVenture'}
                        </h1>
                        <p className="text-slate-500 text-sm text-center mt-1">
                            {isAnalyst ? 'Akses dashboard statistik dan grafik' : 'Kelola data master dan transaksi'}
                        </p>
                    </div>

                    {loginError && (
                        <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm mb-4 text-center font-medium animate-in slide-in-from-top-2">
                            {loginError}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                            <input
                                type="email" required
                                className={`w-full border border-slate-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-${themeColor}-500 transition-shadow`}
                                placeholder="Masukkan email..."
                                value={loginForm.email}
                                onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                            <input
                                type="password" required
                                className={`w-full border border-slate-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-${themeColor}-500 transition-shadow`}
                                placeholder="••••••••"
                                value={loginForm.password}
                                onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                            />
                        </div>
                        <button
                            disabled={isLoading}
                            type="submit"
                            className={`w-full text-white font-bold py-3 rounded-xl transition-all shadow-lg active:scale-95 flex justify-center items-center gap-2
                ${isAnalyst ? 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 shadow-blue-600/30' : 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 shadow-emerald-600/30'}
              `}
                        >
                            <Lock size={18} />
                            {isLoading ? 'Mengecek Akses...' : `Masuk sebagai ${isAnalyst ? 'Analyst' : 'Admin'}`}
                        </button>
                    </form>

                    {/* UBAH BARIS INI: Tambahin tombol saklar buat Sign Up di bawah form */}
                    <div className="mt-6 text-center text-sm text-slate-500">
                        Belum punya akses? {' '}
                        <button
                            type="button"
                            onClick={onSwitchToSignUp}
                            className={`hover:underline font-bold ${isAnalyst ? 'text-blue-600' : 'text-emerald-600'}`}
                        >
                            Daftar Admin Baru
                        </button>
                    </div>

                </div>

            </div>
        </div>
    );
}