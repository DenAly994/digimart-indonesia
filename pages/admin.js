import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { 
    collection, onSnapshot, doc, setDoc, deleteDoc, 
    writeBatch, query, orderBy, limit, updateDoc 
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/router';
import { 
    Cpu, LogOut, ShieldCheck, Trash2, 
    Plus, Package, Zap, Globe, Clock, Tag, 
    CreditCard
} from 'lucide-react';

export default function MissionControlAdmin() {
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);

    // State Input Baru (Untuk Baris Inject)
    const [newProdName, setNewProdName] = useState("");
    const [newProdDuration, setNewProdDuration] = useState("");
    const [newProdPrice, setNewProdPrice] = useState("");

    // PROTEKSI AKSES
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (user) => {
            if (user && user.email === "denalyjr@gmail.com") {
                setIsAuthorized(true);
            } else {
                router.push('/login');
            }
        });
        return () => unsub();
    }, [router]);

    // SYNC DATA DARI FIREBASE
    useEffect(() => {
        if (!isAuthorized) return;
        const unsubInv = onSnapshot(collection(db, 'inventory'), (snap) => {
            setProducts(snap.docs.map(d => ({id: d.id, ...d.data()})));
        });
        return () => unsubInv();
    }, [isAuthorized]);

    // FUNGSI INJECT PAKET BARU
    const handleAddProduct = async () => {
        if(!newProdName || !newProdPrice || !newProdDuration) return alert("System Error: Semua kolom (Nama, Durasi, Harga) wajib diisi!");
        setLoading(true);
        try {
            await setDoc(doc(db, 'inventory', `PROD-${Date.now()}`), { 
                name: newProdName, 
                duration: newProdDuration,
                price: Number(newProdPrice),
                createdAt: new Date()
            });
            setNewProdName(""); setNewProdDuration(""); setNewProdPrice(""); 
            alert("SUCCESS: Protokol paket baru berhasil di-inject!");
        } catch (err) { alert(err.message); }
        setLoading(false);
    };

    // FUNGSI EDIT OTOMATIS (Satu fungsi untuk semua field)
    const updateField = async (id, field, value) => {
        if(!value) return;
        try {
            const val = field === 'price' ? Number(value) : value;
            await updateDoc(doc(db, 'inventory', id), { [field]: val });
            console.log(`Sync Success: ${field} updated.`);
        } catch (err) { console.error("Sync Failed:", err); }
    };

    if (!isAuthorized) return <div style={s.loadingScreen}>ESTABLISHING COMMANDER IDENTITY...</div>;

    return (
        <div style={s.adminContainer}>
            <div style={s.cyberGrid}></div>
            
            {/* SIDEBAR */}
            <aside style={s.sidebar}>
                <div style={s.logoSidebar}>
                    <div style={s.logoIcon}><Cpu size={20} color="#fff"/></div>
                    Digimart<b style={{color:'#3b82f6'}}>Indonesia</b>
                </div>
                <div style={s.menuList}>
                    <div style={s.menuItemActive}><Package size={18}/> Manajemen Katalog</div>
                    <button onClick={() => window.open('/', '_blank')} style={s.menuItem}><Globe size={18}/> View Storefront</button>
                </div>
                <button onClick={() => auth.signOut()} style={s.logoutBtn}><LogOut size={18}/> Terminate Session</button>
            </aside>

            {/* MAIN CONTENT */}
            <main style={s.adminMain}>
                <header style={s.adminTopBar}>
                    <div>
                        <h2 style={{margin:0, fontSize:'28px', fontWeight:'950', letterSpacing:'-1px'}}>Mission Control</h2>
                        <p style={{margin:'5px 0 0 0', fontSize:'13px', color:'#555'}}>Autonomous price & duration protocol management.</p>
                    </div>
                    <div style={s.adminBadge}><ShieldCheck size={16} color="#10b981"/> Overlord Active</div>
                </header>

                <div style={s.cardAdminLg}>
                    <h3 style={s.cardTitle}>Registrasi Protokol Baru</h3>
                    
                    {/* INPUT HEADER (BARIS INJECT) */}
                    <div style={s.addInputRow}>
                        <div style={s.inputField}>
                            <label style={s.label}>NAMA PAKET</label>
                            <input style={s.inText} placeholder="Contoh: UNLOCKTOOL" value={newProdName} onChange={e=>setNewProdName(e.target.value)} />
                        </div>
                        <div style={s.inputField}>
                            <label style={s.label}>DURASI</label>
                            <input style={s.inText} placeholder="Contoh: 11 JAM" value={newProdDuration} onChange={e=>setNewProdDuration(e.target.value)} />
                        </div>
                        <div style={s.inputField}>
                            <label style={s.label}>HARGA (IDR)</label>
                            <input style={s.inText} type="number" placeholder="15000" value={newProdPrice} onChange={e=>setNewProdPrice(e.target.value)} />
                        </div>
                        <button onClick={handleAddProduct} style={s.btnInject} disabled={loading}>
                            <Zap size={16}/> INJECT
                        </button>
                    </div>

                    {/* TABLE HEADER */}
                    <div style={s.tableHeader}>
                        <span style={{flex: 2}}>NAMA PAKET (EDITABLE)</span>
                        <span style={{flex: 1.2}}>DURASI (EDITABLE)</span>
                        <span style={{flex: 1.5, textAlign:'right'}}>HARGA (IDR)</span>
                        <span style={{width: '60px', textAlign:'right'}}>OPSI</span>
                    </div>

                    {/* DAFTAR PAKET DENGAN FITUR EDIT */}
                    <div style={s.tableContainer}>
                        {products.length === 0 ? (
                            <div style={s.emptyState}>DATABASE KOSONG: Belum ada protokol yang di-inject.</div>
                        ) : products.map(p => (
                            <div key={p.id} style={s.rowAdmin}>
                                {/* EDIT NAMA */}
                                <div style={{...s.editCell, flex: 2}}>
                                    <Tag size={12} color="#3b82f6" />
                                    <input 
                                        style={s.pInput} 
                                        defaultValue={p.name} 
                                        onBlur={(e) => updateField(p.id, 'name', e.target.value)}
                                        placeholder="Nama Paket"
                                    />
                                </div>
                                
                                {/* EDIT DURASI */}
                                <div style={{...s.editCell, flex: 1.2}}>
                                    <Clock size={12} color="#facc15" />
                                    <input 
                                        style={s.pInput} 
                                        defaultValue={p.duration} 
                                        onBlur={(e) => updateField(p.id, 'duration', e.target.value)}
                                        placeholder="Durasi"
                                    />
                                </div>

                                {/* EDIT HARGA */}
                                <div style={{...s.editCellPrice, flex: 1.5}}>
                                    <CreditCard size={12} color="#10b981" />
                                    <input 
                                        style={s.pInputPrice} 
                                        defaultValue={p.price} 
                                        onBlur={(e) => updateField(p.id, 'price', e.target.value)}
                                    />
                                </div>

                                {/* TOMBOL HAPUS */}
                                <div style={{width: '60px', textAlign:'right'}}>
                                    <button onClick={() => {if(confirm("Hapus protokol ini selamanya?")) deleteDoc(doc(db, 'inventory', p.id))}} style={s.btnDel}>
                                        <Trash2 size={16}/>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}

// --- ULTIMATE COMMAND STYLES ---
const s = {
    adminContainer: { display:'flex', minHeight:'100vh', background:'#030303', color:'#fff', fontFamily:'Inter, sans-serif' },
    cyberGrid: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 0)', backgroundSize: '30px 30px', zIndex: 0, pointerEvents:'none' },
    sidebar: { width:'300px', background:'rgba(5, 5, 5, 0.9)', backdropFilter:'blur(30px)', borderRight:'1px solid #111', padding:'40px 25px', display:'flex', flexDirection:'column', zIndex:10 },
    logoSidebar: { fontSize:'20px', fontWeight:'950', display:'flex', alignItems:'center', gap:'12px', marginBottom:'60px', letterSpacing:'-1px' },
    logoIcon: { background:'linear-gradient(135deg, #3b82f6, #2563eb)', padding:'10px', borderRadius:'14px', boxShadow:'0 0 20px rgba(59, 130, 246, 0.3)' },
    menuList: { display:'flex', flexDirection:'column', gap:'10px', flex:1 },
    menuItem: { display:'flex', alignItems:'center', gap:'12px', padding:'18px 20px', background:'transparent', border:'none', color:'#444', fontWeight:'bold', borderRadius:'18px', cursor:'pointer', textAlign:'left', fontSize:'14px', transition:'0.3s' },
    menuItemActive: { display:'flex', alignItems:'center', gap:'12px', padding:'18px 20px', background:'rgba(59,130,246,0.1)', color:'#3b82f6', fontWeight:'900', borderRadius:'18px', borderLeft:'4px solid #3b82f6', fontSize:'14px' },
    logoutBtn: { padding:'16px', color:'#ef4444', background:'rgba(239,68,68,0.05)', border:'1px solid rgba(239,68,68,0.1)', borderRadius:'18px', cursor:'pointer', fontWeight:'900', display:'flex', gap:'10px', justifyContent:'center', fontSize:'13px' },
    
    adminMain: { flex:1, padding:'60px', position:'relative', zIndex:10 },
    adminTopBar: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'60px' },
    adminBadge: { background:'rgba(16,185,129,0.1)', color:'#10b981', padding:'10px 20px', borderRadius:'40px', fontSize:'11px', fontWeight:'900', border:'1px solid rgba(16,185,129,0.2)', letterSpacing:'1px' },
    
    cardAdminLg: { background:'rgba(15,15,15,0.6)', backdropFilter:'blur(40px)', padding:'40px', borderRadius:'35px', border:'1px solid #151515', boxShadow:'0 25px 50px -12px rgba(0,0,0,0.5)' },
    cardTitle: { margin:'0 0 30px 0', fontSize:'18px', fontWeight:'950', color:'#3b82f6', letterSpacing:'1px', textTransform:'uppercase' },
    
    // INPUT STYLES (REGISTRASI)
    addInputRow: { display:'flex', gap:'20px', marginBottom:'50px', background:'#000', padding:'25px', borderRadius:'25px', border:'1px solid #111', alignItems:'flex-end' },
    inputField: { display:'flex', flexDirection:'column', gap:'10px', flex:1 },
    label: { fontSize:'10px', fontWeight:'950', color:'#333', letterSpacing:'1.5px' },
    inText: { background:'rgba(255,255,255,0.02)', border:'1px solid #222', color:'#fff', padding:'15px 20px', borderRadius:'15px', outline:'none', fontSize:'14px', transition:'0.3s' },
    btnInject: { background:'linear-gradient(135deg, #3b82f6, #2563eb)', color:'#fff', border:'none', height:'50px', padding:'0 30px', borderRadius:'15px', fontWeight:'950', cursor:'pointer', display:'flex', alignItems:'center', gap:'10px', fontSize:'12px', letterSpacing:'1px', boxShadow:'0 10px 20px rgba(59, 130, 246, 0.2)' },
    
    // TABLE STYLES (LIST & EDIT)
    tableHeader: { display:'flex', padding:'0 25px 15px 25px', fontSize:'11px', fontWeight:'900', color:'#222', letterSpacing:'1.5px' },
    tableContainer: { display:'flex', flexDirection:'column', gap:'12px' },
    rowAdmin: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'18px 25px', background:'rgba(255,255,255,0.01)', borderRadius:'20px', border:'1px solid #111', transition:'0.3s' },
    
    editCell: { display:'flex', alignItems:'center', gap:'12px', borderRight:'1px solid #0d0d0d', marginRight:'15px' },
    pInput: { background:'transparent', border:'none', color:'#eee', fontSize:'15px', fontWeight:'700', outline:'none', width:'90%', padding:'5px 0' },
    
    editCellPrice: { display:'flex', alignItems:'center', gap:'10px', background:'rgba(0,0,0,0.4)', padding:'10px 20px', borderRadius:'15px', border:'1px solid #111' },
    pInputPrice: { background:'transparent', border:'none', color:'#10b981', fontWeight:'950', outline:'none', width:'100%', textAlign:'right', fontSize:'16px', fontFamily:'monospace' },
    
    btnDel: { background:'rgba(239,68,68,0.05)', border:'none', color:'#ef4444', padding:'12px', borderRadius:'14px', cursor:'pointer', transition:'0.3s' },
    emptyState: { textAlign:'center', color:'#333', padding:'60px 0', fontSize:'14px', fontWeight:'700', letterSpacing:'1px' },
    loadingScreen: { height:'100vh', background:'#030303', color:'#3b82f6', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'950', letterSpacing:'6px', fontSize:'13px' }
};