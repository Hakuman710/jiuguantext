import { useCharacterStore } from '../../stores/character-store';

export function CharacterPanel() {
  const character = useCharacterStore((s) => s.getSelected());

  if (!character) return null;

  return (
    <div className="p-3">
      <div className="flex items-center gap-3 mb-3">
        {character.avatar ? (
          <img
            src={character.avatar}
            alt={character.name}
            className="w-12 h-12 rounded-full object-cover border-2 border-amber-glow"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-amber-glow/30 flex items-center justify-center text-xl">
            {character.name[0]}
          </div>
        )}
        <div>
          <h3 className="text-lg font-serif text-amber-glow">{character.name}</h3>
          <p className="text-xs text-parchment-dark">{character.tags?.join(' · ')}</p>
        </div>
      </div>

      <div className="space-y-2 text-xs text-parchment">
        <div>
          <span className="text-amber-glow/70">性格: </span>
          {character.persona}
        </div>
        <div>
          <span className="text-amber-glow/70">背景: </span>
          {character.backstory}
        </div>
        <div>
          <span className="text-amber-glow/70">风格: </span>
          {character.speechStyle}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-amber-glow/20">
        <p className="text-xs text-parchment-dark/60">基础属性</p>
        <div className="grid grid-cols-3 gap-1 mt-1 text-xs text-parchment">
          <span>HP: {character.baseStats.hp}</span>
          <span>MP: {character.baseStats.mp}</span>
          <span>攻击: {character.baseStats.atk}</span>
          <span>防御: {character.baseStats.def}</span>
          <span>敏捷: {character.baseStats.agi}</span>
          <span>精神: {character.baseStats.spi}</span>
          <span>魔抗: {character.baseStats.mres}%</span>
          <span>好感: {character.affinityBase}</span>
        </div>
      </div>

      {/* Initial skills */}
      {character.initialSkills && character.initialSkills.some(s => s !== null) && (
        <div className="mt-3 pt-3 border-t border-amber-glow/20">
          <p className="text-xs text-parchment-dark/60 mb-1">初始技能</p>
          <div className="space-y-1">
            {character.initialSkills.filter(Boolean).map((skill) => skill && (
              <div key={skill.id} className="p-1.5 rounded bg-cosmic-light/50 border border-parchment-dark/20 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-parchment font-medium">{skill.name}</span>
                  <span className={`text-[10px] px-1 rounded ${
                    skill.type === 'physical' ? 'text-red-300' :
                    skill.type === 'magic' ? 'text-blue-300' : 'text-green-300'
                  }`}>
                    {skill.type === 'physical' ? '物理' : skill.type === 'magic' ? '魔法' : '强化'}
                  </span>
                </div>
                <p className="text-parchment-dark/60 text-[10px] mt-0.5">MP {skill.mpCost}{skill.type !== 'buff' ? ` | 倍率 ${skill.multiplier}%` : ''}</p>
                <p className="text-parchment-dark/50 text-[10px]">{skill.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
