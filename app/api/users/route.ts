import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Check if request body contains required fields
        if (!body.wallet_address) {
            return NextResponse.json(
                { error: 'wallet_address is required' },
                { status: 400 }
            );
        }

        // Forward request to remote API
        const response = await fetch('http://43.207.147.137:3001/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorData = await response.json();
            return NextResponse.json(
                errorData,
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        console.error('Error processing user data:', error);
        return NextResponse.json(
            { error: 'An error occurred while processing the request' },
            { status: 500 }
        );
    }
} 