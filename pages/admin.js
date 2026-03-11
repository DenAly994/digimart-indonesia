import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { 
    collection, onSnapshot, doc, setDoc, deleteDoc, 
    writeBatch, query, orderBy 
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/router';
import { 
    LayoutDashboard, Plus, Trash2, Database, 
    Smartphone, List, Cpu, Activity, LogOut, 
    TrendingUp, ShieldCheck, Users, X
} from 'lucide-react';

export default function MissionControlAdmin() {
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [products, setProducts] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [queue, setQueue] = useState([]);
    const [bulkText, setBulkText] = useState("");
    const [loading, setLoading] = useState(false);

// Ganti bagian useEffect di admin.js kamu:
useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
        if (user && user.email === "denalyjr@gmail.com") {
            setIsAuthorized(true);
        } else {
            // Jika pembeli nakal coba ketik /admin, langsung tendang ke login
            router.push('/login');
        }
    });
    return () => unsub();
}, []);

    useEffect(() => {
        if (!isAuthorized) return;

        // Sync Products
        const unsubInv = onSnapshot(collection(db, 'inventory'), (snap) => {
            setProducts(snap.docs.map(d => ({id: d.id, ...d.data()})));
        });
        // Sync Account Pool
        const unsubAcc = onSnapshot(collection(db, 'accounts'), (snap) => {
            setAccounts(snap.docs.map(d => ({id: d.id, ...d.data()})));
        });
        // Sync Queue
        const unsubQueue = onSnapshot(query(collection(db, 'queue'), orderBy('timestamp', 'asc')), (snap) => {
            setQueue(snap.docs.map(d => ({id: d.id, ...d.data()})));
        });

        return () => { unsubInv(); unsubAcc(); unsubQueue(); };
    }, [isAuthorized]);

    const handleBulkImport = async () => {
        if(!bulkText) return;
        setLoading(true);
        const batch = writeBatch(db);
        const lines = bulkText.split('\n');
        
        lines.forEach(line => {
            const [u, p] = line.split('|');
            if(u && p) {
                const id = `NODE-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
                batch.set(doc(db, 'accounts', id), { 
                    user: u.trim(), 
                    pass: p.trim(), 
                    status: 'ready',
                    addedAt: new Date()
                });
            }
        });

        await batch.commit();
        setBulkText("");
        setLoading(false);
        alert("Sistem Berhasil Sinkronisasi Akun Baru.");
    };

    const updatePrice = async (id, newPrice) => {
        await setDoc(doc(db, 'inventory', id), { price: Number(newPrice) }, { merge: true });
    };

    if (!isAuthorized) return <div style={styles.loadingS}>AUTHORIZING COMMANDER...</div>;

    return (
        <div style={styles.container}>
            <div style={styles.sidebar}>
                <div style={styles.sideBrand}>
                    <div style={styles.logoIcon}><Cpu size={20} color="#3b82f6" /></div>
                    <span>CORE<b>ADMIN</b></span>
                </div>
                
                <div style={styles.menuActive}><LayoutDashboard size={18}/> Dashboard</div>
                <div style={styles.menuItem} onClick={() => router.push('/')}><Globe size={18}/> View Live Site</div>
                <div style={styles.menuItem} onClick={() => auth.signOut()}><LogOut size={18}/> Terminate</div>
                
                <div style={styles.statsBox}>
                    <div style={styles.statMini}>
                        <Activity size={12} color="#10b981"/> <span>SYSTEM ACTIVE</span>
                    </div>
                    <div style={styles.statMini}>
                        <ShieldCheck size={12} color="#3b82f6"/> <span>SECURE NODE</span>
                    </div>
                </div>
            </div>

            <div style={styles.main}>
                <header style={styles.header}>
                    <div>
                        <h1 style={styles.title}>Mission Control</h1>
                        <p style={styles.subtitle}>Autonomous tool distribution management</p>
                    </div>
                    <div style={styles.topStats}>
                        <div style={styles.tStat}><h3>{accounts.length}</h3><small>TOTAL NODES</small></div>
                        <div style={styles.tStat}><h3>{queue.length}</h3><small>QUEUED</small></div>
                    </div>
                </header>

                <div style={styles.grid}>
                    {/* PRICING CONTROL */}
                    <div style={styles.card}>
                        <div style={styles.cardHead}><Database size={16} color="#3b82f6"/> <span>Market Pricing</span></div>
                        {products.map(p => (
                            <div key={p.id} style={styles.row}>
                                <div style={styles.rowInfo}>
                                    <span style={styles.rowTitle}>{p.name.split('/')[0]}</span>
                                    <small style={styles.rowSub}>{p.id}</small>
                                </div>
                                <div style={styles.priceInputWrapper}>
                                    <span style={styles.currency}>IDR</span>
                                    <input 
                                        type="number" 
                                        style={styles.priceInput} 
                                        defaultValue={p.price}
                                        onBlur={(e) => updatePrice(p.id, e.target.value)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* BULK IMPORT */}
                    <div style={styles.card}>
                        <div style={styles.cardHead}><List size={16} color="#3b82f6"/> <span>Bulk Node Import</span></div>
                        <p style={styles.hint}>Format: username|password (One per line)</p>
                        <textarea 
                            style={styles.textarea} 
                            placeholder="admin01|pass123&#10;admin02|pass456"
                            value={bulkText}
                            onChange={(e) => setBulkText(e.target.value)}
                        />
                        <button onClick={handleBulkImport} style={styles.btnAction} disabled={loading}>
                            {loading ? 'UPLOADING...' : 'PUSH TO DATABASE'}
                        </button>
                    </div>

                    {/* ACCOUNT POOL */}
                    <div style={styles.card}>
                        <div style={styles.cardHead}><Smartphone size={16} color="#3b82f6"/> <span>Node Pool</span></div>
                        <div style={styles.scrollArea}>
                            {accounts.map(acc => (
                                <div key={acc.id} style={styles.row}>
                                    <div>
                                        <div style={styles.rowTitle}>{acc.user}</div>
                                        <div style={styles.statusBadge(acc.status)}>{acc.status.toUpperCase()}</div>
                                    </div>
                                    <button onClick={() => deleteDoc(doc(db, 'accounts', acc.id))} style={styles.btnIcon}>
                                        <Trash2 size={14} color="#ef4444"/>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* LIVE QUEUE */}
                    <div style={styles.card}>
                        <div style={styles.cardHead}><Users size={16} color="#facc15"/> <span>Active Waiting List</span></div>
                        <div style={styles.scrollArea}>
                            {queue.length === 0 ? <p style={styles.empty}>No active queue.</p> : queue.map((q, i) => (
                                <div key={q.id} style={styles.row}>
                                    <div>
                                        <span style={styles.queueIndex}>#{i+1}</span>
                                        <span style={styles.rowTitle}>{q.email.split('@')[0]}</span>
                                    </div>
                                    <button onClick={() => deleteDoc(doc(db, 'queue', q.id))} style={styles.btnIcon}>
                                        <X size={14} color="#444"/>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- MISSION CONTROL STYLES ---
const styles = {
    container: { display: 'flex', background: '#020202', minHeight: '100vh', color: '#fff', fontFamily: 'Inter, sans-serif' },
    loadingS: { height:'100vh', background:'#000', display:'flex', alignItems:'center', justifyContent:'center', color:'#3b82f6', letterSpacing:'4px', fontWeight:'900', fontSize:'12px' },
    sidebar: { width: '260px', background: '#050505', borderRight: '1px solid #111', padding: '40px 20px', display: 'flex', flexDirection: 'column' },
    sideBrand: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '50px', fontSize: '18px', letterSpacing: '-0.5px' },
    logoIcon: { background: '#000', padding: '8px', borderRadius: '10px', border: '1px solid #1a1a1a' },
    menuActive: { display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '12px 15px', borderRadius: '12px', marginBottom: '10px', fontWeight: '800', fontSize: '14px' },
    menuItem: { display: 'flex', alignItems: 'center', gap: '12px', color: '#444', padding: '12px 15px', borderRadius: '12px', marginBottom: '10px', cursor: 'pointer', fontSize: '14px', transition: '0.3s' },
    statsBox: { marginTop: 'auto', background: '#000', padding: '15px', borderRadius: '15px', border: '1px solid #111' },
    statMini: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '9px', fontWeight: '900', color: '#333', marginBottom: '8px' },
    
    main: { flex: 1, padding: '50px', maxWidth: '1300px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '50px' },
    title: { fontSize: '36px', fontWeight: '950', margin: 0, letterSpacing: '-2px' },
    subtitle: { opacity: 0.3, fontSize: '14px', margin: '5px 0 0 0' },
    topStats: { display: 'flex', gap: '30px' },
    tStat: { textAlign: 'right' },

    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '25px' },
    card: { background: 'rgba(10, 10, 10, 0.6)', border: '1px solid #111', padding: '30px', borderRadius: '28px' },
    cardHead: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', fontWeight: '900', color: '#fff', marginBottom: '25px', letterSpacing: '1px', textTransform: 'uppercase' },
    
    row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: '1px solid #0a0a0a' },
    rowTitle: { fontSize: '14px', fontWeight: '800' },
    rowSub: { display: 'block', fontSize: '10px', opacity: 0.2 },
    
    priceInputWrapper: { display: 'flex', alignItems: 'center', background: '#000', borderRadius: '8px', border: '1px solid #111', padding: '0 10px' },
    currency: { fontSize: '10px', fontWeight: '900', opacity: 0.2, marginRight: '8px' },
    priceInput: { background: 'transparent', border: 'none', color: '#10b981', padding: '10px 0', width: '80px', fontWeight: '900', outline: 'none', textAlign: 'right' },
    
    textarea: { width: '100%', height: '120px', background: '#000', border: '1px solid #111', borderRadius: '15px', padding: '15px', color: '#3b82f6', fontSize: '12px', fontFamily: 'monospace', outline: 'none', marginBottom: '15px' },
    btnAction: { width: '100%', padding: '15px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', fontSize: '12px' },
    hint: { fontSize: '10px', opacity: 0.2, marginBottom: '10px' },
    
    scrollArea: { maxHeight: '300px', overflowY: 'auto', paddingRight: '10px' },
    statusBadge: (s) => ({ fontSize: '8px', fontWeight: '900', color: s === 'ready' ? '#10b981' : '#facc15', background: s === 'ready' ? 'rgba(16, 185, 129, 0.05)' : 'rgba(250, 204, 21, 0.05)', padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginTop: '4px' }),
    btnIcon: { background: 'rgba(239, 68, 68, 0.05)', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer' },
    
    queueIndex: { background: '#111', padding: '2px 8px', borderRadius: '5px', fontSize: '10px', fontWeight: '900', color: '#facc15', marginRight: '10px' },
    empty: { fontSize: '12px', opacity: 0.2, textAlign: 'center', padding: '40px 0' }
};