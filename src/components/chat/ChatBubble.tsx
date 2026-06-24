import { marked } from 'marked';
import type { ChatMessage } from '../../types';

interface ChatBubbleProps {
  message: ChatMessage;
  playerName?: string;
  speakerName?: string;  // Name of the NPC/GM speaking (for AI messages)
}

export function ChatBubble({ message, playerName, speakerName }: ChatBubbleProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  if (isSystem) return null;

  // Strip ```rpg blocks from displayed content
  const cleanContent = message.content.replace(/```rpg\s*\r?\n[\s\S]*?\r?\n\s*```/gi, '').trim();

  const htmlContent = isUser ? cleanContent : (marked.parse(cleanContent) as string);

  // Avatar display:
  // - User messages: show player character's first character
  // - AI messages: show speaker's first character (NPC initial or GM symbol)
  const userAvatar = playerName?.[0] || '你';
  const aiAvatar = speakerName?.[0] || '🌐';

  return (
    <div className={`flex gap-3 mb-4 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${
          isUser ? 'bg-amber-glow/30 text-amber-glow border border-amber-glow/50' : 'bg-amber-glow text-white'
        }`}
        title={isUser ? (playerName || '你') : (speakerName || 'GM')}
      >
        {isUser ? userAvatar : aiAvatar}
      </div>
      <div
        className={`max-w-[75%] px-4 py-3 rounded-xl ${
          isUser
            ? 'bg-tavern-wood text-parchment rounded-tr-sm'
            : 'bg-cosmic-light text-parchment rounded-tl-sm border border-parchment-dark/20'
        }`}
      >
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap">{cleanContent}</p>
        ) : (
          <div
            className="text-sm prose prose-sm max-w-none prose-headings:text-amber-glow prose-strong:text-ember-light prose-p:text-parchment prose-ul:text-parchment prose-ol:text-parchment prose-li:text-parchment"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        )}
      </div>
    </div>
  );
}
