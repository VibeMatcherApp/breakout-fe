import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { walletAddress, username } = await request.json();

        // This should connect to your backend service or database
        // Currently using mock data
        const mockUser = {
            id: 1,
            displayName: username || `User${Math.floor(Math.random() * 1000)}`,
            walletAddress,
            createdAt: new Date().toISOString(),
        };

        return NextResponse.json({
            success: true,
            user: mockUser
        });
    } catch (error) {
        console.error('Error connecting user:', error);
        return NextResponse.json(
            { error: 'Failed to connect user' },
            { status: 500 }
        );
    }
} 