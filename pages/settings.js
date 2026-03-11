import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/router';
import { 
    Save, Send, ShieldCheck, ArrowLeft, 
    Terminal, Copy, Cpu, Lock, Key, CheckCircle2 
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext'; 

export default function SettingsPage() {
    const { isAdmin, loading } = useAuth();
    const router = useRouter();

    const [config, setConfig] = useState({ botToken: '', chatId: '', webhookSecret: 'RAHASIA123' });
    const [copied, setCopied] = useState(false);
    const [baseUrl, setBaseUrl] = useState('https://web-kamu.vercel.app');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') setBaseUrl(window.location.origin);
    }, []);

    useEffect(() => {
        if (!loading && !isAdmin) router.push('/');
    }, [loading, isAdmin, router]);

    useEffect(() => {
        if (!isAdmin) return;
        const unsubscribe = onSnapshot(doc(db, 'system', 'config'), (snap) => {
            if (snap.exists()) setConfig(snap.data());
        });
        return () => unsubscribe();
    }, [isAdmin]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await setDoc(doc(db, 'system', 'config'), config);
            // Memberikan jeda sedikit agar animasi tombol terlihat elegan
            setTimeout(() => {
                alert("Sistem Berhasil Diperbarui!");
                setIsSaving(false);
            }, 500);
        } catch (err) { 
            alert("Gagal menyimpan data: " + err.message); 
            setIsSaving(false);
        }
    };

    const copyWebhookUrl = () => {
        const url = `${baseUrl}/api/webhook?api_key=${config.webhookSecret}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading || !isAdmin) return <div style={s.loadingScreen}><motion.div animate={{opacity:[0.5, 1, 0.5]}} transition={{repeat:Infinity, duration:1}}>AUTHORIZING COMMANDER...</motion.div></div>;

    return (
        <div style={s.container}>
            {/* Latar Belakang Futuristik */}
            <div style={s.cyberGrid}></div>
            <div style={s.glowBlue}></div>
            <div style={s.glowGreen}></div>

            <nav style={s.nav}>
                <Link href="/" style={s.backBtn}>
                    <motion.div whileHover={{x:-5}} style={{display:'flex', alignItems:'center', gap:'8px'}}>
                        <ArrowLeft size={16}/> MISSION CONTROL
                    </motion.div>
                </Link>
                <div style={s.statusBadge}>
                    <motion.div animate={{scale:[1, 1.2, 1]}} transition={{repeat:Infinity, duration:2}} style={s.dot}></motion.div>
                    SYSTEM ONLINE
                </div>
            </nav>

            <header style={s.header}>
                <motion.h1 initial={{y:-20, opacity:0}} animate={{y:0, opacity:1}} style={s.title}>
                    Global <span style={{background:'linear-gradient(to right, #3b82f6, #8b5cf6)', WebkitBackgroundClip:'text', color:'transparent'}}>Integrations</span>
                </motion.h1>
                <motion.p initial={{y:20, opacity:0}} animate={{y:0, opacity:1}} transition={{delay:0.1}} style={s.subtitle}>
                    Konfigurasi jembatan notifikasi Telegram dan gerbang keamanan webhook.
                </motion.p>
            </header>

            <div style={s.grid}>
                {/* KARTU 1: TELEGRAM BOT */}
                <motion.div initial={{opacity:0, y:30}} animate={{opacity:1, y:0}} transition={{delay:0.2}} style={s.card}>
                    <div style={s.cardHeader}>
                        <div style={{...s.iconBox, background:'rgba(59, 130, 246, 0.1)', borderColor:'rgba(59, 130, 246, 0.3)'}}><Send size={20} color="#3b82f6"/></div>
                        <div>
                            <h3 style={{margin:0, fontSize:'16px'}}>Telegram Bot</h3>
                            <span style={{fontSize:'11px', color:'#666'}}>Notifikasi order & stok realtime</span>
                        </div>
                    </div>
                    
                    <div style={s.inputGroup}>
                        <label style={s.label}>BOT API TOKEN</label>
                        <div style={s.inputBox}>
                            <Lock size={16} color="#444"/>
                            <input style={s.input} type="password" value={config.botToken} onChange={e => setConfig({...config, botToken: e.target.value})} placeholder="123456:ABC-DEF..." />
                        </div>
                    </div>

                    <div style={s.inputGroup}>
                        <label style={s.label}>OWNER CHAT ID</label>
                        <div style={s.inputBox}>
                            <Cpu size={16} color="#444"/>
                            <input style={s.input} value={config.chatId} onChange={e => setConfig({...config, chatId: e.target.value})} placeholder="987654321" />
                        </div>
                    </div>

                    <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={handleSave} style={s.btnSave} disabled={isSaving}>
                        {isSaving ? "MENYIMPAN..." : <><Save size={16}/> SIMPAN KONFIGURASI</>}
                    </motion.button>
                </motion.div>

                {/* KARTU 2: WEBHOOK SECURITY */}
                <motion.div initial={{opacity:0, y:30}} animate={{opacity:1, y:0}} transition={{delay:0.3}} style={s.card}>
                    <div style={s.cardHeader}>
                        <div style={{...s.iconBox, background:'rgba(16, 185, 129, 0.1)', borderColor:'rgba(16, 185, 129, 0.3)'}}><ShieldCheck size={20} color="#10b981"/></div>
                        <div>
                            <h3 style={{margin:0, fontSize:'16px'}}>Webhook Security</h3>
                            <span style={{fontSize:'11px', color:'#666'}}>Gerbang API khusus Lynk.id</span>
                        </div>
                    </div>

                    <div style={s.inputGroup}>
                        <label style={s.label}>SECRET API KEY</label>
                        <div style={s.inputBox}>
                            <Key size={16} color="#444"/>
                            <input style={s.input} value={config.webhookSecret} onChange={e => setConfig({...config, webhookSecret: e.target.value})} />
                        </div>
                        <span style={s.hintText}>Pastikan kunci ini tidak diketahui siapapun.</span>
                    </div>

                    {/* TERMINAL UI */}
                    <div style={s.terminal}>
                        <div style={s.terminalHeader}>
                            <div style={{display:'flex', gap:'5px'}}>
                                <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#ef4444'}}></div>
                                <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#f59e0b'}}></div>
                                <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#10b981'}}></div>
                            </div>
                            <span style={{fontSize:'10px', color:'#666', fontWeight:'bold', letterSpacing:'1px'}}>ENDPOINT URL</span>
                        </div>
                        <div style={s.terminalBody}>
                            <code style={s.codeText}>{`${baseUrl}/api/webhook?api_key=${config.webhookSecret}`}</code>
                            <motion.button whileHover={{scale:1.1}} whileTap={{scale:0.9}} onClick={copyWebhookUrl} style={s.copyBtn}>
                                {copied ? <CheckCircle2 size={16} color="#10b981"/> : <Copy size={16} color="#888"/>}
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

// --- STYLES: ULTIMATE CYBERPUNK/GLASSMORPHISM ---
const s = {
    container: { position: 'relative', background: '#030303', minHeight: '100vh', color: '#fff', fontFamily: 'Inter, sans-serif', padding: '40px 5%', overflow: 'hidden' },
    
    // Background Effects
    cyberGrid: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 0)', backgroundSize: '40px 40px', zIndex: 0 },
    glowBlue: { position: 'absolute', top: '-10%', left: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)', filter: 'blur(60px)', zIndex: 0 },
    glowGreen: { position: 'absolute', bottom: '-10%', right: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)', filter: 'blur(60px)', zIndex: 0 },

    // Layout
    nav: { position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '60px' },
    backBtn: { color: '#888', textDecoration: 'none', fontSize: '12px', fontWeight: '900', letterSpacing: '1px' },
    statusBadge: { display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '8px 16px', borderRadius: '30px', border: '1px solid rgba(16,185,129,0.2)', fontSize: '11px', fontWeight: '900', boxShadow: '0 0 20px rgba(16,185,129,0.1)' },
    dot: { width: '8px', height: '8px', background: '#10b981', borderRadius: '50%', boxShadow: '0 0 10px #10b981' },

    header: { position: 'relative', zIndex: 10, textAlign: 'center', marginBottom: '60px' },
    title: { fontSize: '48px', fontWeight: '950', letterSpacing: '-2px', margin: 0 },
    subtitle: { color: '#888', fontSize: '15px', maxWidth: '500px', margin: '15px auto 0 auto', lineHeight: '1.6' },

    grid: { position: 'relative', zIndex: 10, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px', maxWidth: '1000px', margin: '0 auto' },
    
    // Cards (Glassmorphism)
    card: { background: 'rgba(15, 15, 15, 0.6)', backdropFilter: 'blur(20px)', padding: '40px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column' },
    cardHeader: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '35px' },
    iconBox: { padding: '12px', borderRadius: '15px', border: '1px solid transparent' },

    // Inputs
    inputGroup: { marginBottom: '25px' },
    label: { display: 'block', fontSize: '11px', fontWeight: '900', color: '#666', letterSpacing: '1px', marginBottom: '10px' },
    inputBox: { display: 'flex', alignItems: 'center', gap: '15px', background: 'rgba(0,0,0,0.5)', padding: '0 20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', transition: 'border 0.3s' },
    input: { width: '100%', padding: '18px 0', background: 'transparent', border: 'none', color: '#fff', outline: 'none', fontSize: '14px', fontWeight: '600' },
    hintText: { display: 'block', fontSize: '11px', color: '#555', marginTop: '10px' },

    // Buttons
    btnSave: { marginTop: 'auto', width: '100%', padding: '20px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff', border: 'none', borderRadius: '18px', fontWeight: '950', fontSize: '13px', letterSpacing: '1px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', cursor: 'pointer', boxShadow: '0 10px 30px -10px rgba(59,130,246,0.5)' },

    // Terminal
    terminal: { marginTop: 'auto', background: '#050505', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)' },
    terminalHeader: { background: '#0a0a0a', padding: '15px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    terminalBody: { padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '15px' },
    codeText: { fontSize: '12px', color: '#10b981', opacity: 0.9, wordBreak: 'break-all', fontFamily: 'monospace' },
    copyBtn: { background: 'rgba(255,255,255,0.05)', border: 'none', padding: '10px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },

    // Loading
    loadingScreen: { height: '100vh', background: '#000', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', letterSpacing: '4px', fontSize: '14px' }
};