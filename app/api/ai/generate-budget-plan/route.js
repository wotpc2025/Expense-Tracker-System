import { NextResponse } from 'next/server';

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

function parseJson(text) {
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    // Keep trying with fallback parser.
  }

  const fenced = text.match(/```json\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) {
    try {
      return JSON.parse(fenced[1]);
    } catch {
      // Keep trying with fallback parser.
    }
  }

  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first >= 0 && last > first) {
    try {
      return JSON.parse(text.slice(first, last + 1));
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
      return NextResponse.json({ error: 'Missing GEMINI_API_KEY in environment' }, { status: 500 });
    }

    const body = await request.json();
    const promptInput = body?.prompt?.trim();
    const goal = body?.goal?.trim();
    const monthlyIncome = body?.monthlyIncome;
    const locale = body?.locale || 'th-TH';
    const userPrompt = promptInput || [
      goal ? `Goal: ${goal}` : null,
      monthlyIncome ? `Monthly income: ${monthlyIncome}` : null,
    ].filter(Boolean).join('\n');

    if (!userPrompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const prompt = [
      'You are an AI finance planning assistant.',
      'Generate one practical starter budget and 3-6 starter expenses from user input.',
      'Return ONLY JSON with this exact shape:',
      '{',
      '  "budgetName": string,',
      '  "budgetAmount": number,',
      '  "icon": string,',
      '  "starterExpenses": [{ "name": string, "amount": number }],',
      '  "notes": string',
      '}',
      'Rules:',
      '- budgetAmount must be realistic and > 0.',
      '- starterExpenses amounts must be positive numbers.',
      '- keep budgetName short.',
      '- icon must be a single emoji.',
      '- return JSON only and no markdown.',
      '',
      `Locale: ${locale}`,
      `User prompt: ${userPrompt}`,
    ].join('\n');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ error: `Gemini API error: ${errText}` }, { status: 502 });
    }

    const data = await response.json();
    const outputText = data?.candidates?.[0]?.content?.parts?.map((part) => part?.text || '').join('\n');
    const parsed = parseJson(outputText);

    if (!parsed) {
      return NextResponse.json({ error: 'Could not parse AI response' }, { status: 500 });
    }

    return NextResponse.json({
      budgetName: parsed.budgetName || 'AI Budget Plan',
      budgetAmount: Number(parsed.budgetAmount || 0),
      icon: parsed.icon || '💰',
      starterExpenses: Array.isArray(parsed.starterExpenses) ? parsed.starterExpenses : [],
      notes: parsed.notes || null,
    });
  } catch (error) {
    console.error('generate-budget-plan error:', error);
    return NextResponse.json({ error: 'Failed to generate budget plan' }, { status: 500 });
  }
}
