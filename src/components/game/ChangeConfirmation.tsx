import { useState } from 'react';
import type { RPGChange } from '../../types';
import { applyChanges } from '../../utils/rpg-parser';
import { useChatStore } from '../../stores/chat-store';
import { Check, X } from 'lucide-react';

interface ChangeConfirmationProps {
  changes: RPGChange[];
  onComplete: () => void;
}

export function ChangeConfirmation({ changes, onComplete }: ChangeConfirmationProps) {
  const session = useChatStore((s) => s.session);
  const [confirmed, setConfirmed] = useState<Set<number>>(new Set());
  const [rejected, setRejected] = useState<Set<number>>(new Set());
  // For skill_learn with full slots: user picks which slot to replace
  const [skillReplacements, setSkillReplacements] = useState<Record<number, number>>({});

  const handleConfirm = (i: number) => {
    setConfirmed((s) => new Set(s).add(i));
  };

  const handleReject = (i: number) => {
    setRejected((s) => new Set(s).add(i));
  };

  const handleApply = async () => {
    const toApply = changes
      .filter((_, i) => confirmed.has(i) && !rejected.has(i))
      .map((c, i) => {
        // Inject the chosen replacement index for skill_learn
        if (c.type === 'skill_learn' && skillReplacements[i] !== undefined) {
          return { ...c, replaceIndex: skillReplacements[i] };
        }
        return c;
      });
    await applyChanges(toApply);
    onComplete();
  };

  const allResolved = changes.every((_, i) => {
    if (confirmed.has(i) || rejected.has(i)) return true;
    return false;
  });

  const currentSkills = session?.skills || [null, null, null, null, null];
  const hasEmptySlot = currentSkills.some((s) => s === null);

  function describeChange(c: RPGChange, i: number): string {
    switch (c.type) {
      case 'stat': {
        const prefix = (c.value ?? 0) > 0 ? '+' : '';
        return `${c.stat}: ${prefix}${c.value} — ${c.reason}`;
      }
      case 'item_add':
        return `获得 ${c.item?.name} — ${c.reason}`;
      case 'item_remove':
        return `失去物品 — ${c.reason}`;
      case 'quest_new':
        return `新任务: ${c.quest?.title} — ${c.reason}`;
      case 'quest_update':
        return `任务进度更新 — ${c.reason}`;
      case 'quest_complete':
        return `任务完成！— ${c.reason}`;
      case 'location_change':
        return `前往新地点 — ${c.reason}`;
      case 'skill_learn':
        return `学习技能: ${c.skill?.name} (${c.skill?.type === 'physical' ? '物理' : c.skill?.type === 'magic' ? '魔法' : '强化'}, MP${c.skill?.mpCost}) — ${c.reason}`;
      case 'skill_forget':
        return `遗忘技能 — ${c.reason}`;
      default:
        return c.reason;
    }
  }

  return (
    <div className="border-t-2 border-amber-glow bg-cosmic-light p-3">
      <h4 className="text-sm font-serif text-amber-glow mb-2">📜 AI 建议的变更</h4>
      <div className="space-y-1 mb-2 max-h-48 overflow-y-auto">
        {changes.map((change, i) => {
          const isSkillLearn = change.type === 'skill_learn' && !hasEmptySlot;
          const needsReplaceSlot = isSkillLearn && skillReplacements[i] === undefined;

          return (
            <div key={i}>
              <div
                className={`flex items-center gap-2 p-1.5 rounded text-xs ${
                  confirmed.has(i)
                    ? 'bg-green-800/20 text-green-400'
                    : rejected.has(i)
                      ? 'bg-red-900/20 text-red-400 line-through'
                      : 'bg-tavern-wood/30 text-parchment'
                }`}
              >
                <span className="flex-1">{describeChange(change, i)}</span>
                {!confirmed.has(i) && !rejected.has(i) && (
                  <div className="flex gap-1">
                    {(!isSkillLearn || !needsReplaceSlot) && (
                      <button onClick={() => handleConfirm(i)} className="p-0.5 text-green-400 hover:bg-green-800/30 rounded">
                        <Check size={14} />
                      </button>
                    )}
                    <button onClick={() => handleReject(i)} className="p-0.5 text-red-400 hover:bg-red-900/30 rounded">
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
              {/* Skill replacement picker when slots are full */}
              {isSkillLearn && needsReplaceSlot && !rejected.has(i) && (
                <div className="mt-1 ml-2 p-2 rounded border border-amber-glow/30 bg-cosmic-light/50">
                  <p className="text-[10px] text-parchment-dark/70 mb-1">技能槽已满，选择要替换的技能：</p>
                  <div className="space-y-1">
                    {currentSkills.map((sk, si) => (
                      <button
                        key={si}
                        onClick={() => {
                          setSkillReplacements((prev) => ({ ...prev, [i]: si }));
                          handleConfirm(i);
                        }}
                        className={`w-full text-left text-[10px] p-1 rounded ${
                          sk
                            ? 'text-parchment hover:bg-amber-glow/20'
                            : 'text-parchment-dark/40'
                        }`}
                      >
                        {sk ? `${sk.name} (${sk.type === 'physical' ? '物理' : sk.type === 'magic' ? '魔法' : '强化'})` : '空槽'}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {allResolved && (
        <button
          onClick={handleApply}
          className="w-full py-1.5 bg-amber-glow text-white rounded-lg hover:bg-ember transition-colors text-sm"
        >
          应用变更
        </button>
      )}
    </div>
  );
}
