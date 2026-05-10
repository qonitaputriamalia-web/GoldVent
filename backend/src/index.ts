import 'dotenv/config'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createClient } from '@supabase/supabase-js'

const app = new Hono()

// Middleware
app.use('/*', cors())

// Supabase Init
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_KEY. Ensure .env is present and values are set.')
}

const supabase = createClient(supabaseUrl, supabaseKey)

app.get('/', (c) => c.text('Rental API is Running!'))

// Endpoint 1: Tracking Rental
app.get('/api/rentals/tracking', async (c) => {
  const { data, error } = await supabase
    .from('rental')
    .select(`
      rental_id,
      tanggal_sewa,
      status,
      customer:customer_id (nama, no_hp),
      staff:staff_id (nama),
      rental_detail (
        qty,
        equipment:equipment_id (nama_alat)
      )
    `)
    .order('tanggal_sewa', { ascending: false })

  if (error) return c.json({ success: false, error: error.message }, 500)
  return c.json({ success: true, data })
})

// Endpoint 2: Data Statistik Asli untuk Chart (Real-time)
app.get('/api/stats', async (c) => {
  try {
    const { data: rentals, error } = await supabase
      .from('rental')
      .select(`
        tanggal_sewa,
        rental_detail ( qty, equipment ( harga_sewa ) ),
        returns ( denda, damage_report ( biaya ) )
      `)

    if (error) throw error

    const namaBulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
    const chartData: { bulanIndex: number; tahun: number; name: string; revenue: number }[] = [];

    for (let i = 4; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      chartData.push({
        bulanIndex: d.getMonth(),
        tahun: d.getFullYear(),
        name: namaBulan[d.getMonth()],
        revenue: 0
      });
    }

    rentals.forEach((rental: any) => {
      const tglSewa = new Date(rental.tanggal_sewa);
      const targetBulan = chartData.find(c => c.bulanIndex === tglSewa.getMonth() && c.tahun === tglSewa.getFullYear());

      if (targetBulan) {
        let total = 0;
        if (rental.rental_detail) {
          rental.rental_detail.forEach((detail: any) => {
            const harga = detail.equipment?.harga_sewa || 0;
            total += detail.qty * harga;
          });
        }
        const returnItem = Array.isArray(rental.returns) ? rental.returns[0] : rental.returns;
        if (returnItem) {
          total += Number(returnItem.denda) || 0;
          const damageItem = Array.isArray(returnItem.damage_report) ? returnItem.damage_report[0] : returnItem.damage_report;
          if (damageItem) {
            total += Number(damageItem.biaya) || 0;
          }
        }
        targetBulan.revenue += total;
      }
    });

    return c.json({ success: true, data: chartData })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

/// Endpoint 3: Ambil Master Data untuk Dropdown & Tabel
app.get('/api/master-data', async (c) => {
  const [customers, equipments, staffs] = await Promise.all([
    supabase.from('customer').select('customer_id, nama, email, no_hp'),
    supabase.from('equipment').select('equipment_id, nama_alat, harga_sewa'),
    supabase.from('staff').select('staff_id, nama')
  ])

  return c.json({
    success: true,
    customers: customers.data,
    equipments: equipments.data,
    staffs: staffs.data
  })
})

// Endpoint 4: POST Transaksi Rental Baru
app.post('/api/rentals', async (c) => {
  try {
    const body = await c.req.json()
    const { data: rentalData, error: rentalError } = await supabase
      .from('rental')
      .insert([{ customer_id: body.customer_id, staff_id: body.staff_id, status: 'dipinjam' }])
      .select('rental_id').single()

    if (rentalError) throw rentalError

    const { error: detailError } = await supabase
      .from('rental_detail')
      .insert([{ rental_id: rentalData.rental_id, equipment_id: body.equipment_id, qty: body.qty }])

    if (detailError) throw detailError

    return c.json({ success: true, message: 'Transaksi berhasil!' })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Endpoint 5: Proses Pengembalian (UPSERT & Damage Report)
app.post('/api/rentals/:id/return', async (c) => {
  const rentalId = parseInt(c.req.param('id'))
  try {
    const body = await c.req.json()

    const { error: updateError } = await supabase
      .from('rental')
      .update({ status: 'kembali' }).eq('rental_id', rentalId)
    if (updateError) throw updateError

    const { data: returnData, error: returnError } = await supabase
      .from('returns')
      .upsert({
        rental_id: rentalId,
        kondisi: body.kondisi,
        denda: body.denda || 0,
        tanggal_kembali: new Date().toISOString().split('T')[0]
      }, { onConflict: 'rental_id' }).select('returns_id').single()

    if (returnError) throw returnError

    if (body.kondisi === 'rusak' && body.isDamaged) {
      await supabase.from('damage_report').delete().eq('returns_id', returnData.returns_id)
      const { error: damageError } = await supabase
        .from('damage_report')
        .insert([{ returns_id: returnData.returns_id, keterangan: body.keterangan, severity: body.severity, biaya: body.biayaKerusakan || 0 }])
      if (damageError) throw damageError
    } else {
      await supabase.from('damage_report').delete().eq('returns_id', returnData.returns_id)
    }

    return c.json({ success: true, message: 'Pengembalian sukses!' })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ==========================================
// ENDPOINT MASTER DATA CUSTOMER (CRUD)
// ==========================================

// Tambah Customer Baru
app.post('/api/customers', async (c) => {
  try {
    const body = await c.req.json()
    const { error } = await supabase.from('customer').insert([body])
    if (error) throw error
    return c.json({ success: true, message: 'Customer ditambahkan!' })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Hapus Customer
app.delete('/api/customers/:id', async (c) => {
  const id = c.req.param('id')
  const { error } = await supabase.from('customer').delete().eq('customer_id', id)
  if (error) return c.json({ success: false, error: error.message }, 500)
  return c.json({ success: true, message: 'Customer dihapus!' })
})

// ==========================================
// ENDPOINT MASTER DATA ALAT (CRUD)
// ==========================================

// Tambah Alat Baru
app.post('/api/equipments', async (c) => {
  try {
    const body = await c.req.json()
    const { error } = await supabase.from('equipment').insert([body])
    if (error) throw error
    return c.json({ success: true, message: 'Alat ditambahkan!' })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Hapus Alat
app.delete('/api/equipments/:id', async (c) => {
  const id = c.req.param('id')
  const { error } = await supabase.from('equipment').delete().eq('equipment_id', id)
  if (error) return c.json({ success: false, error: error.message }, 500)
  return c.json({ success: true, message: 'Alat dihapus!' })
})

// ==========================================
// ENDPOINT AI CHATBOT (MEMORY + CATEGORY FIX)
// ==========================================
app.post('/api/chat', async (c) => {
  try {
    // Tangkap pesan baru dan INGATAN (history) dari frontend
    const { message, history } = await c.req.json();
    
    // 1. Tarik Data Konteks dari Database
    const [customers, equipments, categories] = await Promise.all([
      supabase.from('customer').select('nama, no_hp'),
      supabase.from('equipment').select('nama_alat, harga_sewa'),
      supabase.from('category').select('*')
    ]);

    // 2. Prompt Agentic (Aturan Main AI)
    const systemPrompt = `
      Lu adalah asisten admin RentalApp. Lu bisa baca dan MENAMBAHKAN data.
      Gunakan bahasa Indonesia santai (lu/gua/bos).
      
      DATA SAAT INI:
      - CUSTOMER: ${JSON.stringify(customers.data)}
      - ALAT: ${JSON.stringify(equipments.data)}
      - KATEGORI ALAT YANG TERSEDIA: ${JSON.stringify(categories.data)}

      ATURAN PENTING TAMBAH ALAT:
      1. Jika user minta tambah ALAT, lu WAJIB mengecek: nama_alat, harga_sewa, dan category_id.
      2. PENTING: Lu WAJIB sebutkan daftar KATEGORI ALAT yang tersedia ke user, lalu minta user memilih alat ini mau dimasukin ke kategori yang mana!
      3. Jangan eksekusi JSON kalau user belum milih kategorinya.

      ATURAN EKSEKUSI (JIKA DATA LENGKAP):
      Hanya jika SEMUA data sudah lengkap, lu WAJIB membalas HANYA dengan JSON murni (tanpa teks lain):
      - Untuk Alat: {"action": "add_equipment", "nama_alat": "...", "harga_sewa": 0, "category_id": 1}
      - Untuk Customer: {"action": "add_customer", "nama": "...", "email": "...", "no_hp": "..."}
    `;

    // 3. Siapin Otak AI (WAJIB PAKAI gemini-1.5-flash)
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash", 
      systemInstruction: systemPrompt 
    });

    // 4. Terjemahkan history dari React ke format ingatan Gemini
    // (Cukup dikerjakan 1 kali saja di sini)
    const geminiHistory = (history || []).map((msg: any) => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    // 5. Mulai obrolan dengan menyuapkan ingatan (history) ke otaknya
    const chat = model.startChat({ history: geminiHistory });
    const result = await chat.sendMessage(message);
    let reply = result.response.text();

    // 6. Eksekusi jika AI ngeluarin format JSON (Secret Code)
    try {
      const match = reply.match(/\{[\s\S]*\}/);
      if (match) {
        const aiCommand = JSON.parse(match[0]);
        
        if (aiCommand.action === 'add_customer') {
          const { error } = await supabase.from('customer').insert([{
            nama: aiCommand.nama, email: aiCommand.email, no_hp: aiCommand.no_hp
          }]);
          reply = error ? `Gagal masukin customer: ${error.message}` : `Siapp bos! Customer **${aiCommand.nama}** udah sukses didaftarin! 🚀`;
        } 
        else if (aiCommand.action === 'add_equipment') {
          const { error } = await supabase.from('equipment').insert([{
            nama_alat: aiCommand.nama_alat, 
            harga_sewa: aiCommand.harga_sewa,
            category_id: aiCommand.category_id 
          }]);
          reply = error ? `Waduh gagal nambahin alat nih: ${error.message}` : `Beres bos! Alat **${aiCommand.nama_alat}** udah ready di etalase! 📸`;
        }
      }
    } catch (parseError) {
      // Abaikan kalau gagal parse JSON, berarti AI cuma ngajak ngobrol
    }

    return c.json({ success: true, reply });
  } catch (error: any) {
    console.error("AI Error:", error);
    return c.json({ success: false, reply: "Koneksi ke AI lagi putus nih bos." }, 500);
  }
});

// ==========================================
// ENDPOINT LOGIN ADMIN
// ==========================================
app.post('/api/login', async (c) => {
  try {
    const { email, password } = await c.req.json();

    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .single(); 

    if (error || !data) {
      return c.json({ success: false, message: 'Email atau Password salah bos!' }, 401);
    }

    return c.json({ success: true, message: 'Login sukses!' });
  } catch (error: any) {
    return c.json({ success: false, message: 'Server lagi error nih.' }, 500);
  }
});

// ==========================================
// ENDPOINT: SIGN UP (DAFTAR ADMIN BARU)
// ==========================================
app.post('/api/signup', async (c) => {
  try {
    const { email, password } = await c.req.json();

    // Insert data ke tabel admin_users
    const { data, error } = await supabase
      .from('admin_users')
      .insert([{ email, password }]);

    if (error) {
      // Error code 23505 artinya melanggar constraint UNIQUE (email udah dipakai)
      if (error.code === '23505') {
        return c.json({ success: false, message: 'Waduh, Email ini udah terdaftar bos!' }, 400);
      }
      throw error;
    }

    return c.json({ success: true, message: 'Akun berhasil dibuat! Silakan login.' });
  } catch (error: any) {
    return c.json({ success: false, message: 'Gagal bikin akun: ' + error.message }, 500);
  }
});

// ==========================================
// ENDPOINT DASHBOARD STATISTIK (REAL DATA)
// ==========================================
app.get('/api/dashboard', async (c) => {
  try {
    // 1. Tarik Jumlah Customer & Alat (Hitung Totalnya aja)
    const { count: totalCustomer } = await supabase.from('customer').select('*', { count: 'exact', head: true });
    const { count: totalAlat } = await supabase.from('equipment').select('*', { count: 'exact', head: true });

    // 2. Tarik Data Transaksi (Buat Pie Chart Status & Penyewaan Aktif)
    const { data: rentals } = await supabase.from('rental').select('status');
    let activeRentals = 0;
    let statusCount = { 'Selesai': 0, 'Dipinjam': 0, 'Dibatalkan': 0 };
    
    rentals?.forEach(r => {
      if (r.status === 'dipinjam') { activeRentals++; statusCount['Dipinjam']++; }
      else if (r.status === 'selesai') statusCount['Selesai']++;
      else if (r.status === 'dibatalkan') statusCount['Dibatalkan']++;
    });

    // 3. Hitung Pendapatan Sewa & Denda (Buat Line Chart Bulanan)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
    let trendPendapatan = monthNames.map(m => ({ bulan: m, sewa: 0, denda: 0 }));
    let totalPendapatan = 0;

    // Ambil uang sewa
    const { data: payments } = await supabase.from('payment').select('jumlah, created_at, status');
    payments?.forEach(p => {
      if (p.status === 'lunas') {
        totalPendapatan += Number(p.jumlah);
        const monthIdx = new Date(p.created_at).getMonth();
        trendPendapatan[monthIdx].sewa += Number(p.jumlah);
      }
    });

    // Ambil uang denda
    const { data: returns } = await supabase.from('returns').select('denda, tanggal_kembali');
    returns?.forEach(r => {
      if (r.denda && Number(r.denda) > 0) {
        // Karena ada denda, masukin ke total pendapatan juga
        totalPendapatan += Number(r.denda); 
        const monthIdx = new Date(r.tanggal_kembali).getMonth();
        trendPendapatan[monthIdx].denda += Number(r.denda);
      }
    });

    // 4. Hitung Alat Paling Sering Disewa (Buat Bar Chart)
    const { data: rentalDetails } = await supabase.from('rental_detail').select(`
      qty,
      equipment ( category ( nama_kategori ) )
    `);

    const categoryCount: Record<string, number> = {};
    rentalDetails?.forEach(rd => {
      // Supabase join response bisa berbentuk array atau object, kita amankan:
      const eq = Array.isArray(rd.equipment) ? rd.equipment[0] : rd.equipment;
      const cat = Array.isArray(eq?.category) ? eq?.category[0] : eq?.category;
      const catName = cat?.nama_kategori || 'Lainnya';
      
      categoryCount[catName] = (categoryCount[catName] || 0) + rd.qty;
    });
    
    let kategoriFavorit = Object.keys(categoryCount).map(k => ({ name: k, total_sewa: categoryCount[k] }));
    // Kalau database masih kosong melompong, kasih data pancingan biar chart ga error
    if (kategoriFavorit.length === 0) kategoriFavorit = [{ name: 'Belum ada data', total_sewa: 0 }];

    // Kirim semua hasil masakan ke Frontend
    return c.json({
      success: true,
      data: {
        summary: {
          totalPendapatan,
          activeRentals,
          totalCustomer: totalCustomer || 0,
          totalAlat: totalAlat || 0
        },
        trendPendapatan,
        kategoriFavorit,
        statusSewa: [
          { name: 'Selesai', value: statusCount['Selesai'] },
          { name: 'Dipinjam', value: statusCount['Dipinjam'] },
          { name: 'Dibatalkan', value: statusCount['Dibatalkan'] }
        ]
      }
    });

  } catch (error: any) {
    console.error("Dashboard Error:", error);
    return c.json({ success: false, message: "Gagal narik data dashboard" }, 500);
  }
});

const port = process.env.PORT ? parseInt(process.env.PORT) : 8787
console.log(`Server running at http://localhost:${port}`)

serve({ fetch: app.fetch, port })