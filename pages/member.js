import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { motion } from 'framer-motion';
import { 
    Cpu, LogOut, ArrowLeft, Key, 
    History, Terminal, CheckCircle2, Copy, ShieldCheck 
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext'; 

export default function MemberPortal() {
    const { user, loading } = useAuth(); 
    const router = useRouter();
    
    const [activeNodes, setActiveNodes] = useState([]);
    const [orderHistory, setOrderHistory] = useState([]);
    const [copiedData, setCopiedData] = useState("");

    // 1. PROTEKSI AKSES: Hanya untuk yang sudah login
    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [loading, user, router]);

    // 2. TARIK DATA KHUSUS MEMBER INI (Real-time)
    useEffect(() => {
        if (!user) return;

        // Tarik Akun yang sedang aktif/dipakai member ini
        const qNodes = query(collection(db, 'accounts'), where("currentUser", "==", user.email));
        const unsubNodes = onSnapshot(qNodes, (snap) => {
            setActiveNodes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        // Tarik Riwayat Invoice yang pernah diklaim member ini
        const qOrders = query(collection(db, 'orders'), where("claimedBy", "==", user.email));
        const unsubOrders = onSnapshot(qOrders, (snap) => {
            setOrderHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        return () => { unsubNodes(); unsubOrders(); };
    }, [user]);

    // 3. FITUR COPY TO CLIPBOARD
    const handleCopy = (text, type) => {
        navigator.clipboard.writeText(text);
        setCopiedData(text + type);
        setTimeout(() => setCopiedData(""), 2000);
    };

    // Animasi
    const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

    if (loading || !user) return <div style={s.loadingScreen}>VERIFYING CREDENTIALS...</div>;

    return (
        <div style={s.container}>
            {/* Efek Background Cyber */}
            <div style={s.cyberGrid}></div>
            <div style={s.glowBlue}></div>

            <nav style={s.nav}>
                <Link href="/" style={s.backBtn}>
                    <motion.div whileHover={{x:-5}} style={{display:'flex', alignItems:'center', gap:'8px'}}>
                        <ArrowLeft size={16}/> KEMBALI KE STORE
                    </motion.div>
                </Link>
                <div style={s.userBadge}>
                    <ShieldCheck size={14} color="#10b981"/>
                    <span>{user.email}</span>
                </div>
            </nav>

            <main style={s.main}>
                <header style={s.header}>
                    <motion.h1 initial={{y:-20, opacity:0}} animate={{y:0, opacity:1}} style={s.title}>
                        Client <span style={s.textGradient}>Portal.</span>
                    </motion.h1>
                    <motion.p initial={{y:20, opacity:0}} animate={{y:0, opacity:1}} transition={{delay:0.1}} style={s.subtitle}>
                        Brankas pribadi Anda. Kelola kredensial node yang sedang aktif dan pantau riwayat akses sistem.
                    </motion.p>
                </header>

                <div style={s.grid}>
                    {/* BAGIAN 1: NODE YANG SEDANG AKTIF (BRANKAS AKUN) */}
                    <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{delay:0.2}}>
                        <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'20px'}}>
                            <div style={s.iconBox}><Terminal size={18} color="#3b82f6"/></div>
                            <h2 style={s.sectionTitle}>Active Credentials</h2>
                        </div>
                        
                        {activeNodes.length === 0 ? (
                            <div style={s.emptyBox}>
                                <Key size={30} color="#444" style={{marginBottom:'10px'}}/>
                                <p>Belum ada node yang aktif.</p>
                                <Link href="/" style={s.linkStore}>Sewa Node Sekarang</Link>
                            </div>
                        ) : activeNodes.map(node => (
                            <div key={node.id} style={s.cardActive}>
                                <div style={s.cardActiveHeader}>
                                    <span style={s.tagActive}>🟢 STATUS: SECURED & ACTIVE</span>
                                    <span style={{fontSize:'10px', color:'#666'}}>Ref: {node.invoiceRef || 'N/A'}</span>
                                </div>
                                
                                <div style={s.credRow}>
                                    <div>
                                        <div style={s.credLabel}>USERNAME</div>
                                        <div style={s.credValue}>{node.user}</div>
                                    </div>
                                    <button onClick={() => handleCopy(node.user, 'user')} style={s.copyBtn}>
                                        {copiedData === node.user + 'user' ? <CheckCircle2 size={16} color="#10b981"/> : <Copy size={16} color="#888"/>}
                                    </button>
                                </div>
                                
                                <div style={s.credRow}>
                                    <div>
                                        <div style={s.credLabel}>PASSWORD</div>
                                        <div style={s.credValue}>{node.pass}</div>
                                    </div>
                                    <button onClick={() => handleCopy(node.pass, 'pass')} style={s.copyBtn}>
                                        {copiedData === node.pass + 'pass' ? <CheckCircle2 size={16} color="#10b981"/> : <Copy size={16} color="#888"/>}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </motion.div>

                    {/* BAGIAN 2: RIWAYAT TRANSAKSI / KLAIM */}
                    <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{delay:0.3}}>
                        <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'20px'}}>
                            <div style={{...s.iconBox, background:'rgba(16, 185, 129, 0.1)', borderColor:'rgba(16, 185, 129, 0.3)'}}><History size={18} color="#10b981"/></div>
                            <h2 style={s.sectionTitle}>Access History</h2>
                        </div>

                        <div style={s.cardHistory}>
                            {orderHistory.length === 0 ? (
                                <p style={{textAlign:'center', opacity:0.3, fontSize:'12px', padding:'20px'}}>Belum ada riwayat transaksi.</p>
                            ) : orderHistory.map(order => (
                                <div key={order.id} style={s.historyRow}>
                                    <div>
                                        <div style={s.historyInv}>{order.id}</div>
                                        <div style={s.historyDate}>{order.claimedAt ? new Date(order.claimedAt.toDate()).toLocaleString('id-ID') : 'Unknown Date'}</div>
                                    </div>
                                    <div style={s.historyBadge}>VERIFIED</div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}

// --- STYLES: CYBERPUNK / GLASSMORPHISM ---
const s = {
    container: { position: 'relative', background: '#030303', minHeight: '100vh', color: '#fff', fontFamily: 'Inter, sans-serif', padding: '0 5%', overflow: 'hidden' },
    cyberGrid: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 0)', backgroundSize: '30px 30px', zIndex: 0, pointerEvents:'none' },
    glowBlue: { position: 'fixed', top: '-10%', left: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)', filter: 'blur(80px)', zIndex: 0, pointerEvents:'none' },
    
    nav: { position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '30px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' },
    backBtn: { color: '#888', textDecoration: 'none', fontSize: '12px', fontWeight: '900', letterSpacing: '1px' },
    userBadge: { display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', padding: '8px 16px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '11px', fontWeight: 'bold' },

    main: { position: 'relative', zIndex: 10, maxWidth: '1000px', margin: '0 auto', padding: '60px 0' },
    header: { textAlign: 'center', marginBottom: '60px' },
    title: { fontSize: '56px', fontWeight: '950', letterSpacing: '-2px', margin: 0 },
    textGradient: { background: 'linear-gradient(to right, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', color: 'transparent' },
    subtitle: { color: '#888', fontSize: '15px', maxWidth: '500px', margin: '15px auto 0 auto', lineHeight: '1.6' },

    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '40px' },
    sectionTitle: { fontSize: '20px', fontWeight: '900', margin: 0 },
    iconBox: { padding: '10px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' },

    // Active Credentials Card
    cardActive: { background: 'rgba(15,15,15,0.8)', backdropFilter: 'blur(20px)', borderRadius: '24px', border: '1px solid rgba(59,130,246,0.2)', padding: '30px', marginBottom: '20px', boxShadow: '0 15px 35px -10px rgba(0,0,0,0.5)' },
    cardActiveHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', paddingBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)' },
    tagActive: { background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '6px 12px', borderRadius: '10px', fontSize: '9px', fontWeight: '900', letterSpacing: '1px' },
    credRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.5)', padding: '15px 20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '15px' },
    credLabel: { fontSize: '10px', fontWeight: '900', color: '#666', letterSpacing: '1px', marginBottom: '5px' },
    credValue: { fontSize: '16px', fontWeight: 'bold', color: '#fff', fontFamily: 'monospace', letterSpacing: '1px' },
    copyBtn: { background: 'rgba(255,255,255,0.05)', border: 'none', padding: '10px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' },

    // Empty State
    emptyBox: { background: 'rgba(15,15,15,0.4)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '24px', padding: '50px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' },
    linkStore: { color: '#3b82f6', textDecoration: 'none', fontSize: '12px', fontWeight: 'bold', marginTop: '10px', padding: '10px 20px', background: 'rgba(59,130,246,0.1)', borderRadius: '30px' },

    // History Card
    cardHistory: { background: 'rgba(15,15,15,0.6)', backdropFilter: 'blur(20px)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', padding: '20px' },
    historyRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', borderBottom: '1px solid rgba(255,255,255,0.03)' },
    historyInv: { fontSize: '14px', fontWeight: '900', fontFamily: 'monospace', color: '#fff' },
    historyDate: { fontSize: '11px', color: '#666', marginTop: '5px' },
    historyBadge: { background: 'rgba(255,255,255,0.05)', color: '#888', padding: '5px 10px', borderRadius: '8px', fontSize: '9px', fontWeight: '900', letterSpacing: '1px' },

    loadingScreen: { height: '100vh', background: '#030303', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', letterSpacing: '4px', fontSize: '14px' }
};