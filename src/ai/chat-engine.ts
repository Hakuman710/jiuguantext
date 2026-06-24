import { streamChat } from './backends';
import { buildSystemPrompt } from '../utils/prompt-builder';
import type { AISettings, ChatMessage, GameSession, CharacterCard, WorldBook } from '../types';
import { db } from '../db/database';

interface SendMessageParams {
  userInput: string;
  settings: AISettings;
  character: CharacterCard;
  worlds: WorldBook[];
  session: GameSession;
  activeNpcIds?: string[];
  onToken: (token: string) => void;
  onDone: (fullText: string) => void;
  onError: (error: Error) => void;
  signal?: AbortSignal;
}

export async function sendMessage(params: SendMessageParams): Promise<void> {
  const { userInput, settings, character, worlds, session, activeNpcIds, onToken, onDone, onError, signal } =
    params;

  try {
    const items = await db.inventory.where('sessionId').equals(session.id).toArray();
    const quests = await db.quests.where('sessionId').equals(session.id).toArray();
    const recentMessages = await db.messages
      .where('sessionId')
      .equals(session.id)
      .sortBy('timestamp');

    const validMessages = recentMessages.filter((m) => m.content.trim() !== '');
    const lastUserMsg = validMessages.filter((m) => m.role === 'user').pop();

    // Merge lore entries from all worlds
    const allLoreEntries = worlds.flatMap((w) => w.loreEntries);

    const systemPrompt = await buildSystemPrompt({
      character,
      worlds,
      session,
      items,
      quests,
      loreEntries: allLoreEntries,
      lastMessage: lastUserMsg?.content,
      activeNpcIds,
    });

    const messages: { role: string; content: string }[] = [];
    messages.push({ role: 'system', content: systemPrompt });

    const historyMsgs = validMessages.slice(-40);
    for (const msg of historyMsgs) {
      messages.push({ role: msg.role, content: msg.content });
    }

    messages.push({ role: 'user', content: userInput });

    let fullResponse = '';

    await streamChat(
      settings,
      messages,
      {
        onToken: (token) => {
          fullResponse += token;
          onToken(token);
        },
        onDone: async (text) => {
          onDone(text);
        },
        onError,
      },
      signal
    );
  } catch (error) {
    onError(error instanceof Error ? error : new Error(String(error)));
  }
}
