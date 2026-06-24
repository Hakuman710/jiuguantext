import type { Location, CharacterCard, NPC, Monster, WorldItem, WorldEquipment } from '../../types';

interface DetailProps {
  entry: {
    id: string; name: string; category: string;
    sourceWorldName: string;
    place?: Location; character?: CharacterCard; npc?: NPC;
    monster?: Monster; item?: WorldItem; equipment?: WorldEquipment;
  };
}

function StatRow({ label, value, color = 'text-parchment' }: { label: string; value: unknown; color?: string }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-parchment-dark/70">{label}</span>
      <span className={color}>{String(value ?? '未知')}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="pt-3 border-t border-amber-glow/20">
      <p className="text-xs text-amber-glow/70 mb-1">{title}</p>
      {children}
    </div>
  );
}

export function CompendiumDetail({ entry }: DetailProps) {
  const badge = (text: string, color = 'bg-cosmic-light text-parchment-dark/70') => (
    <span className={`text-[10px] px-2 py-0.5 rounded-full ${color}`}>{text}</span>
  );

  // --- Places ---
  if (entry.place) {
    const p = entry.place;
    return (
      <div className="p-4 space-y-3">
        <h3 className="text-lg font-serif text-amber-glow">{p.name}</h3>
        <div className="flex gap-2 flex-wrap">{badge(entry.sourceWorldName, 'bg-amber-glow/20 text-amber-glow')}</div>
        <p className="text-sm text-parchment">{p.description}</p>
        {(p.factions && p.factions.length > 0) && (
          <Section title="当地势力">
            <div className="flex flex-wrap gap-1">
              {p.factions.map((f, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-cosmic-light/50 text-parchment-dark border border-parchment-dark/20">{f}</span>
              ))}
            </div>
          </Section>
        )}
        {(!p.factions || p.factions.length === 0) && p.faction && (
          <Section title="当地势力"><p className="text-xs text-parchment">{p.faction}</p></Section>
        )}
        {p.connectedTo.length > 0 && (
          <Section title="连通地点"><p className="text-xs text-parchment-dark">{p.connectedTo.join('、')}</p></Section>
        )}
      </div>
    );
  }

  // --- Characters (CharacterCard or NPC) ---
  if (entry.character) {
    const c = entry.character;
    return (
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-amber-glow/20 flex items-center justify-center text-2xl text-amber-glow border-2 border-amber-glow">
            {c.name[0]}
          </div>
          <div>
            <h3 className="text-lg font-serif text-amber-glow">{c.name}</h3>
            <div className="flex gap-2 flex-wrap mt-1">
              {badge('★ 角色卡', 'bg-amber-glow/20 text-amber-glow')}
              {badge(entry.sourceWorldName)}
            </div>
          </div>
        </div>

        <div className="space-y-1">
          {c.gender && <StatRow label="性别" value={c.gender} />}
          {c.faction && <StatRow label="势力" value={c.faction} />}
          {c.race && <StatRow label="种族" value={c.race} />}
          {c.cultivation && <StatRow label="修为" value={c.cultivation} />}
        </div>

        <Section title="属性">
          <div className="space-y-0.5">
            <StatRow label="HP" value={c.baseStats.hp} color="text-red-400" />
            <StatRow label="MP" value={c.baseStats.mp} color="text-blue-400" />
            <StatRow label="攻击力" value={c.baseStats.atk} color="text-ember-light" />
            <StatRow label="防御力" value={c.baseStats.def} color="text-blue-400" />
            <StatRow label="敏捷力" value={c.baseStats.agi} color="text-green-400" />
            <StatRow label="精神力" value={c.baseStats.spi} color="text-purple-400" />
            <StatRow label="魔抗性" value={`${c.baseStats.mres}%`} color="text-cyan-400" />
          </div>
        </Section>

        <Section title="技能">
          <div className="space-y-1.5">
            {(c.initialSkills && c.initialSkills.length > 0
              ? c.initialSkills.slice(0, 5)
              : [null, null, null, null, null]
            ).map((skill, i) => (
              <div
                key={i}
                className={`p-2 rounded-lg border text-xs ${
                  skill
                    ? 'border-amber-glow/30 bg-cosmic-light/50'
                    : 'border-parchment-dark/15 bg-cosmic-light/20'
                }`}
              >
                {skill ? (
                  <div>
                    <span className="text-parchment">{skill.name}</span>
                    <span className="text-parchment-dark/50 ml-2 text-[10px]">
                      {skill.type === 'physical' ? '物理' : skill.type === 'magic' ? '魔法' : '强化'} · MP{skill.mpCost}
                      {skill.type !== 'buff' ? ` · 倍率${skill.multiplier}%` : ''}
                    </span>
                    <p className="text-parchment-dark/50 text-[10px] mt-0.5">{skill.description}</p>
                  </div>
                ) : (
                  <span className="text-parchment-dark/30 text-[10px]">— 空槽位 —</span>
                )}
              </div>
            ))}
          </div>
        </Section>

        <Section title="简介">
          <p className="text-xs text-parchment">{c.persona}</p>
          <p className="text-xs text-parchment-dark/70 mt-1">{c.backstory}</p>
        </Section>
      </div>
    );
  }

  if (entry.npc) {
    const n = entry.npc;
    return (
      <div className="p-4 space-y-3">
        <h3 className="text-lg font-serif text-amber-glow">{n.name}</h3>
        <div className="flex gap-2 flex-wrap">{badge(entry.sourceWorldName, 'bg-amber-glow/20 text-amber-glow')}</div>
        <div className="space-y-1">
          {n.gender && <StatRow label="性别" value={n.gender} />}
          {n.faction && <StatRow label="势力" value={n.faction} />}
          {n.race && <StatRow label="种族" value={n.race} />}
          {n.realm && <StatRow label="修为" value={n.realm} />}
        </div>
        {n.stats && (
          <Section title="属性">
            <div className="space-y-0.5">
              <StatRow label="HP" value={n.stats.hp} color="text-red-400" />
              <StatRow label="MP" value={n.stats.mp} color="text-blue-400" />
              <StatRow label="攻击力" value={n.stats.atk} color="text-ember-light" />
              <StatRow label="防御力" value={n.stats.def} color="text-blue-400" />
              <StatRow label="敏捷力" value={n.stats.agi} color="text-green-400" />
              <StatRow label="精神力" value={n.stats.spi} color="text-purple-400" />
              <StatRow label="魔抗性" value={typeof n.stats.mres === 'number' ? `${n.stats.mres}%` : n.stats.mres} color="text-cyan-400" />
            </div>
          </Section>
        )}
        {(n.skills && n.skills.length > 0) && (
          <Section title="技能">
            <div className="space-y-1.5">
              {n.skills.slice(0, 5).concat(Array(5 - Math.min(n.skills.length, 5)).fill(null)).map((skill, i) => (
                <div key={i} className={`p-2 rounded-lg border text-xs ${skill ? 'border-amber-glow/30 bg-cosmic-light/50' : 'border-parchment-dark/15 bg-cosmic-light/20'}`}>
                  {skill ? (
                    <div>
                      <span className="text-parchment">{skill.name}</span>
                      <span className="text-parchment-dark/50 ml-2 text-[10px]">
                        {skill.type === 'physical' ? '物理' : skill.type === 'magic' ? '魔法' : '强化'} · MP{skill.mpCost}
                        {skill.type !== 'buff' ? ` · 倍率${skill.multiplier}%` : ''}
                      </span>
                      <p className="text-parchment-dark/50 text-[10px] mt-0.5">{skill.description}</p>
                    </div>
                  ) : (
                    <span className="text-parchment-dark/30 text-[10px]">— 空槽位 —</span>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}
        <Section title="简介"><p className="text-xs text-parchment">{n.description}</p></Section>
      </div>
    );
  }

  // --- Monsters ---
  if (entry.monster) {
    const m = entry.monster;
    const tierLabel = m.type || '小怪';
    return (
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl border-2 ${
            tierLabel === 'Boss' ? 'bg-red-900/20 border-red-400 text-red-400' :
            tierLabel === '精英怪' ? 'bg-orange-900/20 border-orange-400 text-orange-400' :
            'bg-cosmic-light border-parchment-dark/30 text-parchment-dark'
          }`}>
            👹
          </div>
          <div>
            <h3 className="text-lg font-serif text-amber-glow">{m.name}</h3>
            <div className="flex gap-2 flex-wrap mt-1">
              {badge(tierLabel, tierLabel === 'Boss' ? 'bg-red-900/20 text-red-400' : tierLabel === '精英怪' ? 'bg-orange-900/20 text-orange-400' : 'bg-gray-800/30 text-gray-400')}
              {m.affiliation && badge(m.affiliation)}
              {badge(entry.sourceWorldName)}
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <StatRow label="势力" value={m.faction} />
          <StatRow label="种族" value={m.race} />
          {m.realm && <StatRow label="修为" value={m.realm} />}
          {m.gender && <StatRow label="性别" value={m.gender} />}
          {m.territory && <StatRow label="地盘" value={m.territory} />}
        </div>

        <Section title="属性">
          <div className="space-y-0.5">
            <StatRow label="HP" value={m.stats.hp} color="text-red-400" />
            <StatRow label="MP" value={m.stats.mp} color="text-blue-400" />
            <StatRow label="攻击力" value={m.stats.atk} color="text-ember-light" />
            <StatRow label="防御力" value={m.stats.def} color="text-blue-400" />
            <StatRow label="敏捷力" value={m.stats.agi} color="text-green-400" />
            <StatRow label="精神力" value={m.stats.spi} color="text-purple-400" />
            <StatRow label="魔抗性" value={typeof m.stats.mres === 'number' ? `${m.stats.mres}%` : m.stats.mres} color="text-cyan-400" />
          </div>
        </Section>

        <Section title="技能">
          <div className="space-y-1.5">
            {(m.skills && m.skills.length > 0
              ? m.skills.slice(0, 5)
              : [null, null, null, null, null]
            ).map((skill, i) => (
              <div
                key={i}
                className={`p-2 rounded-lg border text-xs ${
                  skill
                    ? 'border-amber-glow/30 bg-cosmic-light/50'
                    : 'border-parchment-dark/15 bg-cosmic-light/20'
                }`}
              >
                {skill ? (
                  <div>
                    <span className="text-parchment">{skill.name}</span>
                    <span className="text-parchment-dark/50 ml-2 text-[10px]">
                      {skill.type === 'physical' ? '物理' : skill.type === 'magic' ? '魔法' : '强化'} · MP{skill.mpCost}
                      {skill.type !== 'buff' ? ` · 倍率${skill.multiplier}%` : ''}
                    </span>
                    <p className="text-parchment-dark/50 text-[10px] mt-0.5">{skill.description}</p>
                  </div>
                ) : (
                  <span className="text-parchment-dark/30 text-[10px]">— 空槽位 —</span>
                )}
              </div>
            ))}
          </div>
        </Section>

        <Section title="简介"><p className="text-xs text-parchment">{m.description}</p></Section>
      </div>
    );
  }

  // --- Items ---
  if (entry.item) {
    const it = entry.item;
    return (
      <div className="p-4 space-y-3">
        <h3 className="text-lg font-serif text-amber-glow">{it.name}</h3>
        <div className="flex gap-2 flex-wrap">{badge(it.affiliation || entry.sourceWorldName, 'bg-amber-glow/20 text-amber-glow')}</div>
        <Section title="简介"><p className="text-xs text-parchment">{it.description}</p></Section>
      </div>
    );
  }

  // --- Equipment ---
  if (entry.equipment) {
    const eq = entry.equipment;
    const bonuses = eq.bonuses || {};
    return (
      <div className="p-4 space-y-3">
        <h3 className="text-lg font-serif text-amber-glow">{eq.name}</h3>
        <div className="flex gap-2 flex-wrap">{badge(eq.affiliation || entry.sourceWorldName, 'bg-amber-glow/20 text-amber-glow')}</div>
        <div className="space-y-1">
          {eq.realm && <StatRow label="境界" value={eq.realm} />}
          {eq.slot && <StatRow label="装备槽" value={eq.slot} />}
        </div>
        {Object.keys(bonuses).length > 0 && (
          <Section title="属性加成">
            <div className="space-y-0.5">
              {Object.entries(bonuses).filter(([, v]) => v).map(([k, v]) => (
                <StatRow key={k} label={k} value={`+${v}`} />
              ))}
            </div>
          </Section>
        )}
        <Section title="简介"><p className="text-xs text-parchment">{eq.description}</p></Section>
      </div>
    );
  }

  return null;
}
