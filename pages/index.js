import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { 
    collection, onSnapshot, doc, getDoc, getDocs, 
    query, where, limit, updateDoc, writeBatch, deleteDoc, setDoc 
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Cpu, LogOut, ShieldCheck, Activity, User, X, 
    Database, List, Trash2, Key, Settings, 
    Plus, LayoutDashboard, Package, Server, Zap, CheckCircle2, Terminal, TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext'; 

export default function SmartIndex() {
    const { user, isAdmin, loading } = useAuth(); 
    const router = useRouter();
    
    const [activeMenu, setActiveMenu] = useState('dashboard');
    const [products, setProducts] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [orderHistory, setOrderHistory] = useState([]); // Database riwayat cuan
    const [showClaim, setShowClaim] = useState(false);
    const [invoice, setInvoice] = useState("");
    const [accessData, setAccessData] = useState(null);
    const [loadingAction, setLoadingAction] = useState(false);
    const [bulkText, setBulkText] = useState("");
    const [newProdName, setNewProdName] = useState("");
    const [newProdPrice, setNewProdPrice] = useState("");

    useEffect(() => {
        // Real-time listener untuk Inventory
        const unsubInv = onSnapshot(collection(db, 'inventory'), (snap) => {
            setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => (a.price || 0) - (b.price || 0)));
        });

        // Real-time listener untuk Accounts
        const unsubAcc = onSnapshot(collection(db, 'accounts'), (snap) => {
            setAccounts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        // Real-time listener untuk History Orders (Cuan Tracker)
        const unsubOrders = onSnapshot(collection(db, 'orders'), (snap) => {
            setOrderHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => b.createdAt - a.createdAt));
        });

        return () => { unsubInv(); unsubAcc(); unsubOrders(); };
    }, []);

    // --- FUNGSI ADMIN ---
    const handleAddProduct = async () => {
        if(!newProdName || !newProdPrice) return alert("System Error: Nama dan Harga wajib diisi!");
        setLoadingAction(true);
        try {
            await setDoc(doc(db, 'inventory', `PROD-${Date.now()}`), { name: newProdName, price: Number(newProdPrice) });
            setNewProdName(""); setNewProdPrice(""); 
        } catch (err) { alert(err.message); }
        setLoadingAction(false);
    };

    const handleDeleteProduct = async (id) => { if(confirm("Hapus protokol produk ini?")) await deleteDoc(doc(db, 'inventory', id)); };
    const updatePrice = async (id, newPrice) => await updateDoc(doc(db, 'inventory', id), { price: Number(newPrice) });

    const handleBulkImport = async () => {
        if(!bulkText) return alert("System Error: Masukkan format user|pass");
        setLoadingAction(true);
        try {
            const batch = writeBatch(db);
            const lines = bulkText.split('\n');
            let count = 0;
            lines.forEach(line => {
                const [u, p] = line.split('|');
                if(u && p) {
                    batch.set(doc(db, 'accounts', `NODE-${Math.random().toString(36).substr(2, 5).toUpperCase()}`), { user: u.trim(), pass: p.trim(), status: 'ready' });
                    count++;
                }
            });
            await batch.commit(); setBulkText(""); alert(`Data Uploaded: ${count} Node berhasil disuntikkan!`);
        } catch (err) { alert(err.message); }
        setLoadingAction(false);
    };

    const handleDeleteAccount = async (id) => { if(confirm("Hapus node ini permanen?")) await deleteDoc(doc(db, 'accounts', id)); };

    // --- FUNGSI PEMBELI ---
    const handleClaim = async () => {
        if(!user) return router.push('/login');
        if(!invoice) return alert("Masukkan Nomor Invoice Lynk.id");
        setLoadingAction(true);
        try {
            const orderRef = doc(db, 'orders', invoice);
            const orderSnap = await getDoc(orderRef);
            if (!orderSnap.exists()) { setLoadingAction(false); return alert("ACCESS DENIED: Invoice tidak ditemukan."); }
            if (orderSnap.data().status !== 'paid') { setLoadingAction(false); return alert("ACCESS DENIED: Belum lunas."); }
            if (orderSnap.data().claimed === true) { setLoadingAction(false); return alert("ACCESS DENIED: Sudah diklaim."); }

            const q = query(collection(db, 'accounts'), where("status", "==", "ready"), limit(1));
            const snap = await getDocs(q);
            if(!snap.empty) {
                const acc = snap.docs[0];
                const batch = writeBatch(db);
                batch.update(doc(db, 'accounts', acc.id), { 
                    status: 'in_use', 
                    currentUser: user.email, 
                    invoiceRef: invoice, 
                    claimedAt: new Date(),
                    packageName: orderSnap.data().packageName || "Premium Package",
                    customerName: orderSnap.data().customerName || "User",
                    customerPhone: orderSnap.data().customerPhone || "-",
                    expiredAt: orderSnap.data().expiredAt || null,
                    amount: orderSnap.data().amount || 0
                });
                batch.update(orderRef, { claimed: true, claimedBy: user.email, accountId: acc.id, claimedAt: new Date() });
                await batch.commit();
                setAccessData(acc.data());
            } else { alert("SYSTEM BUSY: Stok akun sedang kosong."); }
        } catch (error) { alert("Sistem Database sibuk."); }
        setLoadingAction(false);
    };

    if (loading) return <div style={s.loadingScreen}>INITIALIZING DIGIMART CORE...</div>;

    // --- RENDER ADMIN ---
    if (isAdmin) {
        return (
            <div style={s.adminContainer}>
                <div style={s.cyberGrid}></div>
                <aside style={s.sidebar}>
                    <div style={s.logoSidebar}>
                        <div style={s.logoIcon}><Cpu size={20} color="#fff"/></div>
                        Digimart<b style={{color:'#3b82f6'}}>Indonesia</b>
                    </div>
                    <div style={s.menuList}>
                        <button onClick={() => setActiveMenu('dashboard')} style={activeMenu === 'dashboard' ? s.menuItemActive : s.menuItem}><LayoutDashboard size={18}/> Telemetry</button>
                        <button onClick={() => setActiveMenu('catalog')} style={activeMenu === 'catalog' ? s.menuItemActive : s.menuItem}><Package size={18}/> Protokol Harga</button>
                        <button onClick={() => setActiveMenu('nodes')} style={activeMenu === 'nodes' ? s.menuItemActive : s.menuItem}><Server size={18}/> Matrix Pool</button>
                        <Link href="/settings" style={s.menuItem}><Settings size={18}/> Integrasi Core</Link>
                    </div>
                    <button onClick={() => signOut(auth)} style={s.logoutBtn}><LogOut size={18}/> Terminate Session</button>
                </aside>

                <main style={s.adminMain}>
                    <header style={s.adminTopBar}>
                        <div>
                            <h2 style={{margin:0, fontSize:'24px', fontWeight:'900'}}>Command Center</h2>
                            <p style={{margin:'5px 0 0 0', fontSize:'12px', color:'#666'}}>Dashboard monitoring pusat kendali Digimart.</p>
                        </div>
                        <div style={s.adminBadge}><ShieldCheck size={16} color="#10b981"/> Overlord Active</div>
                    </header>

                    <AnimatePresence mode="wait">
                        <motion.div key={activeMenu} initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}}>
                            
                            {activeMenu === 'dashboard' && (
                                <div style={s.adminGridPro}>
                                    {/* ANALYTICS ROW */}
                                    <div style={s.statsGrid}>
                                        <div style={s.statCardPro}>
                                            <div style={{...s.statIcon, background:'rgba(59,130,246,0.1)'}}><TrendingUp size={24} color="#3b82f6"/></div>
                                            <div>
                                                <div style={s.statLabel}>Total Revenue</div>
                                                <div style={s.statValue}>Rp {orderHistory.reduce((acc, curr) => acc + (curr.amount || 0), 0).toLocaleString('id-ID')}</div>
                                            </div>
                                        </div>
                                        <div style={s.statCardPro}>
                                            <div style={{...s.statIcon, background:'rgba(16,185,129,0.1)'}}><Activity size={24} color="#10b981"/></div>
                                            <div>
                                                <div style={s.statLabel}>Success Claims</div>
                                                <div style={s.statValue}>{orderHistory.filter(o => o.claimed).length} Sessions</div>
                                            </div>
                                        </div>
                                        <div style={s.statCardPro}>
                                            <div style={{...s.statIcon, background:'rgba(250,204,21,0.1)'}}><Database size={24} color="#facc15"/></div>
                                            <div>
                                                <div style={s.statLabel}>Ready Nodes</div>
                                                <div style={s.statValue}>{accounts.filter(a => a.status === 'ready').length} Unit</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* LOGS & HEALTH ROW */}
                                    <div style={s.dashboardFlex}>
                                        <div style={{...s.cardAdminLg, flex: 2}}>
                                            <h3 style={s.cardTitle}>Live Order Logs</h3>
                                            <div style={s.logContainer}>
                                                {orderHistory.length === 0 ? <p style={{opacity:0.2}}>Menunggu data...</p> : orderHistory.slice(0, 8).map(order => (
                                                    <div key={order.id} style={s.logItem}>
                                                        <div style={s.logTime}>{order.createdAt?.toDate().toLocaleTimeString()}</div>
                                                        <div style={s.logInfo}><b>{order.customerName || 'Guest'}</b> beli {order.packageName || 'Paket'}</div>
                                                        <div style={{...s.logBadge, background: order.claimed ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)', color: order.claimed ? '#10b981' : '#3b82f6'}}>
                                                            {order.claimed ? 'CLAIMED' : 'PAID'}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div style={{...s.cardAdminLg, flex: 1}}>
                                            <h3 style={s.cardTitle}>System Health</h3>
                                            <div style={s.healthItem}><span>Firestore Engine</span> <span style={{color:'#10b981'}}>● ONLINE</span></div>
                                            <div style={s.healthItem}><span>Webhook API</span> <span style={{color:'#10b981'}}>● ACTIVE</span></div>
                                            <div style={s.healthItem}><span>Auth Service</span> <span style={{color:'#10b981'}}>● SECURE</span></div>
                                            <div style={{marginTop:'30px', padding:'15px', background:'rgba(255,255,255,0.02)', borderRadius:'12px', fontSize:'11px', color:'#555', lineHeight:'1.5'}}>
                                                Sistem berjalan pada protokol terenkripsi. Semua transaksi diverifikasi secara otomatis oleh Webhook Core.
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeMenu === 'catalog' && (
                                <div style={s.cardAdminLg}>
                                    <h3 style={s.cardTitle}>Manajemen Katalog</h3>
                                    <div style={{display:'flex', gap:'15px', marginBottom:'30px'}}>
                                        <input style={s.inText} placeholder="Nama Paket" value={newProdName} onChange={e=>setNewProdName(e.target.value)} />
                                        <input style={s.inText} type="number" placeholder="Harga" value={newProdPrice} onChange={e=>setNewProdPrice(e.target.value)} />
                                        <button onClick={handleAddProduct} style={s.btnBlueSmall} disabled={loadingAction}><Plus size={18}/> INJECT</button>
                                    </div>
                                    <div style={s.tableContainer}>
                                        {products.map(p => (
                                            <div key={p.id} style={s.rowAdmin}>
                                                <span style={{fontWeight:'bold'}}>{p.name}</span>
                                                <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
                                                    <input style={s.inPrice} defaultValue={p.price} onBlur={(e) => updatePrice(p.id, e.target.value)} />
                                                    <Trash2 size={16} color="#ef4444" onClick={() => handleDeleteProduct(p.id)} style={{cursor:'pointer'}}/>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeMenu === 'nodes' && (
                                <div style={s.nodesGrid}>
                                    <div style={s.cardAdminLg}>
                                        <h3 style={s.cardTitle}>Bulk Inject Account</h3>
                                        <textarea style={s.textarea} value={bulkText} onChange={e => setBulkText(e.target.value)} placeholder="user|pass" />
                                        <button onClick={handleBulkImport} style={s.btnBlueFull} disabled={loadingAction}>PUSH STOK KE MATRIX</button>
                                    </div>
                                    <div style={s.cardAdminLg}>
                                        <h3 style={s.cardTitle}>Live Node Pool</h3>
                                        <div style={{maxHeight:'400px', overflowY:'auto'}}>
                                            {accounts.map(acc => (
                                                <div key={acc.id} style={s.rowAdmin}>
                                                    <div>
                                                        <div style={{fontSize:'13px', fontWeight:'bold'}}>{acc.user}</div>
                                                        <div style={{fontSize:'10px', color: acc.status === 'ready' ? '#10b981' : '#facc15'}}>{acc.status.toUpperCase()}</div>
                                                    </div>
                                                    <Trash2 size={16} color="#ef4444" onClick={() => handleDeleteAccount(acc.id)} style={{cursor:'pointer'}}/>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        );
    }

    // --- RENDER STOREFRONT (PEMBELI) ---
    return (
        <div style={s.storeContainer}>
            <div style={s.cyberGrid}></div>
            <nav style={s.storeNav}>
                <div style={s.logoStore}><div style={s.logoIcon}><Cpu size={20}/></div> Digimart<b>Indonesia</b></div>
                {user ? (
                    <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
                        <Link href="/member" style={s.userBadgeStore}><Key size={14}/> PORTAL MEMBER</Link>
                        <LogOut size={16} onClick={() => signOut(auth)} style={{cursor:'pointer', color:'#ef4444'}}/>
                    </div>
                ) : (
                    <button onClick={() => router.push('/login')} style={s.loginBtn}>SYSTEM LOGIN</button>
                )}
            </nav>

            <main style={s.storeMain}>
                <header style={s.hero}>
                    <h1 style={s.h1}>Secure <span style={s.textGradient}>Node Protocol.</span></h1>
                    <p style={{color:'#666', maxWidth:'500px', margin:'0 auto'}}>Otorisasi pembayaran dan dapatkan akses premium dalam hitungan detik.</p>
                </header>

                <div style={s.gridStore}>
                    {products.map(p => (
                        <div key={p.id} style={s.cardStore}>
                            <div style={s.tagStore}>{(p.name || "").split('/')[1] || 'PREMIUM'}</div>
                            <h3 style={s.prodName}>{(p.name || "").split('/')[0]}</h3>
                            <div style={s.priceBox}>
                                <span style={{fontSize:'14px', color:'#444'}}>IDR</span>
                                <span style={s.priceText}>{(p.price || 0).toLocaleString('id-ID')}</span>
                            </div>
                            <button onClick={() => setShowClaim(true)} style={s.btnClaimStore}><Key size={16}/> REQUEST ACCESS</button>
                        </div>
                    ))}
                </div>
            </main>

            {/* MODAL KLAIM */}
            <AnimatePresence>
                {showClaim && (
                    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={s.overlay}>
                        <motion.div initial={{scale:0.9}} animate={{scale:1}} style={s.modalCyber}>
                            <div style={s.modalHeader}>
                                <b>ENCRYPTED AUTHENTICATION</b>
                                <X onClick={() => {setShowClaim(false); setAccessData(null);}} style={{cursor:'pointer'}} size={18}/>
                            </div>
                            <div style={s.modalBody}>
                                {accessData ? (
                                    <div style={{textAlign:'center'}}>
                                        <div style={s.successBadge}>ACCESS GRANTED</div>
                                        <div style={s.resultBox}>
                                            <div style={s.resRow}><span>USER</span> <b>{accessData.user}</b></div>
                                            <div style={s.resRow}><span>PASS</span> <b>{accessData.pass}</b></div>
                                        </div>
                                        <p style={{fontSize:'10px', color:'#ef4444', marginTop:'15px'}}>* Segera gunakan. Sesi akan kadaluarsa sesuai paket.</p>
                                    </div>
                                ) : (
                                    <>
                                        <label style={s.label}>NOMOR INVOICE LYNK.ID</label>
                                        <input style={s.inText} placeholder="LYNK-XXXXXX" value={invoice} onChange={e => setInvoice(e.target.value)} />
                                        <button onClick={handleClaim} style={s.btnBlueFull} disabled={loadingAction}>{loadingAction ? "VERIFYING..." : "REDEEM ACCESS"}</button>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

const s = {
    loadingScreen: { height:'100vh', background:'#030303', color:'#3b82f6', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'950', letterSpacing:'5px' },
    cyberGrid: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 0)', backgroundSize: '30px 30px', zIndex: 0 },
    
    // Admin Styles
    adminContainer: { display:'flex', minHeight:'100vh', background:'#030303', color:'#fff' },
    sidebar: { width:'280px', background:'rgba(10,10,10,0.8)', padding:'30px 20px', borderRight:'1px solid #111', zIndex:10 },
    logoSidebar: { display:'flex', alignItems:'center', gap:'10px', marginBottom:'50px', fontSize:'20px', fontWeight:'900' },
    logoIcon: { background:'linear-gradient(135deg, #3b82f6, #8b5cf6)', padding:'8px', borderRadius:'10px' },
    menuList: { display:'flex', flexDirection:'column', gap:'10px' },
    menuItem: { padding:'15px 20px', borderRadius:'15px', color:'#666', border:'none', background:'transparent', textAlign:'left', display:'flex', alignItems:'center', gap:'10px', cursor:'pointer', textDecoration:'none', fontWeight:'bold' },
    menuItemActive: { padding:'15px 20px', borderRadius:'15px', color:'#3b82f6', background:'rgba(59,130,246,0.1)', borderLeft:'3px solid #3b82f6', textAlign:'left', display:'flex', alignItems:'center', gap:'10px', fontWeight:'bold' },
    logoutBtn: { marginTop:'auto', padding:'15px', color:'#ef4444', background:'transparent', border:'none', display:'flex', gap:'10px', cursor:'pointer', fontWeight:'bold' },
    
    adminMain: { flex:1, padding:'50px', zIndex:10, height:'100vh', overflowY:'auto' },
    adminTopBar: { display:'flex', justifyContent:'space-between', marginBottom:'40px' },
    adminBadge: { background:'rgba(16,185,129,0.1)', color:'#10b981', padding:'8px 15px', borderRadius:'30px', border:'1px solid rgba(16,185,129,0.2)', fontSize:'11px', fontWeight:'bold' },
    
    // Pro Admin Components
    adminGridPro: { display:'flex', flexDirection:'column', gap:'30px' },
    statsGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(250px, 1fr))', gap:'25px' },
    statCardPro: { background:'rgba(15,15,15,0.6)', padding:'25px', borderRadius:'24px', border:'1px solid rgba(255,255,255,0.05)', display:'flex', alignItems:'center', gap:'20px' },
    statIcon: { padding:'15px', borderRadius:'15px' },
    statLabel: { fontSize:'11px', color:'#666', fontWeight:'900', textTransform:'uppercase' },
    statValue: { fontSize:'22px', fontWeight:'950' },
    
    dashboardFlex: { display:'flex', gap:'25px', flexWrap:'wrap' },
    logContainer: { display:'flex', flexDirection:'column', gap:'12px' },
    logItem: { display:'flex', alignItems:'center', gap:'15px', padding:'15px', background:'rgba(0,0,0,0.3)', borderRadius:'14px', fontSize:'12px' },
    logTime: { color:'#444', fontFamily:'monospace' },
    logInfo: { flex:1 },
    logBadge: { padding:'4px 10px', borderRadius:'8px', fontSize:'10px', fontWeight:'900' },
    healthItem: { display:'flex', justifyContent:'space-between', padding:'15px 0', borderBottom:'1px solid #111', fontSize:'12px' },

    cardAdminLg: { background:'rgba(15,15,15,0.6)', padding:'30px', borderRadius:'24px', border:'1px solid rgba(255,255,255,0.05)' },
    cardTitle: { margin:'0 0 25px 0', fontSize:'16px' },
    inText: { padding:'15px', background:'#000', border:'1px solid #222', borderRadius:'12px', color:'#fff', outline:'none', width:'100%' },
    btnBlueSmall: { padding:'0 20px', background:'#3b82f6', color:'#fff', border:'none', borderRadius:'12px', fontWeight:'bold', cursor:'pointer' },
    rowAdmin: { display:'flex', justifyContent:'space-between', padding:'15px 0', borderBottom:'1px solid #111' },
    inPrice: { width:'80px', background:'#000', border:'1px solid #222', color:'#10b981', textAlign:'center', borderRadius:'8px', padding:'5px' },
    textarea: { width:'100%', height:'120px', background:'#000', border:'1px solid #222', color:'#3b82f6', padding:'15px', borderRadius:'12px', resize:'none', marginBottom:'15px', fontFamily:'monospace' },
    btnBlueFull: { width:'100%', padding:'18px', background:'#3b82f6', color:'#fff', border:'none', borderRadius:'15px', fontWeight:'900', cursor:'pointer' },

    // Storefront Styles
    storeContainer: { background:'#030303', minHeight:'100vh', color:'#fff' },
    storeNav: { position:'relative', display:'flex', justifyContent:'space-between', padding:'25px 5%', borderBottom:'1px solid #111', zIndex:10 },
    logoStore: { fontSize:'20px', fontWeight:'950', display:'flex', alignItems:'center', gap:'10px' },
    userBadgeStore: { background:'rgba(255,255,255,0.05)', padding:'8px 15px', borderRadius:'20px', fontSize:'11px', textDecoration:'none', color:'#fff', fontWeight:'bold' },
    loginBtn: { background:'#fff', color:'#000', border:'none', padding:'10px 20px', borderRadius:'12px', fontWeight:'bold', cursor:'pointer' },
    storeMain: { position:'relative', maxWidth:'1100px', margin:'0 auto', padding:'80px 20px', zIndex:10 },
    hero: { textAlign:'center', marginBottom:'80px' },
    h1: { fontSize:'64px', fontWeight:'950', letterSpacing:'-4px' },
    textGradient: { background:'linear-gradient(to right, #3b82f6, #8b5cf6)', WebkitBackgroundClip:'text', color:'transparent' },
    gridStore: { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:'25px' },
    cardStore: { background:'rgba(15,15,15,0.6)', padding:'40px', borderRadius:'30px', border:'1px solid #111' },
    tagStore: { background:'rgba(250,204,21,0.1)', color:'#facc15', fontSize:'9px', padding:'5px 10px', borderRadius:'8px', display:'inline-block', marginBottom:'15px', fontWeight:'900' },
    prodName: { margin:0, fontSize:'24px', fontWeight:'900' },
    priceBox: { margin:'15px 0 30px 0', display:'flex', alignItems:'baseline', gap:'10px' },
    priceText: { fontSize:'36px', fontWeight:'950', color:'#3b82f6' },
    btnClaimStore: { width:'100%', padding:'15px', background:'rgba(255,255,255,0.03)', color:'#fff', border:'1px solid #222', borderRadius:'14px', fontWeight:'bold', cursor:'pointer' },
    
    // Modal Styles
    overlay: { position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.8)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' },
    modalCyber: { background:'#050505', borderRadius:'24px', width:'90%', maxWidth:'400px', border:'1px solid #222', overflow:'hidden' },
    modalHeader: { background:'rgba(255,255,255,0.03)', padding:'15px 20px', display:'flex', justifyContent:'space-between', fontSize:'11px' },
    modalBody: { padding:'30px' },
    label: { display:'block', fontSize:'10px', fontWeight:'900', color:'#444', marginBottom:'10px' },
    successBadge: { background:'rgba(16,185,129,0.1)', color:'#10b981', padding:'10px', borderRadius:'12px', fontWeight:'900', marginBottom:'20px' },
    resultBox: { background:'#000', padding:'20px', borderRadius:'15px', border:'1px solid #111' },
    resRow: { display:'flex', justifyContent:'space-between', marginBottom:'10px' }
};