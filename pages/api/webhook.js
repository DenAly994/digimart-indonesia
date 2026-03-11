import { db } from '../../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export default async function handler(req, res) {
    // 1. Validasi Metode
    if (req.method !== 'POST') {
        return res.status(405).json({ message: "Gunakan metode POST." });
    }

    console.log("Sinyal Mentah Masuk:", JSON.stringify(req.body));

    try {
        const { api_key } = req.query;

        // 2. Ambil Kunci Rahasia dari Database 'system/config'
        const systemRef = doc(db, 'system', 'config');
        const systemSnap = await getDoc(systemRef);
        
        if (!systemSnap.exists()) {
            console.error("EROR: Dokumen system/config tidak ditemukan di Firebase!");
            return res.status(500).json({ message: "System Config Missing" });
        }

        const validKey = systemSnap.data().webhookSecret;

        // 3. Validasi API Key
        if (!api_key || api_key !== validKey) {
            console.error("EROR: API Key Webhook Salah!");
            return res.status(401).json({ message: "Otorisasi Gagal." });
        }

        // 4. PARSING DATA LYNK.ID (PENTING!)
        const body = req.body;
        
        // Mengambil RefID (Nomor Invoice) dari struktur baru Lynk.id
        const invoiceNo = body.data?.message_data?.refId;
        const statusAction = body.data?.message_action; // Harus 'SUCCESS'
        const customerEmail = body.data?.message_data?.customer?.email || 'Customer';

        console.log(`Memproses Invoice: ${invoiceNo} | Status: ${statusAction}`);

        if (invoiceNo && statusAction === 'SUCCESS') {
            // 5. Suntikkan ke Database 'orders'
            await setDoc(doc(db, 'orders', invoiceNo), {
                status: 'paid',
                claimed: false,
                customer: customerEmail,
                updatedAt: new Date(),
                raw_data: body // Simpan data mentah untuk cadangan
            });

            console.log("SUKSES: Invoice berhasil didaftarkan ke Matriks!");
            return res.status(200).json({ message: "Webhook Received & Injected." });
        } else {
            console.warn("WARNING: Data tidak valid atau pembayaran belum SUCCESS.");
            return res.status(400).json({ message: "Invalid Payment Data" });
        }

    } catch (error) {
        console.error("Sistem Webhook Error:", error);
        res.status(500).json({ message: "Internal Error", error: error.message });
    }
}