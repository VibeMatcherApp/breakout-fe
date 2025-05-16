import React from 'react';
import Image from 'next/image';
import { Viga } from 'next/font/google';

interface HeaderProps {
    title?: string;
}

const viga = Viga({ subsets: ['latin'], weight: '400' });

const Header: React.FC<HeaderProps> = ({ title = "VibeMatcher" }) => (
    <div className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-4 py-5 bg-[#001d25] shadow-sm">
        <div className="flex items-center">
            <Image src="/VM.jpg" alt="logo" width={70} height={70} className="mr-2" />
            <span className={`${viga.className} text-2xl font-bold bg-gradient-to-r from-teal-500 to-emerald-400 bg-clip-text text-transparent`}>
                {title}
            </span>
        </div>
        <div />
    </div>
);

export default Header;
