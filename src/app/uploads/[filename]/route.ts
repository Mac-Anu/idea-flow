import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest, { params }: { params: Promise<{ filename: string }> }) {
    try {
        const resolvedParams = await params;
        const filePath = path.join(process.cwd(), 'public', 'uploads', resolvedParams.filename);
        const buffer = await readFile(filePath);
        
        let contentType = 'image/jpeg';
        if (resolvedParams.filename.endsWith('.png')) contentType = 'image/png';
        else if (resolvedParams.filename.endsWith('.gif')) contentType = 'image/gif';
        else if (resolvedParams.filename.endsWith('.webp')) contentType = 'image/webp';
        else if (resolvedParams.filename.endsWith('.svg')) contentType = 'image/svg+xml';

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (e) {
        return new NextResponse('Not Found', { status: 404 });
    }
}
