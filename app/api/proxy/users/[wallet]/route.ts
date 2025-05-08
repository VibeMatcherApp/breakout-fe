import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: { wallet: string } }) {
    try {
        const wallet = params.wallet;

        // Proxy request to external API
        const response = await fetch(`http://43.207.147.137:3001/api/users/${wallet}`);

        const data = await response.json();

        // Keep status code consistent
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('Error proxying user info request:', error);
        return NextResponse.json(
            { error: 'An error occurred while processing the request' },
            { status: 500 }
        );
    }
} 