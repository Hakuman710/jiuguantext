// ===== AI 后端 =====
export type AIProvider = 'deepseek' | 'openai' | 'anthropic' | 'ollama';

export interface AISettings {
  id?: number;
  provider: AIProvider;
  apiKey: string;
  endpoint: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

// ===== 技能 =====
export type SkillType = 'physical' | 'magic' | 'buff';

export interface Skill {
  id: string;
  name: string;
  type: SkillType;
  mpCost: number;
  multiplier: number; // 百分比倍率 (buff类型为0)，在伤害公式结算后乘以此倍率
  description: string;
}

// ===== 角色卡 =====
export interface BaseStats {
  hp: number;
  mp: number;
  atk: number;
  def: number;
  agi: number;
  spi: number;
  mres: number;
  stamina: number;
}

export interface CharacterCard {
  id: string;
  name: string;
  avatar: string;
  persona: string;
  backstory: string;
  speechStyle: string;
  baseStats: BaseStats;
  affinityBase: number;
  tags: string[];
  initialSkills: (Skill | null)[]; // 初始技能，最多5个，null为空槽
  // Compendium fields
  faction?: string;      // 势力
  race?: string;         // 种族
  cultivation?: string;  // 修为
  gender?: string;       // 性别
  createdAt: number;
}

// ===== 世界书 =====
export interface Location {
  id: string;
  name: string;
  description: string;
  connectedTo: string[];
  faction?: string;       // 当地势力（旧格式，兼容）
  factions?: string[];    // 当地势力列表（新格式）
}

export interface LoreEntry {
  id: string;
  keys: string[];
  content: string;
  priority: number;
}

export interface TimeRules {
  enabled: boolean;
  dayLength: number;
  startHour: number;
}

export interface NPC {
  id: string;
  name: string;
  description: string;
  location?: string;
  faction?: string;      // 势力
  race?: string;         // 种族
  realm?: string;        // 修为/境界
  cultivation?: string;  // 修为（旧格式兼容）
  gender?: string;       // 性别
  stats?: Record<string, number | string>;  // 属性面板（未知为 "未知"）
  skills?: (Skill | null)[];  // 技能列表
}

export interface WorldBook {
  id: string;
  name: string;
  description: string;
  locations: Location[];
  loreEntries: LoreEntry[];
  timeRules?: TimeRules;
  npcs: NPC[];
  monsters?: Monster[];
  items?: WorldItem[];
  equipment?: WorldEquipment[];
  createdAt: number;
}

// ===== 图鉴 =====

export interface Monster {
  id: string; name: string;
  type: string;             // 小怪 / 精英怪 / Boss
  affiliation: string;      // 所属地区
  faction: string;          // 势力
  race: string;             // 种族
  realm: string;            // 修为/境界
  gender?: string;          // 性别（精英/Boss）
  territory?: string;       // 地盘（Boss）
  stats: Record<string, number | string>;  // 属性面板（未知为 "未知"）
  skills?: Skill[];         // 技能列表
  description: string;
}

export interface WorldItem {
  id: string; name: string;
  affiliation: string;      // 所属地区/世界
  description: string;
}

export interface WorldEquipment {
  id: string; name: string;
  affiliation: string;      // 所属地区/世界
  realm: string;            // 境界/级别
  slot: string;             // 装备栏
  bonuses: Record<string, number>;  // 属性加成 (中文key)
  description: string;
}

// ===== 物品 =====
export type ItemType = 'consumable' | 'equipment' | 'key' | 'misc';
export type EquipSlot = 'weapon' | 'head' | 'chest' | 'ring' | 'necklace';

export interface ItemBonuses {
  hp?: number;
  mp?: number;
  atk?: number;
  def?: number;
  agi?: number;
  spi?: number;
  mres?: number;
  stamina?: number;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  quantity: number;
  icon: string;
  type: ItemType;
  slot?: EquipSlot;
  bonuses?: ItemBonuses;
  equippable: boolean;
}

// ===== 任务 =====
export type QuestStatus = 'active' | 'completed' | 'failed';

export interface QuestObjective {
  id: string;
  description: string;
  completed: boolean;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  objectives: QuestObjective[];
  status: QuestStatus;
  createdAt: number;
  sessionId?: string;
}

// ===== 游戏会话 =====
export interface GameSession {
  id: string;
  name: string;                  // 自定义世界名称
  primaryCharacterId: string;   // 玩家操控的角色卡 ID
  npcCharacterIds: string[];    // 重要 NPC 角色卡 ID 列表
  worldIds: string[];            // 载入的世界书 ID 列表（支持多本）
  currentLocation: string;
  gameTime: number;
  hp: number;
  mp: number;
  stamina: number;
  affection: number;
  atk: number;
  def: number;
  agi: number;    // 敏捷力
  spi: number;    // 精神力
  mres: number;   // 魔抗性
  skills: (Skill | null)[];  // 技能槽，最多5个，null为空
  deadCharacterIds: string[];  // 已确认死亡的角色卡ID（可在世界设置中删除）
  createdAt: number;
  updatedAt: number;
}

// ===== 对话消息 =====
export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: MessageRole;
  content: string;
  loreTriggers: string[];
  timestamp: number;
}

