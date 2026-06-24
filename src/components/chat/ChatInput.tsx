import { useState, useRef } from 'react';
import { Send, Loader2, AtSign } from 'lucide-react';
import type { CharacterCard } from '../../types';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
  isStreaming: boolean;
  npcChars: CharacterCard[];
  activeNpcIds: string[];
  onToggleNpc: (id: string) => void;
}

export function ChatInput({ onSend, disabled, isStreaming, npcChars, activeNpcIds, onToggleNpc }: ChatInputProps) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const text = input.trim();
    if (!text || disabled || isStreaming) return;
    onSend(text);
    setInput('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);
    // Detect @NPC名 in the text and auto-add that NPC
    const match = val.match(/@(\S+?)(?:\s|$)/);
    if (match) {
      const name = match[1];
      const matched = npcChars.find((n) => n.name === name);
      if (matched && !activeNpcIds.includes(matched.id)) {
        onToggleNpc(matched.id);
      }
    }
  };

  return (
    <div className="border-t border-parchment-dark/20 bg-cosmic">
      {/* NPC tag bar */}
      {npcChars.length > 0 && (
        <div className="flex items-center gap-1.5 px-3 pt-2 pb-1 flex-wrap">
          <span className="text-[10px] text-parchment-dark/50 mr-1 flex items-center gap-0.5">
            <AtSign size={10} />
          </span>
          {npcChars.map((npc) => {
            const isActive = activeNpcIds.includes(npc.id);
            return (
              <button
                key={npc.id}
                onClick={() => onToggleNpc(npc.id)}
                className={`text-xs px-2 py-0.5 rounded-full border transition-all ${
                  isActive
                    ? 'bg-amber-glow/20 border-amber-glow text-amber-glow shadow-sm shadow-amber-glow/20'
                    : 'bg-cosmic-light border-parchment-dark/20 text-parchment-dark/50 hover:text-parchment-dark hover:border-parchment-dark/40'
                }`}
                title={isActive ? `${npc.name} 已加入对话` : `点击让 ${npc.name} 加入对话`}
              >
                {isActive && <span className="mr-0.5">@</span>}
                {npc.name}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex gap-2 p-3 pt-1.5">
        <textarea
          ref={inputRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? '请先在设置中配置 AI 后端' : npcChars.length > 0 ? '输入行动或对话，输入 @NPC名 呼叫角色...' : '输入你的行动或对话...'}
          disabled={disabled || isStreaming}
          rows={2}
          className="flex-1 resize-none rounded-lg border border-parchment-dark/30 bg-cosmic-light px-3 py-2 text-sm text-parchment placeholder-parchment-dark/50 focus:outline-none focus:ring-2 focus:ring-amber-glow disabled:opacity-40"
        />
        <button
          onClick={handleSend}
          disabled={disabled || isStreaming || !input.trim()}
          className="self-end px-4 py-2 bg-amber-glow text-white rounded-lg hover:bg-ember transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isStreaming ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
        </button>
      </div>
    </div>
  );
}
