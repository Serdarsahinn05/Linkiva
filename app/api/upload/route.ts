import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename') || 'avatar.jpg';

    try {
        const blob = await put(filename, request.body!, {
            access: 'public',
            addRandomSuffix: true,
            // allowOverwrite: true,
        });

        return Response.json(blob);
    } catch (error) {
        console.error("Vercel Blob hatası:", error);
        return Response.json({ error: "Dosya yüklenemedi" }, { status: 500 });
    }
}