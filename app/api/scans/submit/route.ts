import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { scanResult } = await request.json();

        console.log('Received scan result:', scanResult);

        // Handle scan result - assuming scanResult is a wallet address
        // Actual operation is not performed here as friend adding logic has been moved to api.ts

        // Record timestamp of scan result reception
        const processedResult = {
            scanId: `scan-${Date.now()}`,
            scanResult,
            processedAt: new Date().toISOString(),
            status: 'success',
            message: 'Scan result received, processing friend request addition'
        };

        return NextResponse.json({
            success: true,
            data: processedResult
        });
    } catch (error) {
        console.error('Error processing scan result:', error);
        return NextResponse.json(
            { error: 'Unable to process scan result', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
} 