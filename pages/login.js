import React, { useEffect } from 'react';
import { auth, googleProvider } from '../lib/firebase';
import { signInWithPopup } from 'firebase/auth';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { Cpu, Globe } from 'lucide-react';

export default function SmartLogin() {
    const { user, isAdmin } = useAuth();
    const router = useRouter();

    // Jika sudah login, otomatis pindahkan ke halaman yang sesuai
    useEffect(() => {
        if (user) {
            router.push('/');
        }
    }, [user, router]);

    const handleGoogleLogin = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (err) {
            alert("Akses Gagal: " + err.message);
        }
    };

    return (
        <div style={s.container}>
            <div style={s.card}>
                <div style={s.logoBox}><Cpu size={30} color="#3b82f6" /></div>
                <h1 style={s.title}>UT<span style={{color:'#3b82f6'}}>PRO</span> PORTAL</h1>
                <p style={s.sub}>Otentikasi Identitas Anda</p>

                <button onClick={handleGoogleLogin} style={s.btnGoogle}>
                    <Globe size={18}/> LANJUTKAN DENGAN GOOGLE
                </button>
                <p style={s.footer}>Sistem mendeteksi otoritas Admin dan Pembeli secara otomatis.</p>
            </div>
        </div>
    );
}

const s = {
    container: { background:'#000', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontFamily:'Inter, sans-serif' },
    card: { background:'#0a0a0a', padding:'50px', borderRadius:'30px', border:'1px solid #1a1a1a', textAlign:'center', width:'100%', maxWidth:'400px' },
    logoBox: { background:'#111', width:'60px', height:'60px', borderRadius:'15px', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px auto', border:'1px solid #222' },
    title: { fontSize:'28px', fontWeight:'950', margin:'0 0 5px 0', letterSpacing:'-1px' },
    sub: { fontSize:'13px', color:'#666', marginBottom:'40px' },
    btnGoogle: { width:'100%', padding:'16px', background:'#fff', color:'#000', border:'none', borderRadius:'15px', fontWeight:'900', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px' },
    footer: { fontSize:'10px', color:'#444', marginTop:'30px', fontWeight:'bold' }
};