// 酒馆内容格式校验脚本
// 用法: node content/validate.js
const fs = require('fs');
const path = require('path');

const errors = [];

function fail(file, msg) {
  errors.push(`${file}: ${msg}`);
}

// ===== 校验角色卡 =====
function validateCharacter(filePath) {
  const c = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const name = path.basename(filePath);

  // 必填字段
  for (const key of ['id', 'name', 'persona', 'backstory', 'speechStyle', 'baseStats', 'tags', 'initialSkills']) {
    if (!c[key] && c[key] !== 0 && c[key] !== '') fail(name, `缺少必填字段: ${key}`);
  }
  // id 必须是 kebab-case
  if (c.id && !/^[a-z][a-z0-9-]*$/.test(c.id)) fail(name, `id 必须是英文小写kebab-case，当前: "${c.id}"`);
  // baseStats 必须是数字
  if (c.baseStats) {
    const statKeys = ['hp', 'mp', 'atk', 'def', 'agi', 'spi', 'mres', 'stamina'];
    for (const k of statKeys) {
      if (typeof c.baseStats[k] !== 'number') fail(name, `baseStats.${k} 必须是数字，当前: ${typeof c.baseStats[k]}`);
    }
  }
  // initialSkills 必须是长度5的数组
  if (!Array.isArray(c.initialSkills)) {
    fail(name, 'initialSkills 必须是数组');
  } else if (c.initialSkills.length > 5) {
    fail(name, `initialSkills 最多5个，当前${c.initialSkills.length}个`);
  }
  // 检查技能格式
  if (Array.isArray(c.initialSkills)) {
    for (let i = 0; i < c.initialSkills.length; i++) {
      const s = c.initialSkills[i];
      if (s === null) continue;
      for (const sk of ['id', 'name', 'type', 'mpCost', 'multiplier', 'description']) {
        if (!s[sk] && s[sk] !== 0) fail(name, `initialSkills[${i}] 缺少字段: ${sk}`);
      }
      if (s.type && !['physical', 'magic', 'buff'].includes(s.type)) {
        fail(name, `initialSkills[${i}].type 必须是 physical/magic/buff，当前: "${s.type}"`);
      }
    }
  }
  // tags 必须是数组
  if (!Array.isArray(c.tags)) fail(name, 'tags 必须是数组');
  // createdAt 存在即可
  if (c.createdAt === undefined) c.createdAt = 0;
}

// ===== 校验世界书 =====
function validateWorldBook(filePath) {
  const w = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const name = path.basename(filePath);

  for (const key of ['id', 'name', 'description', 'locations', 'loreEntries', 'npcs']) {
    if (!w[key] && w[key] !== '' && !Array.isArray(w[key])) fail(name, `缺少必填字段: ${key}`);
  }
  if (w.id && !/^[a-z][a-z0-9-]*$/.test(w.id)) fail(name, `id 必须是英文小写kebab-case，当前: "${w.id}"`);
  if (!Array.isArray(w.locations)) fail(name, 'locations 必须是数组');
  if (!Array.isArray(w.loreEntries)) fail(name, 'loreEntries 必须是数组');
  if (!Array.isArray(w.npcs)) fail(name, 'npcs 必须是数组');

  // 校验地点
  if (Array.isArray(w.locations)) {
    for (let i = 0; i < w.locations.length; i++) {
      const l = w.locations[i];
      for (const k of ['id', 'name', 'description']) {
        if (!l[k]) fail(name, `locations[${i}] 缺少字段: ${k}`);
      }
      if (!Array.isArray(l.connectedTo)) fail(name, `locations[${i}].connectedTo 必须是数组`);
    }
  }

  // 校验 NPC
  if (Array.isArray(w.npcs)) {
    for (let i = 0; i < w.npcs.length; i++) {
      const n = w.npcs[i];
      for (const k of ['id', 'name', 'description']) {
        if (!n[k]) fail(name, `npcs[${i}] 缺少字段: ${k}`);
      }
    }
  }

  // 校验怪物
  if (Array.isArray(w.monsters)) {
    for (let i = 0; i < w.monsters.length; i++) {
      const m = w.monsters[i];
      for (const k of ['id', 'name', 'type', 'faction', 'race', 'realm', 'description']) {
        if (!m[k]) fail(name, `monsters[${i}] 缺少字段: ${k}`);
      }
      if (m.type && !['小怪', '精英怪', 'Boss'].includes(m.type)) {
        fail(name, `monsters[${i}].type 必须是小怪/精英怪/Boss，当前: "${m.type}"`);
      }
      if (m.stats) {
        for (const sk of ['hp', 'mp', 'atk', 'def', 'agi', 'spi', 'mres']) {
          if (typeof m.stats[sk] !== 'number' && m.stats[sk] !== '未知') fail(name, `monsters[${i}].stats.${sk} 必须是数字或"未知"`);
        }
      }
    }
  }

  // 校验道具
  if (Array.isArray(w.items)) {
    for (let i = 0; i < w.items.length; i++) {
      const it = w.items[i];
      for (const k of ['id', 'name', 'description']) {
        if (!it[k]) fail(name, `items[${i}] 缺少字段: ${k}`);
      }
    }
  }

  // 校验装备
  if (Array.isArray(w.equipment)) {
    for (let i = 0; i < w.equipment.length; i++) {
      const eq = w.equipment[i];
      for (const k of ['id', 'name', 'realm', 'description']) {
        if (!eq[k]) fail(name, `equipment[${i}] 缺少字段: ${k}`);
      }
      if (eq.bonuses && typeof eq.bonuses !== 'object') fail(name, `equipment[${i}].bonuses 必须是对象`);
    }
  }
}

// ===== 扫描并校验 =====
const charsDir = path.join(__dirname, 'characters');
const worldsDir = path.join(__dirname, 'worlds');

if (fs.existsSync(charsDir)) {
  fs.readdirSync(charsDir).forEach(f => {
    if (f.endsWith('.char.json') && !f.startsWith('_')) {
      try { validateCharacter(path.join(charsDir, f)); }
      catch (e) { fail(f, `JSON解析失败: ${e.message}`); }
    }
  });
}

if (fs.existsSync(worldsDir)) {
  fs.readdirSync(worldsDir).forEach(f => {
    if (f.endsWith('.world.json') && !f.startsWith('_')) {
      try { validateWorldBook(path.join(worldsDir, f)); }
      catch (e) { fail(f, `JSON解析失败: ${e.message}`); }
    }
  });
}

// ===== 输出结果 =====
if (errors.length === 0) {
  console.log('✅ 所有文件校验通过！');
} else {
  console.log(`❌ ${errors.length} 个错误:\n`);
  errors.forEach(e => console.log(`  - ${e}`));
  process.exit(1);
}
