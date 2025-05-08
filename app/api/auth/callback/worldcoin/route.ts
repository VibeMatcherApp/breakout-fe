import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    console.log('WorldCoin callback received:', { code, state });

    if (!code) {
        return NextResponse.redirect(new URL('/?error=missing_code', request.url));
    }

    try {
        // Here you can add code to communicate with backend API to verify WorldCoin identity
        // const response = await fetch('http://43.207.147.137:3001/api/auth/worldcoin', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ code, state })
        // });
        //
        // if (!response.ok) {
        //   throw new Error('Failed to verify WorldCoin identity');
        // }

        // Redirect to discover page
        return NextResponse.redirect(new URL('/?view=discover', request.url));
    } catch (error) {
        console.error('Error processing WorldCoin callback:', error);
        return NextResponse.redirect(new URL('/?error=auth_failed', request.url));
    }
} 