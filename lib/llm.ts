import 'server-only';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import type { LanguageModel } from 'ai';

// Resolves the active chat model from server-side env. Keys never reach the
// client — this module is import-guarded by `server-only`. The tool set and
// route logic are provider-agnostic (KTD-1/-7); only `model:` changes here.
type Provider = 'openrouter' | 'anthropic' | 'openai';

const PROVIDER = (process.env.CHAT_PROVIDER || 'openrouter') as Provider;

function need(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set (required for CHAT_PROVIDER=${PROVIDER})`);
  return v;
}

export function getModel(): LanguageModel {
  switch (PROVIDER) {
    case 'openrouter': {
      const openrouter = createOpenRouter({ apiKey: need('OPENROUTER_API_KEY') });
      // Low reasoning effort: this is a grounded tool-calling task — answers come
      // from the dataset tools, not the model's chain-of-thought — so heavy
      // reasoning just adds latency and eats the output-token budget.
      return openrouter(process.env.OPENROUTER_MODEL || 'deepseek/deepseek-v4-flash', {
        reasoning: { effort: 'low' },
      });
    }
    case 'anthropic': {
      const anthropic = createAnthropic({ apiKey: need('ANTHROPIC_API_KEY') });
      return anthropic(process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5');
    }
    case 'openai': {
      const openai = createOpenAI({ apiKey: need('OPENAI_API_KEY') });
      return openai(process.env.OPENAI_MODEL || 'gpt-5.1');
    }
    default:
      throw new Error(`Unknown CHAT_PROVIDER: ${PROVIDER}`);
  }
}
