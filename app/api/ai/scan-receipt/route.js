/**
 * app/api/ai/scan-receipt/route.js — AI Receipt OCR Endpoint
 *
 * POST /api/ai/scan-receipt
 * Content-Type: multipart/form-data  (field name: 'receipt')
 *
 * Pipeline:
 *   1. Auth check          — requires valid Clerk session (userId)
 *   2. Content-type guard  — must be multipart/form-data
 *   3. Rate limit check    — 5 requests per 5 minutes per IP (securityTelemetry.js)
 *   4. File validation     — image only, max 10 MB
 *   5. Image encoding      — converts to base64 data URL
 *   6. OpenRouter call     — sends image + extraction prompt to the VL model
 *   7. JSON extraction     — parses model response (handles markdown fences)
 *   8. Response shape      — returns { expenseName, amount, lineItems[] }
 *
 * Environment variables:
 *   OPENROUTER_MODEL     — AI model ID (default: qwen/qwen2.5-vl-72b-instruct)
 *   OPENROUTER_API_KEY   — API key for OpenRouter
 *
 * Error handling:
 *   - mapScanErrorToThai() maps provider error codes to human-readable messages
 *   - extractJson() handles non-standard JSON responses (markdown fences, etc.)
 */
import { NextResponse } from 'next/server';

const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'qwen/qwen2.5-vl-72b-instruct';

function mapScanErrorToThai(errorText, statusCode) {
  const text = String(errorText || '').toLowerCase();

  // Billing-related responses should be surfaced as an actionable credit message.
  if (statusCode === 402 || text.includes('insufficient') || text.includes('credit')) {
    return 'OpenRouter credit is insufficient. Please top up and try again.';
  }

  // Quota/rate-limit failures may include retry seconds from provider text.
  if (statusCode === 429 || text.includes('resource_exhausted') || text.includes('quota')) {
    const retryMatch = String(errorText || '').match(/retry in\s+([\d.]+)s/i);
    const retrySeconds = retryMatch?.[1] ? Math.ceil(Number(retryMatch[1])) : null;
    if (retrySeconds) {
      return `AI quota is temporarily exhausted. Please retry in about ${retrySeconds} seconds.`;
    }
    return 'AI quota is temporarily exhausted. Please try again shortly.';
  }

  if (text.includes('api key') || text.includes('permission_denied') || text.includes('unauthenticated')) {
    return 'API key is invalid or permission is not granted.';
  }

  if (statusCode === 400 || text.includes('invalid_argument')) {
    return 'This image could not be processed. Please upload a clearer receipt image.';
  }

  if (statusCode >= 500) {
    return 'AI service is temporarily unavailable. Please try again.';
  }

  return 'Receipt scan failed. Please try again.';
}

function extractJson(text) {
  if (!text) return null;

  // First attempt: strict JSON response.
  try {
    return JSON.parse(text);
  } catch {
    // Continue to fallback parser.
  }

  // Second attempt: parse JSON inside markdown fence.
  const fenced = text.match(/```json\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) {
    try {
      return JSON.parse(fenced[1]);
    } catch {
      // Continue to fallback parser.
    }
  }

  // Final attempt: extract by first/last brace pair.
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
  // Respect proxy headers first, then fallback to direct header.
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
        { error: 'Unauthorized', userMessage: 'Please sign in before using receipt scan.' },
        { status: 401 }
      );
    }

    // Accept only multipart uploads to avoid unsupported payload shapes.
    const contentType = String(request.headers.get('content-type') || '').toLowerCase();
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Invalid content type', userMessage: 'Invalid request format. Please upload using form-data.' },
        { status: 415 }
      );
    }

    // Lightweight in-memory throttling by client IP.
    const ipAddress = getRequestIp(request);
    const rateLimit = checkAndTrackReceiptScanRateLimit(ipAddress);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          userMessage: `Too many requests. Please retry in ${rateLimit.retryAfterSeconds} seconds.`,
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
          userMessage: 'OPENROUTER_API_KEY is missing in server environment.',
        },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('receipt');

    if (!file || typeof file === 'string') {
      return NextResponse.json(
        { error: 'Receipt image is required', userMessage: 'Please select a receipt image first.' },
        { status: 400 }
      );
    }

    if (!file.type?.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Please upload an image file', userMessage: 'Only image files are supported.' },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Image too large', userMessage: 'Image size must be 5MB or less.' },
        { status: 400 }
      );
    }

    // Encode image as Data URL because OpenRouter multimodal input expects image_url.
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
          userMessage: 'Could not read receipt data. Please upload a clearer image.',
        },
        { status: 500 }
      );
    }

    // Normalize and cap line items to keep UI/render payload predictable.
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
      { error: 'Failed to scan receipt', userMessage: 'Receipt scan failed. Please try again.' },
      { status: 500 }
    );
  }
}
