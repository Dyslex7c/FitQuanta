import { Groq } from 'groq-sdk';
import { env } from './env';

let groqInstance: Groq | null = null;

export const groq = new Proxy({} as Groq, {
  get(target, prop, receiver) {
    if (!groqInstance) {
      const apiKey = env.GROQ_API_KEY;
      if (!apiKey) {
        throw new Error('GROQ_API_KEY is not configured in environment variables');
      }
      groqInstance = new Groq({
        apiKey,
      });
    }
    return Reflect.get(groqInstance, prop, receiver);
  },
});
