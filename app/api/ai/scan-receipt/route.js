import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { checkAndTrackReceiptScanRateLimit } from '@/lib/securityTelemetry';

const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'qwen/qwen2.5-vl-72b-instruct';

function mapScanErrorToThai(errorText, statusCode) {
  const text = String(errorText || '').toLowerCase();

  if (statusCode === 402 || text.includes('insufficient') || text.includes('credit')) {
    return 'เครดิต OpenRouter ไม่เพียงพอ กรุณาเติมเครดิตก่อนใช้งาน';
  }

  if (statusCode === 429 || text.includes('resource_exhausted') || text.includes('quota')) {
    const retryMatch = String(errorText || '').match(/retry in\s+([\d.]+)s/i);
    const retrySeconds = retryMatch?.[1] ? Math.ceil(Number(retryMatch[1])) : null;
    if (retrySeconds) {
      return `โควต้า AI เต็มชั่วคราว กรุณาลองใหม่อีกประมาณ ${retrySeconds} วินาที`;
    }
    return 'โควต้า AI เต็มชั่วคราว กรุณาลองใหม่อีกสักครู่';
  }

  if (text.includes('api key') || text.includes('permission_denied') || text.includes('unauthenticated')) {
    return 'ตั้งค่า API Key ไม่ถูกต้องหรือยังไม่มีสิทธิ์ใช้งาน';
  }

  if (statusCode === 400 || text.includes('invalid_argument')) {
    return 'ไม่สามารถอ่านรูปนี้ได้ กรุณาลองรูปที่ชัดขึ้น';
  }

  if (statusCode >= 500) {
    return 'ระบบ AI ขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้ง';
  }

  return 'สแกนใบเสร็จไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';
}

function extractJson(text) {
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    // Continue to fallback parser.
  }

  const fenced = text.match(/```json\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) {
    try {
      return JSON.parse(fenced[1]);
    } catch {
      // Continue to fallback parser.
    }
  }

  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    const candidate = text.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch {
      return null;
    }
  }

  return null;
}

function getRequestIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'unknown';
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  return 'unknown';
}

export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', userMessage: 'กรุณาเข้าสู่ระบบก่อนใช้งาน' },
        { status: 401 }
      );
    }

    const contentType = String(request.headers.get('content-type') || '').toLowerCase();
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Invalid content type', userMessage: 'รูปแบบข้อมูลไม่ถูกต้อง' },
        { status: 415 }
      );
    }

    const ipAddress = getRequestIp(request);
    const rateLimit = checkAndTrackReceiptScanRateLimit(ipAddress);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          userMessage: `มีการใช้งานถี่เกินไป กรุณาลองใหม่ใน ${rateLimit.retryAfterSeconds} วินาที`,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfterSeconds),
          },
        }
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error: 'Missing OPENROUTER_API_KEY in environment',
          userMessage: 'ยังไม่ได้ตั้งค่า OPENROUTER_API_KEY ในระบบ',
        },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('receipt');

    if (!file || typeof file === 'string') {
      return NextResponse.json(
        { error: 'Receipt image is required', userMessage: 'กรุณาเลือกรูปใบเสร็จก่อน' },
        { status: 400 }
      );
    }

    if (!file.type?.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Please upload an image file', userMessage: 'รองรับเฉพาะไฟล์รูปภาพเท่านั้น' },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Image too large', userMessage: 'ขนาดรูปต้องไม่เกิน 5MB' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const base64Image = Buffer.from(bytes).toString('base64');
    const imageDataUrl = `data:${file.type};base64,${base64Image}`;

    const systemPrompt = [
      'You are an OCR and finance parser assistant.',
      'Extract receipt information and return ONLY valid JSON.',
      'Required JSON keys:',
      '{',
      '  "expenseName": string | null,',
      '  "amount": number | null,',
      '  "description": string | null,',
      '  "category": string | null,',
      '  "date": string | null,',
      '  "confidence": number,',
      '  "lineItems": [{ "name": string, "amount": number }]',
      '}',
      'Rules:',
      '- amount should be the final amount paid.',
      '- expenseName should be short and useful for transaction name.',
      '- confidence should be from 0 to 1.',
      '- lineItems should include every purchased item that has a non-zero price.',
      '- if receipt has combo/set with child lines at 0.00, keep only priced parent item.',
      '- return JSON only, no markdown.',
    ].join('\n');

    const response = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          'X-Title': 'Expense Tracker System',
        },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Read this receipt image and extract the fields.',
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: imageDataUrl,
                  },
                },
              ],
            },
          ],
          temperature: 0.1,
          max_tokens: 500,
          response_format: {
            type: 'json_object',
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      const userMessage = mapScanErrorToThai(errText, response.status);
      return NextResponse.json(
        { error: `OpenRouter API error: ${errText}`, userMessage },
        { status: 502 }
      );
    }

    const data = await response.json();
    const outputText = data?.choices?.[0]?.message?.content;
    const parsed = extractJson(outputText);

    if (!parsed) {
      return NextResponse.json(
        {
          error: 'Could not parse AI response as JSON',
          userMessage: 'อ่านข้อมูลจากใบเสร็จไม่สำเร็จ กรุณาลองรูปที่คมชัดขึ้น',
        },
        { status: 500 }
      );
    }

    const lineItems = Array.isArray(parsed?.lineItems)
      ? parsed.lineItems
          .map((item) => ({
            name: String(item?.name || '').trim(),
            amount: Number(item?.amount || 0),
          }))
          .filter((item) => item.name && Number.isFinite(item.amount) && item.amount > 0)
          .slice(0, 50)
      : [];

    return NextResponse.json({
      expenseName: parsed.expenseName || parsed.description || null,
      amount: typeof parsed.amount === 'number' ? parsed.amount : null,
      description: parsed.description || null,
      category: parsed.category || null,
      date: parsed.date || null,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : null,
      lineItems,
    });
  } catch (error) {
    console.error('scan-receipt error:', error);
    return NextResponse.json(
      { error: 'Failed to scan receipt', userMessage: 'สแกนใบเสร็จไม่สำเร็จ กรุณาลองใหม่อีกครั้ง' },
      { status: 500 }
    );
  }
}