// ===== 装备栏 =====
export interface EquipmentRecord {
  sessionId: string;
  slot: EquipSlot;
  itemId: string | null;
}

// ===== RPG 变更 =====
export type ChangeType =
  | 'stat'
  | 'item_add'
  | 'item_remove'
  | 'quest_new'
  | 'quest_update'
  | 'quest_complete'
  | 'location_change'
  | 'skill_learn'
  | 'skill_forget';

export interface RPGChange {
  type: ChangeType;
  stat?: string;
  value?: number;
  item?: Item;
  itemId?: string;
  quest?: Quest;
  questId?: string;
  objective?: number;
  completed?: boolean;
  locationId?: string;
  skill?: Skill;         // for skill_learn: the new skill
  replaceIndex?: number;  // for skill_learn when full: which slot to replace
  skillIndex?: number;    // for skill_forget: which slot to forget
  reason: string;
}

export interface RPGExtract {
  changes: RPGChange[];
}

// ===== 游戏阶段 =====
export type GamePhase =
  | 'no-character'
  | 'no-world'
  | 'no-ai-config'
  | 'ready'
  | 'playing'
  | 'loading';

// ===== 默认后端配置 =====
export const BACKEND_DEFAULTS: Record<AIProvider, { endpoint: string; models: string[] }> = {
  deepseek: {
    endpoint: 'https://api.deepseek.com/anthropic/v1',
    models: ['deepseek-v4-pro', 'deepseek-v4-flash'],
  },
  openai: {
    endpoint: 'https://api.openai.com/v1',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
  },
  anthropic: {
    endpoint: 'https://api.anthropic.com/v1',
    models: ['claude-fable-5', 'claude-sonnet-4-6', 'claude-opus-4-8', 'claude-haiku-4-5'],
  },
  ollama: {
    endpoint: 'http://localhost:11434/v1',
    models: ['llama3', 'mistral', 'gemma2'],
  },
};

// ===== 战斗公式 =====
// 物理伤害 = (攻击力²) / (攻击力 + 敌方防御力)
// 魔法伤害 = 攻击力 × (1 - 敌方魔抗%)
// 魔抗为百分比属性，上限 100%

// ===== 装备槽位元数据 =====
export const EQUIP_SLOTS: { slot: EquipSlot; label: string; icon: string }[] = [
  { slot: 'weapon', label: '武器', icon: '🗡️' },
  { slot: 'head', label: '头部', icon: '⛑️' },
  { slot: 'chest', label: '胸部', icon: '🛡️' },
  { slot: 'ring', label: '戒指', icon: '💍' },
  { slot: 'necklace', label: '项链', icon: '📿' },
];
