import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null); // 'admin' atau 'customer'
    const [loading, setLoading] = useState(true);

    // !!! GANTI DENGAN EMAIL SAKTI KAMU !!!
    const ADMIN_EMAIL = "denalyjr@gmail.com"; 

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (u) => {
            if (u) {
                setUser(u);
                try {
                    // Cek identitas di Database
                    const userRef = doc(db, 'users', u.uid);
                    const userSnap = await getDoc(userRef);

                    if (userSnap.exists()) {
                        setRole(userSnap.data().role);
                    } else {
                        // Jika baru pertama kali login, otomatis tentukan rolenya
                        const newRole = u.email === ADMIN_EMAIL ? 'admin' : 'customer';
                        await setDoc(userRef, {
                            uid: u.uid,
                            email: u.email,
                            role: newRole,
                            createdAt: new Date()
                        });
                        setRole(newRole);
                    }
                } catch (error) {
                    console.error("Gagal verifikasi role:", error);
                }
            } else {
                setUser(null);
                setRole(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, role, isAdmin: role === 'admin', loading }}>
            {/* Jangan tampilkan web sebelum mesin selesai mengecek siapa yang login */}
            {!loading ? children : (
                <div style={{ height: '100vh', background: '#000', color: '#3b82f6', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif', fontWeight: 'bold', letterSpacing: '2px' }}>
                    INITIALIZING CORE SYSTEM...
                </div>
            )}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);