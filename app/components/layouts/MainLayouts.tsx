import React, { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface MainLayoutProps {
    children: ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 md:ml-64 bg-gray-100 pb-16 md:pb-0">
                {children}
            </main>
        </div>
    );
};