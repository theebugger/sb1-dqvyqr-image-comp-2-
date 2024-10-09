import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

function sanitizeFilename(filename: string): string {
  // Remove any characters that aren't alphanumeric, dots, dashes, or underscores
  return filename.replace(/[^a-zA-Z0-9.-_]/g, '_');
}

export async function POST(req: NextRequest) {
  if (req.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const formData = await req.formData();
    const image = formData.get('image') as File | null;
    const percentageStr = formData.get('percentage') as string | null;

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const percentage = percentageStr ? parseInt(percentageStr, 10) : 33;
    if (isNaN(percentage) || percentage <= 0 || percentage > 100) {
      return NextResponse.json({ error: 'Invalid percentage value' }, { status: 400 });
    }

    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const metadata = await sharp(buffer).metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error('Unable to get image dimensions');
    }

    const resizedImageBuffer = await sharp(buffer)
      .resize({ 
        width: Math.round(metadata.width * (percentage / 100)),
        height: Math.round(metadata.height * (percentage / 100)),
        fit: 'contain'
      })
      .toBuffer();

    const sanitizedFilename = sanitizeFilename(image.name);

    return new NextResponse(resizedImageBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Disposition': `attachment; filename="resized_${sanitizedFilename}"`,
      },
    });
  } catch (error) {
    console.error('Error processing image:', error);
    let errorMessage = 'An unexpected error occurred while processing the image.';
    let errorDetails = '';

    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.stack || '';
    }

    return NextResponse.json({ 
      error: 'Error processing image', 
      message: errorMessage,
      details: errorDetails
    }, { status: 500 });
  }
}