import { useEffect, useRef, useState } from 'react';
import { useChatStore } from '../../stores/chat-store';
import { ChatBubble } from './ChatBubble';
import { ChatInput } from './ChatInput';
import { useCharacterStore } from '../../stores/character-store';
import { useSettingsStore } from '../../stores/settings-store';
import { useWorldStore } from '../../stores/world-store';
import { sendMessage } from '../../ai/chat-engine';
import { useAppStore } from '../../stores/app-store';
import { parseRPGChanges } from '../../utils/rpg-parser';
import { ChangeConfirmation } from '../game/ChangeConfirmation';
import { Save, LogOut } from 'lucide-react';
import type { RPGChange } from '../../types';

export function ChatWindow() {
  const {
    messages,
    session,
    isStreaming,
    addMessage,
    addToStore,
    appendToLast,
    finalizeStreaming,
    setStreaming,
    saveAndExit,
  } = useChatStore();
  const characters = useCharacterStore((s) => s.characters);
  const primaryChar = characters.find((c) => c.id === session?.primaryCharacterId);
  const allWorldBooks = useWorldStore((s) => s.worlds);
  const worlds = (session?.worldIds || [])
    .map((id) => allWorldBooks.find((w) => w.id === id))
    .filter((w): w is NonNullable<typeof w> => w != null);
  const settings = useSettingsStore((s) => s.settings);
  const addToast = useAppStore((s) => s.addToast);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [pendingChanges, setPendingChanges] = useState<RPGChange[]>([]);
  const [appliedNote, setAppliedNote] = useState<string | null>(null);
  const [activeNpcIds, setActiveNpcIds] = useState<string[]>([]);

  // Get NPC character cards
  const npcChars = (session?.npcCharacterIds || [])
    .map((id) => characters.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => c != null);

  const toggleNpc = (id: string) => {
    setActiveNpcIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (input: string) => {
    if (!settings || !primaryChar || worlds.length === 0 || !session) return;

    setStreaming(true);
    abortRef.current = new AbortController();

    // Add user message to store immediately so it's visible
    await addMessage({
      id: crypto.randomUUID(),
      sessionId: session.id,
      role: 'user',
      content: input,
      loreTriggers: [],
      timestamp: Date.now(),
    });

    // Placeholder for streaming assistant response (store only, NOT saved to DB yet)
    addToStore({
      id: crypto.randomUUID(),
      sessionId: session.id,
      role: 'assistant',
      content: '',
      loreTriggers: [],
      timestamp: Date.now(),
    });

    try {
      await sendMessage({
        userInput: input,
        settings,
        character: primaryChar,
        worlds,
        session,
        activeNpcIds,
        signal: abortRef.current.signal,
        onToken: (token) => {
          useChatStore.getState().appendToLast(token);
        },
        onDone: async (fullText: string) => {
          // Persist the completed message to DB
          await useChatStore.getState().finalizeStreaming(fullText);
          setStreaming(false);
          const changes = parseRPGChanges(fullText);
          if (changes.length > 0) {
            setPendingChanges(changes);
          }
        },
        onError: (error) => {
          setStreaming(false);
          addToast(`发送失败: ${error.message}`, 'error');
        },
      });
    } catch (err: unknown) {
      setStreaming(false);
      if (err instanceof Error && err.name !== 'AbortError') {
        addToast(`错误: ${err.message}`, 'error');
      }
    }
  };

  const handleSaveAndExit = async () => {
    await saveAndExit();
    addToast('已保存并退出', 'info');
  };

  if (!session) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-parchment-dark">请先选择角色和世界开始游戏</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Top bar with save/exit */}
      <div className="flex items-center justify-between px-4 py-2 bg-tavern-wood border-b border-amber-glow/20">
        <div className="flex items-center gap-2 text-sm text-parchment">
          <span className="text-amber-glow">{primaryChar?.name || '冒险'}</span>
          {session.npcCharacterIds.length > 0 && (
            <span className="text-xs text-parchment-dark/60">
              +{session.npcCharacterIds.length} NPC
            </span>
          )}
        </div>
        <button
          onClick={handleSaveAndExit}
          className="flex items-center gap-1 px-3 py-1 text-xs text-parchment-dark hover:text-parchment bg-tavern-wood-light/50 hover:bg-tavern-wood-light rounded-lg transition-colors"
          title="保存并退出"
        >
          <Save size={14} />
          保存退出
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {messages.length === 0 && (
          <div className="text-center text-parchment-dark mt-20">
            <p className="text-4xl mb-2">🏰</p>
            <p className="text-lg font-serif">冒险开始...</p>
          </div>
        )}
        {messages.map((msg) => {
          // Determine speaker for AI messages
          let speaker: string | undefined;
          if (msg.role === 'assistant') {
            if (npcChars.length > 0 && activeNpcIds.length > 0) {
              // Show the first active NPC's name as speaker
              const firstActive = npcChars.find((n) => activeNpcIds.includes(n.id));
              speaker = firstActive?.name || 'GM';
            } else {
              speaker = 'GM';
            }
          }
          return (
            <ChatBubble
              key={msg.id}
              message={msg}
              playerName={primaryChar?.name}
              speakerName={speaker}
            />
          );
        })}
        {appliedNote && (
          <div className="flex justify-center my-3">
            <span className="text-xs text-parchment-dark/70 italic text-center bg-cosmic-light/50 px-4 py-1.5 rounded-full border border-parchment-dark/20">
              {appliedNote}
            </span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {pendingChanges.length > 0 && (
        <ChangeConfirmation
          changes={pendingChanges}
          onComplete={() => {
            // Build narration summary of applied changes
            const statChanges = pendingChanges.filter(c => c.type === 'stat');
            if (statChanges.length > 0) {
              const parts = statChanges.map(c => {
                const prefix = (c.value ?? 0) > 0 ? '+' : '';
                const label = c.stat === 'hp' ? 'HP' : c.stat === 'mp' ? 'MP' : c.stat === 'affection' ? '好感度' : c.stat;
                return `${label} ${prefix}${c.value}`;
              });
              setAppliedNote(`${primaryChar?.name || '角色'} ${parts.join('，')}`);
              // Clear the note after 8 seconds
              setTimeout(() => setAppliedNote(null), 8000);
            }
            setPendingChanges([]);
            addToast('变更已应用', 'success');
          }}
        />
      )}

      <ChatInput
        onSend={handleSend}
        disabled={!settings?.apiKey}
        isStreaming={isStreaming}
        npcChars={npcChars}
        activeNpcIds={activeNpcIds}
        onToggleNpc={toggleNpc}
      />
    </div>
  );
}
