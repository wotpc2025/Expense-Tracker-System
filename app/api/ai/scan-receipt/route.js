import { NextResponse } from 'next/server';

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

function mapScanErrorToThai(errorText, statusCode) {
  const text = String(errorText || '').toLowerCase();

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

export async function POST(request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error: 'Missing GEMINI_API_KEY in environment',
          userMessage: 'ยังไม่ได้ตั้งค่า GEMINI_API_KEY ในระบบ',
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

    const bytes = await file.arrayBuffer();
    const base64Image = Buffer.from(bytes).toString('base64');

    const prompt = [
      'You are an OCR and finance parser assistant.',
      'Extract receipt information and return ONLY valid JSON.',
      'Required JSON keys:',
      '{',
      '  "expenseName": string | null,',
      '  "amount": number | null,',
      '  "description": string | null,',
      '  "category": string | null,',
      '  "date": string | null,',
      '  "confidence": number',
      '}',
      'Rules:',
      '- amount should be the final amount paid.',
      '- expenseName should be short and useful for transaction name.',
      '- confidence should be from 0 to 1.',
      '- return JSON only, no markdown.',
    ].join('\n');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: file.type,
                    data: base64Image,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      const userMessage = mapScanErrorToThai(errText, response.status);
      return NextResponse.json(
        { error: `Gemini API error: ${errText}`, userMessage },
        { status: 502 }
      );
    }

    const data = await response.json();
    const outputText = data?.candidates?.[0]?.content?.parts?.map((part) => part?.text || '').join('\n');
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

    return NextResponse.json({
      expenseName: parsed.expenseName || parsed.description || null,
      amount: typeof parsed.amount === 'number' ? parsed.amount : null,
      description: parsed.description || null,
      category: parsed.category || null,
      date: parsed.date || null,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : null,
    });
  } catch (error) {
    console.error('scan-receipt error:', error);
    return NextResponse.json(
      { error: 'Failed to scan receipt', userMessage: 'สแกนใบเสร็จไม่สำเร็จ กรุณาลองใหม่อีกครั้ง' },
      { status: 500 }
    );
  }
}
