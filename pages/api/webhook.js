import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export default async function handler(req, res) {
    // 1. BLOCKER: Hanya terima jalur POST (karena Lynk.id mengirim data via POST)
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Akses Ditolak. Gunakan metode POST.' });
    }

    try {
        // 2. SECURITY CHECK: Ambil API Key dari URL web kamu
        const { api_key } = req.query;

        // Ambil Secret Key asli dari database (yang kamu setting di menu SYSTEM CONFIG)
        const configSnap = await getDoc(doc(db, 'system', 'config'));
        const systemConfig = configSnap.exists() ? configSnap.data() : {};
        const validSecret = systemConfig.webhookSecret || "RAHASIA123";

        // Jika API Key dari URL tidak cocok dengan yang di database, tendang!
        if (api_key !== validSecret) {
            console.log("Peringatan: Ada penyusup mencoba menembak webhook!");
            return res.status(401).json({ error: 'Unauthorized. API Key Salah.' });
        }

        // 3. TANGKAP DATA DARI LYNK.ID
        const data = req.body;
        console.log("Sinyal dari Lynk.id masuk:", data);

        // Biasanya Lynk.id mengirimkan parameter seperti invoice_id dan status
        const invoiceId = data.invoice_id || data.transaction_id || data.order_id;
        const status = data.status?.toUpperCase(); 

        if (!invoiceId) {
            return res.status(400).json({ error: 'Invoice ID tidak ditemukan dalam payload.' });
        }

        // 4. EKSEKUSI JIKA PEMBAYARAN SUKSES/LUNAS
        if (status === 'SUCCESS' || status === 'PAID' || status === 'SETTLED') {
            
            // Simpan Invoice ini ke database Firestore sebagai tiket sah
            await setDoc(doc(db, 'orders', invoiceId), {
                invoice: invoiceId,
                customer_name: data.customer_name || 'Pembeli Anonim',
                customer_email: data.customer_email || '',
                amount: data.amount || 0,
                status: 'paid',
                timestamp: serverTimestamp(),
                claimed: false // Status false berarti akun belum diambil oleh pembeli
            });

            return res.status(200).json({ message: 'Order LUNAS berhasil dicatat sistem!' });
        } else {
            // Jika status masih pending / gagal
            return res.status(200).json({ message: 'Sinyal diterima, tapi status belum LUNAS.' });
        }

    } catch (error) {
        console.error("Sistem Webhook Error:", error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}