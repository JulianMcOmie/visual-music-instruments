import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { InstrumentConfig } from '@/types/instrument';

const SYSTEM_PROMPT = `You are an expert at modifying visual instrument configurations. You will receive a current instrument config and an edit request. Modify the config according to the request while preserving the overall structure.

Common edits:
- "make lines thicker" → increase strokeWidth in styling and element attrs
- "add more rings/circles" → add new elements to the elements array
- "change color to blue" → update stroke/fill colors
- "more symmetry" → increase defaultSymmetry or symmetry in keyMappings
- "spread out more" → adjust element positions (increase radii, spacing)

IMPORTANT:
- Preserve all existing key mappings unless specifically asked to change them
- Keep the same element IDs when modifying existing elements
- Return the COMPLETE updated config, not just the changes
- Respond with ONLY valid JSON - no explanation, no markdown blocks`;

export async function POST(request: NextRequest) {
  try {
    const { prompt, currentConfig } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    if (!currentConfig) {
      return NextResponse.json({ error: 'Current config is required' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
    }

    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Current instrument config:
\`\`\`json
${JSON.stringify(currentConfig, null, 2)}
\`\`\`

Edit request: "${prompt}"

Return the updated config:`,
        },
      ],
    });

    const textContent = message.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return NextResponse.json({ error: 'No response from Claude' }, { status: 500 });
    }

    let config: InstrumentConfig;
    try {
      config = JSON.parse(textContent.text);
    } catch {
      const jsonMatch = textContent.text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        config = JSON.parse(jsonMatch[1].trim());
      } else {
        const jsonStart = textContent.text.indexOf('{');
        const jsonEnd = textContent.text.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) {
          config = JSON.parse(textContent.text.slice(jsonStart, jsonEnd + 1));
        } else {
          throw new Error('Could not parse response');
        }
      }
    }

    if (!config.name || !config.elements || !config.keyMappings) {
      return NextResponse.json({ error: 'Invalid config returned' }, { status: 500 });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error editing instrument:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to edit instrument' },
      { status: 500 }
    );
  }
}
