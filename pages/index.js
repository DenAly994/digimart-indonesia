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
    Plus, LayoutDashboard, Package, Server, Zap, CheckCircle2, Terminal
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
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setProducts(data.sort((a,b) => (a.price || 0) - (b.price || 0)));
        }, (error) => console.error("Inventory Sync Error:", error));

        // Real-time listener untuk Accounts
        const unsubAcc = onSnapshot(collection(db, 'accounts'), (snap) => {
            setAccounts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }, (error) => console.error("Account Sync Error:", error));

        return () => { unsubInv(); unsubAcc(); };
    }, []);

    // --- FUNGSI ADMIN ---
    const handleAddProduct = async () => {
        if(!newProdName || !newProdPrice) return alert("System Error: Nama dan Harga wajib diisi!");
        setLoadingAction(true);
        try {
            await setDoc(doc(db, 'inventory', `PROD-${Date.now()}`), { 
                name: newProdName, 
                price: Number(newProdPrice) 
            });
            setNewProdName(""); setNewProdPrice(""); 
        } catch (err) { alert(err.message); }
        setLoadingAction(false);
    };

    const handleDeleteProduct = async (id) => { 
        if(confirm("Hapus protokol produk ini?")) await deleteDoc(doc(db, 'inventory', id)); 
    };

    const updatePrice = async (id, newPrice) => {
        try {
            await updateDoc(doc(db, 'inventory', id), { price: Number(newPrice) });
        } catch (err) { console.error(err); }
    };

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
                    batch.set(doc(db, 'accounts', `NODE-${Math.random().toString(36).substr(2, 5).toUpperCase()}`), { 
                        user: u.trim(), 
                        pass: p.trim(), 
                        status: 'ready' 
                    });
                    count++;
                }
            });
            await batch.commit(); 
            setBulkText(""); 
            alert(`Data Uploaded: ${count} Node berhasil disuntikkan!`);
        } catch (err) { alert(err.message); }
        setLoadingAction(false);
    };

    const handleDeleteAccount = async (id) => { 
        if(confirm("Hapus node ini permanen?")) await deleteDoc(doc(db, 'accounts', id)); 
    };

    // --- FUNGSI PEMBELI ---
    const handleClaim = async () => {
        if(!user) return router.push('/login');
        if(!invoice) return alert("Masukkan Nomor Invoice Lynk.id");
        
        setLoadingAction(true);
        try {
            const orderRef = doc(db, 'orders', invoice);
            const orderSnap = await getDoc(orderRef);

            if (!orderSnap.exists()) { 
                setLoadingAction(false); 
                return alert("ACCESS DENIED: Invoice tidak ditemukan dalam matriks."); 
            }
            if (orderSnap.data().status !== 'paid') { 
                setLoadingAction(false); 
                return alert("ACCESS DENIED: Otorisasi pembayaran belum selesai."); 
            }
            if (orderSnap.data().claimed === true) { 
                setLoadingAction(false); 
                return alert("ACCESS DENIED: Invoice telah digunakan sebelumnya."); 
            }

            const q = query(collection(db, 'accounts'), where("status", "==", "ready"), limit(1));
            const snap = await getDocs(q);
            
            if(!snap.empty) {
                const acc = snap.docs[0];
                const batch = writeBatch(db);
                batch.update(doc(db, 'accounts', acc.id), { 
                    status: 'in_use', 
                    currentUser: user.email, 
                    invoiceRef: invoice, 
                    claimedAt: new Date() 
                });
                batch.update(orderRef, { 
                    claimed: true, 
                    claimedBy: user.email, 
                    accountId: acc.id, 
                    claimedAt: new Date() 
                });
                await batch.commit();
                setAccessData(acc.data());
            } else { 
                alert("SYSTEM BUSY: Semua node penuh. Silakan masuk dalam antrean."); 
            }
        } catch (error) { 
            alert("Sistem Database sibuk. Coba lagi."); 
        }
        setLoadingAction(false);
    };

    // Variasi Animasi
    const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
    const stagger = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };

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
                            <h2 style={{margin:0, fontSize:'24px', fontWeight:'900'}}>Digimart Command Server</h2>
                            <p style={{margin:'5px 0 0 0', fontSize:'12px', color:'#666'}}>Sistem Kendali Utama & Manajemen Node Otomatis.</p>
                        </div>
                        <div style={s.adminBadge}><ShieldCheck size={16} color="#10b981"/> Overlord Active</div>
                    </header>

                    <AnimatePresence mode="wait">
                        <motion.div key={activeMenu} initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} transition={{duration:0.2}}>
                            {activeMenu === 'dashboard' && (
                                <div style={s.statsGrid}>
                                    <div style={s.statCard}>
                                        <div style={s.statHeader}><Package color="#3b82f6"/><span style={s.statLabel}>Total Protokol</span></div>
                                        <div style={s.statNumber}>{products.length}</div>
                                    </div>
                                    <div style={s.statCard}>
                                        <div style={s.statHeader}><Database color="#8b5cf6"/><span style={s.statLabel}>Total Node</span></div>
                                        <div style={s.statNumber}>{accounts.length}</div>
                                    </div>
                                    <div style={s.statCard}>
                                        <div style={s.statHeader}><Activity color="#10b981"/><span style={s.statLabel}>Standby Nodes</span></div>
                                        <div style={s.statNumber}>{accounts.filter(a => a.status === 'ready').length}</div>
                                    </div>
                                    <div style={s.statCard}>
                                        <div style={s.statHeader}><Zap color="#ef4444"/><span style={s.statLabel}>Active Nodes</span></div>
                                        <div style={s.statNumber}>{accounts.filter(a => a.status === 'in_use').length}</div>
                                    </div>
                                </div>
                            )}

                            {activeMenu === 'catalog' && (
                                <div style={s.cardAdminLg}>
                                    <h3 style={s.cardTitle}>Registrasi Protokol Harga</h3>
                                    <div style={{display:'flex', gap:'15px', marginBottom:'30px'}}>
                                        <input style={s.inText} placeholder="Nama Paket (cth: UnlockTool / 11 Jam)" value={newProdName} onChange={e=>setNewProdName(e.target.value)} />
                                        <input style={s.inText} type="number" placeholder="Harga (cth: 15000)" value={newProdPrice} onChange={e=>setNewProdPrice(e.target.value)} />
                                        <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}} onClick={handleAddProduct} style={s.btnBlueSmall} disabled={loadingAction}><Plus size={18}/> INJECT</motion.button>
                                    </div>
                                    <div style={s.tableContainer}>
                                        {products.map(p => (
                                            <div key={p.id} style={s.rowAdmin}>
                                                <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                                                    <div style={s.iconSmall}><Package size={14} color="#3b82f6"/></div>
                                                    <span style={{fontWeight:'bold', fontSize:'14px'}}>{p.name || "Unnamed Product"}</span>
                                                </div>
                                                <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
                                                    <span style={{fontSize:'12px', color:'#666'}}>IDR</span>
                                                    <input style={s.inPrice} defaultValue={p.price} onBlur={(e) => updatePrice(p.id, e.target.value)} />
                                                    <motion.div whileHover={{scale:1.2}} onClick={() => handleDeleteProduct(p.id)} style={{cursor:'pointer', padding:'5px'}}><Trash2 size={16} color="#ef4444"/></motion.div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeMenu === 'nodes' && (
                                <div style={s.nodesGrid}>
                                    <div style={s.cardAdminLg}>
                                        <h3 style={s.cardTitle}>Data Injection Matrix</h3>
                                        <p style={{fontSize:'12px', color:'#666', marginBottom:'15px'}}>Format <code style={{color:'#3b82f6'}}>username|password</code> per baris.</p>
                                        <textarea style={s.textarea} value={bulkText} onChange={e => setBulkText(e.target.value)} placeholder="user1|pass123&#10;user2|pass456" />
                                        <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={handleBulkImport} style={s.btnBlueFull} disabled={loadingAction}>{loadingAction ? "UPLOADING TO MATRIX..." : "PUSH STOK KE DATABASE"}</motion.button>
                                    </div>
                                    <div style={s.cardAdminLg}>
                                        <h3 style={s.cardTitle}>Active Node Telemetry</h3>
                                        <div style={{maxHeight:'400px', overflowY:'auto', paddingRight:'10px'}}>
                                            {accounts.length === 0 ? <p style={{fontSize:'12px', opacity:0.3}}>Database kosong.</p> : accounts.map(acc => (
                                                <div key={acc.id} style={s.rowAdmin}>
                                                    <div>
                                                        <div style={{fontWeight:'bold', fontSize:'13px', letterSpacing:'0.5px'}}>{acc.user}</div>
                                                        <div style={{fontSize:'10px', marginTop:'4px', color: acc.status === 'ready' ? '#10b981' : '#facc15', background: acc.status === 'ready' ? 'rgba(16,185,129,0.1)' : 'rgba(250,204,21,0.1)', display:'inline-block', padding:'3px 8px', borderRadius:'10px', fontWeight:'bold'}}>{(acc.status || "").toUpperCase()}</div>
                                                    </div>
                                                    <motion.div whileHover={{scale:1.2}} onClick={() => handleDeleteAccount(acc.id)} style={{cursor:'pointer', padding:'5px'}}><Trash2 size={16} color="#ef4444"/></motion.div>
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

    // --- RENDER PEMBELI ---
    return (
        <div style={s.storeContainer}>
            <div style={s.cyberGrid}></div>
            <div style={s.glowBlue}></div>
            
            <nav style={s.storeNav}>
                <div style={s.logoStore}>
                    <div style={{...s.logoIcon, background:'rgba(59, 130, 246, 0.2)'}}><Cpu size={20} color="#3b82f6"/></div>
                    Digimart<b style={{color:'#fff'}}>Indonesia</b>
                </div>
                {user ? (
                    <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                        <Link href="/member" style={{textDecoration:'none'}}>
                            <motion.div whileHover={{scale:1.05}} style={{...s.userBadgeStore, background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.2)', color:'#3b82f6'}}>
                                <Key size={14}/> <span>PORTAL MEMBER</span>
                            </motion.div>
                        </Link>
                        <motion.div whileHover={{scale:1.05}} style={s.userBadgeStore}>
                            <User size={14}/> <span>{(user.email || "").split('@')[0]}</span> 
                            <div style={{width:'1px', height:'12px', background:'#333', margin:'0 5px'}}></div>
                            <LogOut size={14} onClick={() => signOut(auth)} style={{cursor:'pointer', color:'#ef4444'}}/>
                        </motion.div>
                    </div>
                ) : (
                    <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}} onClick={() => router.push('/login')} style={s.loginBtn}>SYSTEM LOGIN</motion.button>
                )}
            </nav>

            <main style={s.storeMain}>
                <header style={s.hero}>
                    <motion.div initial={{opacity:0, scale:0.8}} animate={{opacity:1, scale:1}} style={s.liveBadge}>
                        <motion.div animate={{scale:[1, 1.5, 1], opacity:[1, 0.5, 1]}} transition={{repeat:Infinity, duration:2}} style={s.dotGlow}></motion.div>
                        DIGIMART PROTOCOL ONLINE
                    </motion.div>
                    <motion.h1 initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.1}} style={s.h1}>
                        Secure <span style={s.textGradient}>Node Protocol.</span>
                    </motion.h1>
                    <motion.p initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.2}} style={s.heroSub}>
                        Gerbang akses node terenkripsi. Lakukan otorisasi pembayaran dan dapatkan kredensial eksekusi sistem dalam hitungan milidetik.
                    </motion.p>
                </header>

                <motion.div variants={stagger} initial="hidden" animate="visible" style={s.gridStore}>
                    {products.length === 0 ? <p style={{textAlign:'center', width:'100%', opacity:0.3, gridColumn:'1/-1'}}>Protokol tidak tersedia saat ini.</p> : products.map(p => (
                        <motion.div variants={fadeUp} key={p.id} style={s.cardStore}>
                            <div style={s.cardTop}>
                                <div style={s.tagStore}>{(p.name || "").includes('/') ? p.name.split('/')[1] : 'SESS'}</div>
                                <Activity size={16} color="#3b82f6" opacity={0.5}/>
                            </div>
                            <h3 style={s.prodName}>{(p.name || "Package").split('/')[0]}</h3>
                            <div style={s.priceBox}>
                                <span style={{fontSize:'14px', color:'#666', fontWeight:'bold'}}>IDR</span>
                                <span style={s.priceText}>{(p.price || 0).toLocaleString('id-ID')}</span>
                            </div>
                            <motion.button whileHover={{scale:1.02, background:'rgba(59, 130, 246, 0.1)', borderColor:'#3b82f6'}} whileTap={{scale:0.98}} onClick={() => setShowClaim(true)} style={s.btnClaimStore}>
                                <Key size={16}/> REQUEST ACCESS
                            </motion.button>
                        </motion.div>
                    ))}
                </motion.div>
            </main>

            <AnimatePresence>
                {showClaim && (
                    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={s.overlay}>
                        <motion.div initial={{scale:0.9, y:20}} animate={{scale:1, y:0}} exit={{scale:0.9, y:20}} style={s.modalCyber}>
                            <div style={s.modalHeader}>
                                <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
                                    <ShieldCheck size={18} color="#10b981"/>
                                    <span style={{fontSize:'12px', fontWeight:'900', letterSpacing:'1px', color:'#fff'}}>ENCRYPTED AUTHENTICATION</span>
                                </div>
                                <X onClick={() => {setShowClaim(false); setAccessData(null);}} style={{cursor:'pointer', opacity:0.5}} size={18}/>
                            </div>
                            <div style={s.modalBody}>
                                {!user ? (
                                    <div style={{textAlign:'center', padding:'20px 0'}}>
                                        <LockIcon />
                                        <p style={{fontSize:'13px', color:'#888', marginBottom:'25px'}}>Clearance dibutuhkan. Silakan login terlebih dahulu untuk mengakses matriks ini.</p>
                                        <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={() => router.push('/login')} style={s.btnBlueFull}>SYSTEM LOGIN</motion.button>
                                    </div>
                                ) : accessData ? (
                                    <motion.div initial={{opacity:0}} animate={{opacity:1}}>
                                        <div style={{textAlign:'center', marginBottom:'20px'}}>
                                            <div style={{display:'inline-flex', padding:'10px', borderRadius:'50%', background:'rgba(16,185,129,0.1)', marginBottom:'10px'}}><CheckCircle2 size={30} color="#10b981"/></div>
                                            <h3 style={{margin:0, color:'#10b981'}}>ACCESS GRANTED</h3>
                                        </div>
                                        <div style={s.successBox}>
                                            <div style={s.dataRow}><small style={{color:'#666', fontWeight:'bold'}}>USERNAME</small> <b style={{fontSize:'16px', color:'#fff'}}>{accessData.user}</b></div>
                                            <div style={s.dataRow}><small style={{color:'#666', fontWeight:'bold'}}>PASSWORD</small> <b style={{fontSize:'16px', color:'#fff'}}>{accessData.pass}</b></div>
                                        </div>
                                        <p style={s.warnText}>* PERINGATAN: Modifikasi password atau *multiple login* akan memicu protokol pemblokiran otomatis.</p>
                                    </motion.div>
                                ) : (
                                    <>
                                        <label style={s.labelCyber}>TRANSACTION HASH / INVOICE LYNK.ID</label>
                                        <div style={s.inputCyberWrapper}>
                                            <Terminal size={16} color="#3b82f6"/>
                                            <input style={s.inputCyber} placeholder="LYNK-XXXXXX" value={invoice} onChange={e => setInvoice(e.target.value)} />
                                        </div>
                                        <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={handleClaim} style={s.btnBlueFull} disabled={loadingAction}>
                                            {loadingAction ? "DECRYPTING INVOICE..." : "REDEEM KREDENSIAL"}
                                        </motion.button>
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

// Icon Helper
const LockIcon = () => (
    <div style={{width:'50px', height:'50px', borderRadius:'50%', background:'rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px auto'}}>
        <ShieldCheck size={20} color="#666"/>
    </div>
);

// --- STYLES ---
const s = {
    cyberGrid: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 0)', backgroundSize: '30px 30px', zIndex: 0, pointerEvents:'none' },
    glowBlue: { position: 'fixed', top: '-20%', right: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)', filter: 'blur(80px)', zIndex: 0, pointerEvents:'none' },
    adminContainer: { display:'flex', minHeight:'100vh', background:'#030303', color:'#fff', fontFamily:'Inter, sans-serif' },
    sidebar: { width:'280px', background:'rgba(10,10,10,0.8)', backdropFilter:'blur(20px)', borderRight:'1px solid rgba(255,255,255,0.05)', padding:'30px 20px', display:'flex', flexDirection:'column', zIndex:10 },
    logoSidebar: { fontSize:'20px', fontWeight:'950', display:'flex', alignItems:'center', gap:'10px', marginBottom:'50px', paddingLeft:'10px', letterSpacing:'-0.5px' },
    logoIcon: { background:'linear-gradient(135deg, #3b82f6, #2563eb)', padding:'8px', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 20px rgba(59,130,246,0.3)' },
    menuList: { display:'flex', flexDirection:'column', gap:'8px', flex:1 },
    menuItem: { display:'flex', alignItems:'center', gap:'12px', padding:'16px 20px', background:'transparent', border:'none', color:'#666', fontWeight:'bold', borderRadius:'16px', cursor:'pointer', textAlign:'left', textDecoration:'none', fontSize:'13px', transition:'all 0.3s' },
    menuItemActive: { display:'flex', alignItems:'center', gap:'12px', padding:'16px 20px', background:'linear-gradient(90deg, rgba(59,130,246,0.15) 0%, transparent 100%)', borderLeft:'3px solid #3b82f6', color:'#3b82f6', fontWeight:'bold', borderRadius:'0 16px 16px 0', cursor:'pointer', textAlign:'left', fontSize:'13px' },
    logoutBtn: { display:'flex', alignItems:'center', gap:'10px', padding:'15px 20px', background:'rgba(239, 68, 68, 0.05)', borderRadius:'16px', color:'#ef4444', fontWeight:'bold', cursor:'pointer', fontSize:'13px', border:'1px solid rgba(239,68,68,0.1)' },
    adminMain: { flex:1, padding:'40px 50px', position:'relative', zIndex:10, height:'100vh', overflowY:'auto' },
    adminTopBar: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'40px', paddingBottom:'25px', borderBottom:'1px solid rgba(255,255,255,0.05)' },
    adminBadge: { display:'flex', alignItems:'center', gap:'8px', background:'rgba(16,185,129,0.1)', color:'#10b981', padding:'8px 16px', borderRadius:'30px', border:'1px solid rgba(16,185,129,0.2)', fontSize:'11px', fontWeight:'bold' },
    statsGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:'25px' },
    statCard: { background:'rgba(15,15,15,0.6)', backdropFilter:'blur(20px)', padding:'30px', borderRadius:'24px', border:'1px solid rgba(255,255,255,0.05)', boxShadow:'0 10px 30px -10px rgba(0,0,0,0.5)' },
    statHeader: { display:'flex', alignItems:'center', gap:'10px', marginBottom:'20px' },
    statLabel: { fontSize:'12px', color:'#888', fontWeight:'bold', textTransform:'uppercase', letterSpacing:'1px' },
    statNumber: { fontSize:'42px', fontWeight:'950', letterSpacing:'-2px' },
    nodesGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(350px, 1fr))', gap:'25px' },
    cardAdminLg: { background:'rgba(15,15,15,0.6)', backdropFilter:'blur(20px)', padding:'35px', borderRadius:'24px', border:'1px solid rgba(255,255,255,0.05)', marginBottom:'25px', boxShadow:'0 10px 30px -10px rgba(0,0,0,0.5)' },
    cardTitle: { margin:'0 0 25px 0', fontSize:'18px', fontWeight:'900' },
    inText: { flex:1, padding:'16px 20px', background:'rgba(0,0,0,0.5)', border:'1px solid rgba(255,255,255,0.08)', color:'#fff', borderRadius:'14px', outline:'none', fontSize:'13px', fontWeight:'bold' },
    btnBlueSmall: { padding:'0 25px', background:'linear-gradient(135deg, #3b82f6, #2563eb)', color:'#fff', border:'none', borderRadius:'14px', fontWeight:'900', cursor:'pointer', display:'flex', alignItems:'center', gap:'8px', fontSize:'12px', letterSpacing:'1px' },
    tableContainer: { borderTop:'1px solid rgba(255,255,255,0.05)', paddingTop:'15px' },
    rowAdmin: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'18px 0', borderBottom:'1px solid rgba(255,255,255,0.03)' },
    iconSmall: { background:'rgba(59,130,246,0.1)', padding:'8px', borderRadius:'10px' },
    inPrice: { width:'100px', background:'rgba(0,0,0,0.5)', border:'1px solid rgba(255,255,255,0.08)', color:'#10b981', textAlign:'center', borderRadius:'10px', padding:'10px', fontWeight:'900', outline:'none', fontSize:'13px' },
    textarea: { width:'100%', height:'150px', background:'rgba(0,0,0,0.5)', border:'1px solid rgba(255,255,255,0.08)', color:'#3b82f6', borderRadius:'16px', padding:'20px', marginBottom:'20px', resize:'none', outline:'none', fontFamily:'monospace', fontSize:'13px' },
    btnBlueFull: { width:'100%', padding:'20px', background:'linear-gradient(135deg, #3b82f6, #2563eb)', color:'#fff', border:'none', borderRadius:'16px', fontWeight:'950', cursor:'pointer', fontSize:'13px', letterSpacing:'1px', display:'flex', justifyContent:'center', alignItems:'center', gap:'10px', boxShadow:'0 10px 25px -5px rgba(59,130,246,0.4)' },
    storeContainer: { position:'relative', background:'#030303', minHeight:'100vh', color:'#fff', fontFamily:'Inter, sans-serif' },
    storeNav: { position:'relative', zIndex:10, display:'flex', justifyContent:'space-between', alignItems:'center', padding:'25px 5%', borderBottom:'1px solid rgba(255,255,255,0.05)', background:'rgba(3,3,3,0.5)', backdropFilter:'blur(20px)' },
    logoStore: { fontWeight:'950', display:'flex', alignItems:'center', gap:'10px', fontSize:'20px', letterSpacing:'-0.5px' },
    userBadgeStore: { display:'flex', alignItems:'center', gap:'10px', background:'rgba(255,255,255,0.05)', padding:'8px 15px', borderRadius:'20px', fontSize:'12px', fontWeight:'bold', border:'1px solid rgba(255,255,255,0.05)' },
    loginBtn: { background:'#fff', color:'#000', border:'none', padding:'12px 25px', borderRadius:'14px', fontWeight:'900', cursor:'pointer', fontSize:'12px', letterSpacing:'1px' },
    storeMain: { position:'relative', zIndex:10, maxWidth:'1100px', margin:'0 auto', padding:'80px 20px' },
    hero: { textAlign:'center', marginBottom:'80px' },
    liveBadge: { display:'inline-flex', alignItems:'center', gap:'8px', background:'rgba(16,185,129,0.05)', color:'#10b981', padding:'8px 20px', borderRadius:'30px', fontSize:'11px', fontWeight:'900', border:'1px solid rgba(16,185,129,0.1)', marginBottom:'25px', letterSpacing:'1px' },
    dotGlow: { width:'6px', height:'6px', background:'#10b981', borderRadius:'50%', boxShadow:'0 0 10px #10b981' },
    h1: { fontSize:'72px', fontWeight:'950', letterSpacing:'-4px', margin:'0 0 20px 0', lineHeight:'1.1' },
    textGradient: { background:'linear-gradient(to right, #3b82f6, #8b5cf6)', WebkitBackgroundClip:'text', color:'transparent' },
    heroSub: { fontSize:'16px', color:'#888', maxWidth:'600px', margin:'0 auto', lineHeight:'1.6' },
    gridStore: { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:'30px' },
    cardStore: { background:'rgba(15,15,15,0.6)', backdropFilter:'blur(20px)', padding:'40px', borderRadius:'32px', border:'1px solid rgba(255,255,255,0.05)', boxShadow:'0 20px 40px -15px rgba(0,0,0,0.5)' },
    cardTop: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'25px' },
    tagStore: { background:'rgba(250, 204, 21, 0.1)', color:'#facc15', padding:'6px 14px', borderRadius:'12px', fontSize:'10px', fontWeight:'900', border:'1px solid rgba(250, 204, 21, 0.2)', letterSpacing:'0.5px' },
    prodName: { margin:'0', fontSize:'26px', fontWeight:'900', letterSpacing:'-0.5px' },
    priceBox: { display:'flex', alignItems:'flex-start', gap:'5px', margin:'15px 0 35px 0' },
    priceText: { fontSize:'38px', fontWeight:'950', color:'#3b82f6', lineHeight:'1', letterSpacing:'-2px' },
    btnClaimStore: { width:'100%', padding:'18px', background:'rgba(255,255,255,0.03)', color:'#fff', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'16px', fontWeight:'900', cursor:'pointer', display:'flex', justifyContent:'center', alignItems:'center', gap:'10px', fontSize:'12px', letterSpacing:'1px', transition:'all 0.3s' },
    overlay: { position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.8)', backdropFilter:'blur(10px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' },
    modalCyber: { background:'#050505', borderRadius:'24px', width:'100%', maxWidth:'420px', border:'1px solid rgba(255,255,255,0.1)', overflow:'hidden', boxShadow:'0 25px 50px -12px rgba(0,0,0,0.8)' },
    modalHeader: { background:'rgba(255,255,255,0.03)', borderBottom:'1px solid rgba(255,255,255,0.05)', padding:'15px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' },
    modalBody: { padding:'30px' },
    labelCyber: { display:'block', fontSize:'10px', fontWeight:'900', color:'#666', marginBottom:'10px', letterSpacing:'1px' },
    inputCyberWrapper: { display:'flex', alignItems:'center', gap:'15px', background:'rgba(0,0,0,0.5)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'16px', padding:'0 20px', marginBottom:'25px', boxShadow:'inset 0 2px 5px rgba(0,0,0,0.5)' },
    inputCyber: { width:'100%', padding:'20px 0', background:'transparent', border:'none', color:'#fff', outline:'none', fontSize:'16px', fontWeight:'900', letterSpacing:'1px', fontFamily:'monospace' },
    successBox: { background:'rgba(16,185,129,0.05)', padding:'25px', borderRadius:'16px', border:'1px solid rgba(16,185,129,0.2)' },
    dataRow: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px', borderBottom:'1px solid rgba(255,255,255,0.05)', paddingBottom:'10px' },
    warnText: { fontSize:'10px', color:'#ef4444', marginTop:'20px', textAlign:'center', fontWeight:'bold', letterSpacing:'0.5px' },
    loadingScreen: { height:'100vh', background:'#030303', color:'#3b82f6', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'900', letterSpacing:'4px', fontSize:'14px' }
};