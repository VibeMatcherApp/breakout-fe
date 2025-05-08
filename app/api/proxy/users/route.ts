import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Proxy request to external API
        const response = await fetch('http://43.207.147.137:3001/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        // Keep status code consistent
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('Error proxying user registration/login request:', error);
        return NextResponse.json(
            { error: 'An error occurred while processing the request' },
            { status: 500 }
        );
    }
} 