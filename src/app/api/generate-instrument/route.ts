import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { InstrumentConfig } from '@/types/instrument';

const SYSTEM_PROMPT = `You are an expert visual artist and instrument designer. Create unique, beautiful visual instruments that respond to keyboard input.

You will generate a JSON configuration for a visual instrument rendered as SVG. Be creative - use any SVG elements and shapes you want.

Canvas: 800x800 pixels, center at (400, 400)

SVG elements you can use (any valid SVG):
- path: Complex shapes with d attribute (bezier curves, arcs, etc.)
- circle, ellipse, rect, polygon, polyline, line
- Use transforms, gradients, patterns - anything SVG supports

Keyboard layout for mapping:
Row 1: Q W E R T Y U I O P (10 keys, outer/top elements)
Row 2: A S D F G H J K L (9 keys, middle elements)
Row 3: Z X C V B N M (7 keys, inner/bottom elements)

Design freely! Create:
- Organic flowing shapes
- Geometric patterns
- Abstract art
- Mandalas, spirals, waves
- Whatever fits the user's vision

Each element needs a unique id. Map keyboard keys to element ids.
Elements can have symmetry (replicated around center).

RESPOND WITH ONLY VALID JSON - no explanation, no markdown blocks:

{
  "name": "string",
  "description": "string",
  "canvas": { "width": 800, "height": 800, "centerX": 400, "centerY": 400 },
  "elements": [
    { "id": "unique_id", "tag": "svg_tag", "attrs": { "attr": "value", ... } }
  ],
  "styling": {
    "activeStroke": "#hex",
    "activeFill": "#hex",
    "inactiveOpacity": 0.2,
    "activeGlow": "rgba(...)",
    "strokeWidth": 2
  },
  "keyMappings": {
    "q": { "elementIds": ["id1"], "symmetry": 6 },
    ...
  },
  "symmetryOptions": [3, 4, 6, 8, 12],
  "defaultSymmetry": 6
}`;

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY not configured' },
        { status: 500 }
      );
    }

    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Create a visual instrument: "${prompt}"`,
        },
      ],
    });

    const textContent = message.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return NextResponse.json(
        { error: 'No text response from Claude' },
        { status: 500 }
      );
    }

    let config: InstrumentConfig;
    try {
      // Try direct parse first
      config = JSON.parse(textContent.text);
    } catch {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = textContent.text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        config = JSON.parse(jsonMatch[1].trim());
      } else {
        // Try to find JSON object in the response
        const jsonStart = textContent.text.indexOf('{');
        const jsonEnd = textContent.text.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) {
          config = JSON.parse(textContent.text.slice(jsonStart, jsonEnd + 1));
        } else {
          throw new Error('Could not find JSON in response');
        }
      }
    }

    if (!config.name || !config.elements || !config.keyMappings) {
      return NextResponse.json(
        { error: 'Invalid instrument configuration - missing required fields' },
        { status: 500 }
      );
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error generating instrument:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate instrument' },
      { status: 500 }
    );
  }
}
