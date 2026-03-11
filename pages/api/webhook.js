import { db } from '../../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: "Metode POST dibutuhkan." });
    }

    try {
        const { api_key } = req.query;

        // 1. Validasi API Key dari Firebase system/config
        const systemRef = doc(db, 'system', 'config');
        const systemSnap = await getDoc(systemRef);
        const validKey = systemSnap.exists() ? systemSnap.data().webhookSecret : null;

        if (!api_key || api_key !== validKey) {
            return res.status(401).json({ message: "Otorisasi Gagal." });
        }

        const body = req.body;
        const invoiceNo = body.data?.message_data?.refId;
        const statusAction = body.data?.message_action;

        if (invoiceNo && statusAction === 'SUCCESS') {
            // LOGIKA EXPIRED: Tambah 11 Jam dari sekarang
            const durationHours = 11;
            const expiredAt = new Date();
            expiredAt.setHours(expiredAt.getHours() + durationHours);

            // 2. Simpan Data Lengkap ke Firebase
            await setDoc(doc(db, 'orders', invoiceNo), {
                status: 'paid',
                claimed: false,
                amount: body.data?.message_data?.totals?.total || 0,
                customerEmail: body.data?.message_data?.customer?.email || '-',
                customerName: body.data?.message_data?.customer?.name || 'Member',
                customerPhone: body.data?.message_data?.customer?.phone || '-',
                packageName: "UNLOCKTOOL PREMIUM (11 Jam)",
                createdAt: new Date(),
                expiredAt: expiredAt, // Waktu Expired
                raw_data: body
            });

            return res.status(200).json({ message: "Invoice Injected Successfully" });
        }

        res.status(400).json({ message: "Payment Not Success" });

    } catch (error) {
        res.status(500).json({ message: "Error", error: error.message });
    }
}