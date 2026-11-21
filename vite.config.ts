import { defineConfig } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';

const PUBLIC_ROOT = resolve(import.meta.dirname, 'public');
const SAVE_TARGETS = new Set([
  'assets/config/game-config.json',
  'assets/config/input-map.json',
  'assets/config/actor-bounds.json',
  'assets/config/object-metadata.json',
  'assets/config/background-layer-offsets.json',
  'assets/levels/index.json',
  'assets/levels/level-1.json',
  'assets/levels/level-2.json',
  'assets/levels/level-3.json',
  'assets/levels/editor-playground.json',
  'configs/character-gym.json',
  'configs/background-gym.json',
  'configs/tile-gym.json',
  'configs/fighter-playground.json'
]);

const VOICE_WAV_CACHE = new Map<string, string>();
let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  geminiClient ??= new GoogleGenAI({
    apiKey,
    apiVersion: 'v1beta',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
  return geminiClient;
}

function readRequestBody(request: IncomingMessage): Promise<string> {
  return new Promise((resolveBody, reject) => {
    let body = '';

    request.setEncoding('utf8');
    request.on('data', (chunk) => {
      body += chunk;
    });
    request.on('end', () => resolveBody(body));
    request.on('error', reject);
  });
}

function sendJson(response: ServerResponse, statusCode: number, payload: object): void {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify(payload));
}

function resolveSaveTarget(target: unknown): string | null {
  if (typeof target !== 'string' || !SAVE_TARGETS.has(target)) {
    return null;
  }

  const outputPath = resolve(PUBLIC_ROOT, target);

  return outputPath.startsWith(PUBLIC_ROOT) ? outputPath : null;
}

async function handleVoiceRequest(
  request: IncomingMessage,
  response: ServerResponse,
  next: () => void
): Promise<void> {
  if (request.method !== 'POST') {
    next();
    return;
  }

  const ai = getGeminiClient();
  if (!ai) {
    sendJson(response, 200, { ok: false, reason: 'no_api_key' });
    return;
  }

  try {
    const body = await readRequestBody(request);
    const parsed = JSON.parse(body) as {
      text?: unknown;
      style?: unknown;
      voiceName?: unknown;
    };
    const text = typeof parsed.text === 'string' ? parsed.text.trim() : '';
    const style = typeof parsed.style === 'string' ? parsed.style.trim() : 'Intense anime battle cry';
    const voiceName = typeof parsed.voiceName === 'string' ? parsed.voiceName.trim() : 'Fenrir';

    if (!text) {
      sendJson(response, 400, { ok: false, error: 'Missing text' });
      return;
    }

    const cacheKey = `${voiceName}::${style}::${text}`;
    const cached = VOICE_WAV_CACHE.get(cacheKey);
    if (cached) {
      sendJson(response, 200, { ok: true, audioBase64: cached, mimeType: 'audio/wav' });
      return;
    }

    const ttsResponse = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text,
              speechMetadata: { style }
            }
          ]
        }
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName }
          }
        }
      }
    });

    const audioBase64 = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioBase64) {
      sendJson(response, 200, { ok: false, reason: 'empty_audio' });
      return;
    }

    VOICE_WAV_CACHE.set(cacheKey, audioBase64);
    sendJson(response, 200, { ok: true, audioBase64, mimeType: 'audio/wav' });
  } catch (error) {
    sendJson(response, 200, {
      ok: false,
      reason: error instanceof Error ? error.message : 'tts_failed'
    });
  }
}

export default defineConfig({
  plugins: [
    {
      name: 'starter-debug-json-writer',
      configureServer(server) {
        server.middlewares.use('/api/voice', (req, res, next) => {
          void handleVoiceRequest(req, res, next);
        });

        server.middlewares.use('/__debug/save-json', async (request, response, next) => {
          if (request.method !== 'PUT' && request.method !== 'POST') {
            next();
            return;
          }

          try {
            const body = await readRequestBody(request);
            const parsed = JSON.parse(body) as { target?: unknown; payload?: unknown };
            const outputPath = resolveSaveTarget(parsed.target);

            if (!outputPath) {
              sendJson(response, 400, { ok: false, error: 'Target is not allowlisted' });
              return;
            }

            if (!parsed.payload || typeof parsed.payload !== 'object') {
              sendJson(response, 400, { ok: false, error: 'Expected object payload' });
              return;
            }

            await mkdir(dirname(outputPath), { recursive: true });
            await writeFile(outputPath, `${JSON.stringify(parsed.payload, null, 2)}\n`);
            sendJson(response, 200, { ok: true, path: outputPath });
          } catch (error) {
            sendJson(response, 500, {
              ok: false,
              error: error instanceof Error ? error.message : 'Unknown save error'
            });
          }
        });
      },
      configurePreviewServer(server) {
        server.middlewares.use('/api/voice', (req, res, next) => {
          void handleVoiceRequest(req, res, next);
        });
      }
    }
  ],
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true
  }
});
