import { useQuestStore } from '../../stores/quest-store';
import { Check, Circle } from 'lucide-react';

export function QuestPanel() {
  const quests = useQuestStore((s) => s.quests);
  const version = useQuestStore((s) => s.version);
  const updateObjective = useQuestStore((s) => s.updateObjective);

  const active = quests.filter((q) => q.status === 'active');
  const completed = quests.filter((q) => q.status === 'completed');

  return (
    <div className="p-3" key={version}>
      <h3 className="text-sm font-serif text-amber-glow mb-2">📋 任务日志</h3>

      {quests.length === 0 && (
        <p className="text-xs text-parchment-dark/60 text-center mt-8">暂无任务</p>
      )}

      {active.length > 0 && (
        <div className="space-y-2 mb-4">
          <p className="text-xs text-ember-light font-medium">进行中 ({active.length})</p>
          {active.map((quest) => (
            <div
              key={quest.id}
              className="p-2 rounded-lg border border-parchment-dark/30 bg-cosmic-light"
            >
              <p className="text-sm text-parchment font-medium">{quest.title}</p>
              <p className="text-xs text-parchment-dark/60 mb-1">{quest.description}</p>
              {quest.objectives.map((obj, i) => (
                <button
                  key={obj.id || i}
                  onClick={() => updateObjective(quest.id, i, !obj.completed)}
                  className="flex items-center gap-2 w-full text-left py-0.5 text-xs text-parchment-dark hover:text-parchment transition-colors"
                >
                  {obj.completed ? (
                    <Check size={14} className="text-green-400 flex-shrink-0" />
                  ) : (
                    <Circle size={14} className="text-parchment-dark/60 flex-shrink-0" />
                  )}
                  <span className={obj.completed ? 'line-through opacity-60' : ''}>
                    {obj.description}
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      {completed.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-green-400/70 font-medium">已完成 ({completed.length})</p>
          {completed.map((quest) => (
            <div
              key={quest.id}
              className="p-2 rounded-lg border border-green-800/30 bg-green-800/5 opacity-70"
            >
              <p className="text-sm text-green-400 line-through">{quest.title}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
