import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    
    // We proxy the request to the CDN to bypass browser CORS policy
    const res = await fetch('https://service.polibatam.ac.id/cdn/api/upload', {
      method: 'POST',
      body: formData,
    });
    
    if (!res.ok) {
      return NextResponse.json({ error: 'CDN Upload failed' }, { status: res.status });
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Proxy Upload Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
