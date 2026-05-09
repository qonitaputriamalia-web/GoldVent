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
    // Sekarang kita terima message DAN history dari Frontend
    const { message, history } = await c.req.json();
    
    // 1. Tarik Data Konteks (Tambahin fetch ke tabel 'category'!)
    const [customers, equipments, categories] = await Promise.all([
      supabase.from('customer').select('nama, no_hp'),
      supabase.from('equipment').select('nama_alat, harga_sewa'),
      supabase.from('category').select('*') // Ambil data kategori buat disodorin ke user
    ]);

    // 2. Prompt Agentic (Ngajarin AI aturan baru)
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

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      systemInstruction: systemPrompt 
    });

    // 3. Terjemahkan history dari React ke format ingatan yang dipahami Gemini
    const geminiHistory = (history || []).map((msg: any) => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    // 4. Mulai obrolan dengan menyertakan ingatan (history)
    const chat = model.startChat({ history: geminiHistory });
    const result = await chat.sendMessage(message);
    let reply = result.response.text();

    // 5. Eksekusi jika AI ngeluarin Secret Code JSON
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
          // Sekarang kita masukin category_id sesuai pilihan user!
          const { error } = await supabase.from('equipment').insert([{
            nama_alat: aiCommand.nama_alat, 
            harga_sewa: aiCommand.harga_sewa,
            category_id: aiCommand.category_id 
          }]);
          reply = error ? `Waduh gagal nambahin alat nih: ${error.message}` : `Beres bos! Alat **${aiCommand.nama_alat}** udah ready di etalase! 📸`;
        }
      }
    } catch (parseError) {}

    return c.json({ success: true, reply });
  } catch (error: any) {
    console.error(error);
    return c.json({ success: false, reply: "Koneksi ke AI lagi putus nih bos." });
  }
});

const port = process.env.PORT ? parseInt(process.env.PORT) : 8787
console.log(`Server running at http://localhost:${port}`)

serve({ fetch: app.fetch, port })