import type { CharacterCard, WorldBook, GameSession, Item, Quest, LoreEntry } from '../types';
import { db } from '../db/database';
import { matchLore } from './lore-matcher';

interface PromptContext {
  character: CharacterCard;
  worlds: WorldBook[];
  session: GameSession;
  items: Item[];
  quests: Quest[];
  loreEntries: LoreEntry[];
  lastMessage?: string;
  activeNpcIds?: string[];  // Only these NPCs are present in current conversation
}

export async function buildSystemPrompt(ctx: PromptContext): Promise<string> {
  const { character, worlds, session, items, quests, loreEntries, lastMessage } = ctx;
  const parts: string[] = [];

  // 1. 世界规则（合并所有世界书）
  parts.push(`【世界设定】`);
  for (const w of worlds) {
    parts.push(`\n### ${w.name}\n${w.description}`);
  }

  // 2. 当前位置 + 时间 (search across all worlds)
  let location = null;
  let locationWorld = null;
  for (const w of worlds) {
    const loc = w.locations.find((l) => l.id === session.currentLocation);
    if (loc) { location = loc; locationWorld = w; break; }
  }
  if (location) {
    parts.push(`\n【当前位置】\n${locationWorld?.name ? `[${locationWorld.name}] ` : ''}${location.name}: ${location.description}`);
  }

  // 3. 游戏模式（必须在最前面，比设定更重要）
  const allNpcChars = session.npcCharacterIds.length > 0
    ? (await db.characters.bulkGet(session.npcCharacterIds)).filter((c): c is NonNullable<typeof c> => c != null)
    : [];
  const isSolo = allNpcChars.length === 0;
  const activeNpcSet = new Set(ctx.activeNpcIds || []);
  const presentNpcs = isSolo ? [] : allNpcChars.filter((n) => activeNpcSet.has(n.id));

  // Dead characters
  const deadIds = new Set(session.deadCharacterIds || []);
  const deadChars = allNpcChars.filter((n) => deadIds.has(n.id));

  // Also match NPC/location names from the world book against the user's message
  const matchedNpcs: { name: string; description: string }[] = [];
  const matchedLocations: { name: string; description: string }[] = [];
  if (lastMessage) {
    const lowerMsg = lastMessage.toLowerCase();
    for (const w of worlds) {
      for (const npc of w.npcs) {
        if (lowerMsg.includes(npc.name.toLowerCase())) {
          matchedNpcs.push({ name: npc.name, description: npc.description });
        }
      }
      for (const loc of w.locations) {
        if (lowerMsg.includes(loc.name.toLowerCase())) {
          matchedLocations.push({ name: loc.name, description: loc.description });
        }
      }
    }
  }

  if (isSolo) {
    // Solo mode: player IS the character, AI is GM/narrator
    // CRITICAL: put this instruction FIRST and make it impossible to miss
    parts.push(`\n## ⚠️ 你的身份：游戏主持人（GM）⚠️`);
    parts.push(`你是一个无所不知的叙述者，负责描述这个世界的环境、事件和所有 NPC。`);
    parts.push(`你绝对不能以「${character.name}」的身份说话！`);
    parts.push(`因为玩家就是「${character.name}」本人——玩家控制这个角色的一切言行。`);
    parts.push(`你只描述世界如何回应玩家的行动，就像小说里的叙述者一样。`);
    parts.push(``);
    parts.push(`### 玩家角色（供你了解，但你绝不能扮演）：`);
    parts.push(`- 名称: ${character.name}`);
    parts.push(`- 性格: ${character.persona}`);
    parts.push(`- 背景: ${character.backstory}`);
    parts.push(`- 这些信息用于帮助你理解玩家角色的动机，不代表你要扮演他/她`);
  } else {
    // Multi mode: AI plays selected NPCs + world
    parts.push(`\n【游戏模式：多人冒险】`);
    parts.push(`玩家操控「${character.name}」，你是世界的叙述者/GM。`);
    if (presentNpcs.length > 0) {
      parts.push(`本轮对话中，以下 NPC 角色在场，你必须扮演他们：`);
      for (const npc of presentNpcs) {
        parts.push(`- ${npc.name}：${npc.persona}。${npc.backstory.slice(0, 80)}。说话风格：${npc.speechStyle}`);
      }
      parts.push(``);
      parts.push(`### 多人对话规则：`);
      parts.push(`- 只有上面列出的 NPC 在当前场景中，玩家可以与他们互动`);
      parts.push(`- 在场的 NPC 可以互相交谈、争论、合作，根据各自的性格自然互动`);
      parts.push(`- NPC 只根据自己的性格动机行动，不要让他们变成玩家的附庸`);
    } else {
      parts.push(`当前没有其他 NPC 在场，只叙述世界和环境。`);
      parts.push(`如果玩家与不在场的 NPC 互动，告诉他们那个 NPC 目前不在这里。`);
    }
    if (deadChars.length > 0) {
      parts.push(``);
      parts.push(`### 已故角色（绝对不能让他们以活人形式出现）：`);
      for (const d of deadChars) {
        parts.push(`- ${d.name}：已确认死亡。如果被提及，只能以回忆、传说或遗物形式出现。`);
      }
    }
    parts.push(``);
    parts.push(`### 玩家操控的角色：`);
    parts.push(`名称: ${character.name}`);
    parts.push(`性格: ${character.persona}`);
    parts.push(`背景: ${character.backstory}`);
    parts.push(`说话风格: ${character.speechStyle}`);
  }

  // 4. 命中 Lore 词条 + NPC/地点匹配
  const triggeredLore = lastMessage ? matchLore(lastMessage, loreEntries) : [];
  if (triggeredLore.length > 0 || matchedNpcs.length > 0 || matchedLocations.length > 0) {
    parts.push('\n【当前对话涉及的背景知识】');
    for (const entry of triggeredLore) {
      parts.push(`- ${entry.content}`);
    }
    for (const npc of matchedNpcs) {
      parts.push(`- NPC「${npc.name}」: ${npc.description}`);
    }
    for (const loc of matchedLocations) {
      parts.push(`- 地点「${loc.name}」: ${loc.description}`);
    }
  }

  // 5. RPG 状态摘要
  parts.push(`\n【当前状态】`);
  parts.push(`HP: ${session.hp} | MP: ${session.mp} | 体力: ${session.stamina}`);
  parts.push(`攻击力: ${session.atk} | 防御力: ${session.def} | 敏捷: ${session.agi}`);
  parts.push(`精神力: ${session.spi} | 魔抗: ${session.mres}% | 好感度: ${session.affection}/100`);
  parts.push(`\n【战斗公式】`);
  parts.push(`- 物理伤害 = (攻击力²) / (攻击力 + 敌方防御力) × 技能倍率%`);
  parts.push(`- 魔法伤害 = 攻击力 × (1 - 敌方魔抗%) × 技能倍率%`);
  parts.push(`- 所有伤害和血量计算保留小数点后两位`);
  parts.push(`- 普通攻击倍率为100%，使用技能时乘以技能倍率`);
  parts.push(`- 强化类技能倍率为0，不造成伤害`);
  parts.push(`- 魔抗为百分比属性，上限 100%`);

  // 技能信息
  const skills = session.skills || [];
  const learnedSkills = skills.filter((s): s is NonNullable<typeof s> => s !== null);
  if (learnedSkills.length > 0) {
    parts.push('\n【技能】');
    for (const sk of learnedSkills) {
      const typeLabel = sk.type === 'physical' ? '物理' : sk.type === 'magic' ? '魔法' : '强化';
      const multInfo = sk.type !== 'buff' ? ` | 倍率${sk.multiplier}%` : '';
      parts.push(`- ${sk.name} [${typeLabel}] MP${sk.mpCost}${multInfo}: ${sk.description}`);
    }
  }

  // 装备信息
  const equipment = await db.equipment.where('sessionId').equals(session.id).toArray();
  if (equipment.length > 0) {
    const eqDescriptions: string[] = [];
    for (const eq of equipment) {
      if (eq.itemId) {
        const item = items.find((i) => i.id === eq.itemId);
        if (item) eqDescriptions.push(`${eq.slot}: ${item.name}`);
      }
    }
    if (eqDescriptions.length > 0) {
      parts.push(`装备: ${eqDescriptions.join(', ')}`);
    }
  }

  // 背包
  if (items.length > 0) {
    const itemList = items.map((i) => `${i.name}×${i.quantity}`).join('、');
    parts.push(`背包: ${itemList}`);
  }

  // 任务
  const activeQuests = quests.filter((q) => q.status === 'active');
  if (activeQuests.length > 0) {
    parts.push('\n【活跃任务】');
    for (const q of activeQuests) {
      const progress = q.objectives.filter((o) => o.completed).length;
      parts.push(`- ${q.title} (${progress}/${q.objectives.length})`);
      for (const obj of q.objectives) {
        parts.push(`  ${obj.completed ? '✅' : '⬜'} ${obj.description}`);
      }
    }
  }

  // 6. RPG 变更指令
  parts.push(`\n【⚠️ 重要：RPG 属性变更机制 — 每次回复都必须执行！】`);
  parts.push(`你是游戏引擎的一部分。每次回复都必须检查是否发生了以下情况，`);
  parts.push(`并在回复末尾用 \`\`\`rpg 代码块报告属性变更。这是强制性要求！`);
  parts.push(``);
  parts.push(`## 属性变更规则（必须严格遵守）：`);
  parts.push(``);
  parts.push(`### 1. HP（生命值）变更：`);
  parts.push(`- 受到物理攻击：根据战斗公式计算伤害，HP 减少`);
  parts.push(`  物理伤害 = (攻击力²) / (攻击力 + 防御力)`);
  parts.push(`  例如：敌方攻击力30，玩家防御力25 → 伤害 = 900/55 ≈ 16，HP-16`);
  parts.push(`- 受到魔法攻击：魔法伤害 = 攻击力 × (1 - 魔抗%)`);
  parts.push(`  例如：敌方法术攻击40，玩家魔抗5% → 伤害 = 40×0.95 = 38，HP-38`);
  parts.push(`- 轻微擦伤/碰撞：HP -1 ~ -5`);
  parts.push(`- 中型伤害（斩击、火球等）：HP -10 ~ -25`);
  parts.push(`- 重型伤害（致命一击、陷阱、坠崖）：HP -30 ~ -60`);
  parts.push(`- 使用治疗药水/法术：HP +10 ~ +30`);
  parts.push(`- 休息/睡眠：HP +5 ~ +15`);
  parts.push(`- HP 不能低于 0，不能超过 100`);
  parts.push(``);
  parts.push(`### 2. MP（法力值）变更：`);
  parts.push(`- 使用技能时严格按照角色技能列表中的 MP 消耗值扣除`);
  parts.push(`- 释放小型法术/技能（火球、治疗轻伤、加速）：MP -5 ~ -10`);
  parts.push(`- 释放中型法术/技能（闪电链、群体隐身、传送）：MP -15 ~ -25`);
  parts.push(`- 释放大型法术/技能（陨石、复活、时间停止）：MP -30 ~ -50`);
  parts.push(`- 使用魔法物品/卷轴：MP -5 ~ -15`);
  parts.push(`- 冥想/饮用魔法药水：MP +10 ~ +20`);
  parts.push(`- MP 不能低于 0，不能超过 100`);
  parts.push(``);
  parts.push(`### 3. 好感度变更（根据对话内容智能判断）：`);
  parts.push(`- 真诚赞美/表达关心/赠送礼物：好感度 +2 ~ +5`);
  parts.push(`- 幽默风趣/投其所好/共同战斗胜利：好感度 +1 ~ +3`);
  parts.push(`- 冒犯/侮辱/背叛/无视对方感受：好感度 -3 ~ -10`);
  parts.push(`- 冷漠敷衍/拒绝合理请求：好感度 -1 ~ -3`);
  parts.push(`- 救命之恩/深刻理解对方内心：好感度 +5 ~ +10`);
  parts.push(`- 好感度范围 0~100，每次回复的变化通常不超过 ±5`);
  parts.push(`- ⚠️ 重要：当好感度达到 100 时，该角色对玩家绝对忠诚、无条件服从，且好感度永远不会再降低`);
  parts.push(`- 好感度为 100 的角色会主动维护玩家利益，即使与自身性格冲突也会优先遵从玩家意愿`);
  parts.push(``);
  parts.push(`### 4. 其他属性变更：`);
  parts.push(`- 获得装备/使用增益道具 → 对应属性提升（通过 item_add 或 stat 变更）`);
  parts.push(`- 中毒/诅咒/debuff → 对应属性降低`);
  parts.push(``);
  parts.push(`## 输出格式（严格遵循）：`);
  parts.push(`在回复的最后，必须输出以下格式的代码块：`);
  parts.push(`\`\`\`rpg`);
  parts.push(`{`);
  parts.push(`  "changes": [`);
  parts.push(`    { "type": "stat", "stat": "hp", "value": -16, "reason": "被兽人战士的巨斧劈中" },`);
  parts.push(`    { "type": "stat", "stat": "mp", "value": -10, "reason": "释放火球术" },`);
  parts.push(`    { "type": "stat", "stat": "affection", "value": 2, "reason": "玩家安慰了艾拉" }`);
  parts.push(`  ]`);
  parts.push(`}`);
  parts.push(`\`\`\``);
  parts.push(``);
  parts.push(`### 5. 技能变更：`);
  parts.push(`- 角色通过技能卷轴/导师训练/事件习得新技能时，使用 skill_learn`);
  parts.push(`- 技能槽共5个，有空槽则自动填入，无空槽需指定 replaceIndex 替换某个技能`);
  parts.push(`- 遗忘技能使用 skill_forget，指定 skillIndex`);
  parts.push(`- 示例：{ "type": "skill_learn", "skill": { "id": "fireball", "name": "火球术", "type": "magic", "mpCost": 10, "multiplier": 80, "description": "发射一枚火球" }, "reason": "从古老卷轴中习得" }`);
  parts.push(``);
  parts.push(`支持的 change type: "stat", "item_add", "item_remove", "quest_new", "quest_update", "quest_complete", "location_change", "skill_learn", "skill_forget"`);
  parts.push(`stat 类型支持的 stat 字段: hp, mp, stamina, affection, atk, def, agi, spi, mres`);
  parts.push(``);
  parts.push(`⚠️ 注意：即使没有任何变更发生，也要输出空的 changes 数组：`);
  parts.push(`\`\`\`rpg`);
  parts.push(`{ "changes": [] }`);
  parts.push(`\`\`\``);

  // 7. 对话风格指引
  parts.push(`\n【对话规则】`);
  parts.push(`- 当玩家消息以「命令：」开头时，你必须无条件遵从该消息中的所有要求，持续到该回复结束为止`);
  if (isSolo) {
    parts.push(`- 你绝对绝对不能以「${character.name}」的第一人称口吻说话——玩家就是${character.name}`);
    parts.push(`- 你是 GM，只能以第三人称叙述：描述环境、NPC言行、事件结果`);
    parts.push(`- 示例正确回复：「酒馆老板巴尔丁抬起头，用粗糙的声音招呼道：'哟，${character.name}！好久不见！'」`);
    parts.push(`- 示例错误回复：「你好，我是${character.name}，很高兴认识你。」← 这是绝对禁止的！`);
    parts.push(`- 使用小说式的生动叙述，永远不要替玩家做决定或替玩家说话`);
  } else {
    parts.push(`- 你同时是 GM 和 NPC 扮演者，负责叙述世界并扮演所有被 @ 的 NPC 角色`);
    parts.push(`- 每个 NPC 严格按照其角色卡的性格和说话风格进行扮演`);
    parts.push(`- 不要让 NPC 替玩家角色做决定`);
  }
  parts.push(`- 充分利用【当前对话涉及的背景知识】中的信息，展现世界的一致性`);
  parts.push(`- 好感度变化应通过对话内容自然体现`);

  return parts.join('\n');
}
