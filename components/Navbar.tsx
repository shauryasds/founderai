'use client';

import { useState, useEffect } from 'react';
import { createClient } from '../utils/supabase/client';
import type { User } from '@supabase/supabase-js';
import Link from 'next/link';

export default function Navbar() {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        async function fetchUser() {
            const supabase = createClient();
            const {
                data: { user },
            } = await supabase.auth.getUser();
            setUser(user);
        }
        fetchUser();
    }, []);

    async function loginWithGoogle() {
        const supabase = createClient();
        await supabase.auth.signInWithOAuth({
            provider: 'google',

        });
    }

    return (

        <nav className="w-full px-6 md:px-10 pt-10 text-md font-semibold bg-transparent backdrop-blur-sm text-white fixed top-0 z-50 shadow-md">
            <div className="max-w-7xl mx-auto flex justify-around items-center">
                {/* Logo */}
                <Link href={'/'} className="text-2xl font-bold tracking-tight">
                    FounderAI
                </Link>



              
            </div >



        </nav >
    );
}
