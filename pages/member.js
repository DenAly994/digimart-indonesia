import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Cpu, LogOut, ArrowLeft, Key, 
    History, Terminal, CheckCircle2, Copy, ShieldCheck,
    Clock, HelpCircle, Zap, ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext'; 

export default function MemberPortal() {
    const { user, loading, auth } = useAuth(); 
    const router = useRouter();
    const [activeNodes, setActiveNodes] = useState([]);
    const [orderHistory, setOrderHistory] = useState([]);
    const [copiedData, setCopiedData] = useState("");

    useEffect(() => {
        if (!loading && !user) router.push('/login');
    }, [loading, user, router]);

    useEffect(() => {
        if (!user) return;
        // Ambil Akun yang sedang dipakai
        const qNodes = query(collection(db, 'accounts'), where("currentUser", "==", user.email));
        const unsubNodes = onSnapshot(qNodes, (snap) => {
            setActiveNodes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        // Ambil Riwayat Order
        const qOrders = query(collection(db, 'orders'), where("claimedBy", "==", user.email));
        const unsubOrders = onSnapshot(qOrders, (snap) => {
            setOrderHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => { unsubNodes(); unsubOrders(); };
    }, [user]);

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        setCopiedData(text);
        setTimeout(() => setCopiedData(""), 2000);
    };

    if (loading || !user) return <div style={s.loadingScreen}>SECURE SYNC...</div>;

    return (
        <div style={s.container}>
            <div style={s.cyberGrid}></div>
            
            <nav style={s.nav}>
                <Link href="/" style={s.backBtn}><ArrowLeft size={16}/> TERMINAL UTAMA</Link>
                <div style={s.navRight}>
                     <div style={s.userBadge}><ShieldCheck size={14} color="#10b981"/> {user.email}</div>
                     <LogOut size={18} onClick={() => signOut(auth)} style={{cursor:'pointer', color:'#ef4444'}}/>
                </div>
            </nav>

            <main style={s.main}>
                <header style={s.header}>
                    <div style={s.chip}><Zap size={12} fill="#3b82f6"/> CLIENT ACCESS GRANTED</div>
                    <h1 style={s.title}>Protocol <span style={s.textGradient}>Dashboard.</span></h1>
                </header>

                <div style={s.grid}>
                    {/* KOLOM KIRI: INVOICE & CREDENTIALS */}
                    <div style={s.col}>
                        <div style={s.sectionHeader}><Terminal size={18} color="#3b82f6"/> <b>Sesi Aktif</b></div>
                        
                        <AnimatePresence>
                            {activeNodes.length === 0 ? (
                                <div style={s.emptyBox}>Tidak ada protokol aktif.</div>
                            ) : activeNodes.map(node => (
                                <motion.div key={node.id} initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} style={s.invoiceCard}>
                                    <div style={s.struk}>
                                        <div style={{textAlign:'center'}}>
                                            <div style={s.strukTitle}>🧾 INVOICE PEMBELIAN</div>
                                            <div style={s.divider}>━━━━━━━━━━━━━━━━━━━━</div>
                                            <div style={s.strukWelcome}>Terima kasih telah berbelanja di<br/><b>DIGIMART INDONESIA</b></div>
                                        </div>

                                        <div style={s.strukBody}>
                                            <div style={s.strukRow}><span>📦 Paket</span> <b>{node.packageName || 'UnlockTool Premium'}</b></div>
                                            <div style={s.strukRow}><span>👤 Nama</span> <b>{node.customerName || 'User'}</b></div>
                                            <div style={s.strukRow}><span>📱 WA</span> <b>{node.customerPhone || '-'}</b></div>
                                            <div style={s.strukRow}><span>📅 Expired</span> <b style={{color:'#facc15'}}>{node.expiredAt?.toDate().toLocaleString('id-ID', {day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'})} WIB</b></div>
                                            <div style={s.strukRow}><span>💳 Total</span> <b>Rp {(node.amount || 0).toLocaleString('id-ID')}</b></div>
                                        </div>

                                        <div style={s.divider}>━━━━━━━━━━━━━━━━━━━━</div>
                                        <div style={s.authLabel}>🔐 KREDENSIAL AKSES</div>

                                        <div style={s.credBox}>
                                            <div style={s.credItem}>
                                                <small>USERNAME</small>
                                                <div style={s.credVal}>
                                                    <code>{node.user}</code>
                                                    <button onClick={() => handleCopy(node.user)} style={s.copyBtn}>
                                                        {copiedData === node.user ? <CheckCircle2 size={14} color="#10b981"/> : <Copy size={14}/>}
                                                    </button>
                                                </div>
                                            </div>
                                            <div style={s.credItem}>
                                                <small>PASSWORD</small>
                                                <div style={s.credVal}>
                                                    <code>{node.pass}</code>
                                                    <button onClick={() => handleCopy(node.pass)} style={s.copyBtn}>
                                                        {copiedData === node.pass ? <CheckCircle2 size={14} color="#10b981"/> : <Copy size={14}/>}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* KOLOM KANAN: HISTORY */}
                    <div style={s.col}>
                        <div style={s.sectionHeader}><History size={18} color="#8b5cf6"/> <b>Riwayat Sistem</b></div>
                        <div style={s.cardHistory}>
                            {orderHistory.map(order => (
                                <div key={order.id} style={s.histItem}>
                                    <div style={{fontSize:'12px', fontFamily:'monospace'}}>{order.id}</div>
                                    <div style={{fontSize:'10px', color:'#10b981', fontWeight:'900'}}>SUCCESS</div>
                                </div>
                            ))}
                        </div>
                        <div style={s.helpBox}>
                            <h4 style={{margin:0}}>Ada Masalah?</h4>
                            <p style={{fontSize:'12px', color:'#666'}}>Hubungi support jika akun bermasalah.</p>
                            <a href="https://wa.me/62812345678" target="_blank" style={s.waBtn}><HelpCircle size={16}/> WHATSAPP SUPPORT</a>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

const s = {
    container: { background: '#030303', minHeight: '100vh', color: '#fff', fontFamily: 'Inter, sans-serif' },
    cyberGrid: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 0)', backgroundSize: '30px 30px' },
    nav: { position: 'relative', display:'flex', justifyContent:'space-between', padding:'30px 5%', borderBottom:'1px solid rgba(255,255,255,0.05)', zIndex:10 },
    backBtn: { color:'#666', textDecoration:'none', fontSize:'11px', fontWeight:'900', display:'flex', alignItems:'center', gap:'8px' },
    navRight: { display:'flex', alignItems:'center', gap:'15px' },
    userBadge: { background:'rgba(255,255,255,0.05)', padding:'8px 15px', borderRadius:'20px', fontSize:'11px' },
    main: { position:'relative', maxWidth:'1000px', margin:'0 auto', padding:'50px 20px', zIndex:10 },
    header: { textAlign:'center', marginBottom:'50px' },
    chip: { background:'rgba(59,130,246,0.1)', color:'#3b82f6', padding:'6px 15px', borderRadius:'10px', fontSize:'10px', fontWeight:'900', display:'inline-block', marginBottom:'15px' },
    title: { fontSize:'52px', fontWeight:'950', letterSpacing:'-3px', margin:0 },
    textGradient: { background: 'linear-gradient(to right, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', color: 'transparent' },
    grid: { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(320px, 1fr))', gap:'30px' },
    col: { display:'flex', flexDirection:'column', gap:'20px' },
    sectionHeader: { display:'flex', alignItems:'center', gap:'10px', fontSize:'14px' },
    emptyBox: { padding:'40px', textAlign:'center', background:'rgba(255,255,255,0.02)', borderRadius:'20px', color:'#444', border:'1px dashed #222' },
    
    // STRUK STYLE
    invoiceCard: { background:'rgba(15,15,15,0.8)', padding:'25px', borderRadius:'24px', border:'1px solid #333', boxShadow:'0 20px 50px rgba(0,0,0,0.5)' },
    struk: { fontFamily:'monospace', color:'#ccc' },
    strukTitle: { fontSize:'14px', fontWeight:'bold', color:'#fff' },
    divider: { color:'#222', margin:'10px 0' },
    strukWelcome: { fontSize:'11px', color:'#666', lineHeight:'1.5' },
    strukBody: { margin:'20px 0', fontSize:'12px', display:'flex', flexDirection:'column', gap:'8px' },
    strukRow: { display:'flex', justifyContent:'space-between' },
    authLabel: { textAlign:'center', fontSize:'11px', fontWeight:'900', color:'#10b981', marginBottom:'15px' },
    
    credBox: { display:'flex', flexDirection:'column', gap:'10px' },
    credItem: { background:'#000', padding:'12px 15px', borderRadius:'12px', border:'1px solid #222' },
    credVal: { display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'5px' },
    copyBtn: { background:'transparent', border:'none', color:'#444', cursor:'pointer' },
    
    cardHistory: { background:'rgba(255,255,255,0.02)', borderRadius:'20px', padding:'10px' },
    histItem: { display:'flex', justifyContent:'space-between', padding:'15px', borderBottom:'1px solid #111' },
    helpBox: { background:'rgba(59,130,246,0.05)', padding:'25px', borderRadius:'24px', border:'1px solid rgba(59,130,246,0.1)' },
    waBtn: { background:'#fff', color:'#000', padding:'12px', borderRadius:'12px', display:'flex', justifyContent:'center', alignItems:'center', gap:'8px', textDecoration:'none', fontWeight:'900', fontSize:'11px', marginTop:'15px' },
    loadingScreen: { height:'100vh', background:'#030303', color:'#3b82f6', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'900', letterSpacing:'5px' }
};