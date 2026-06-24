import { useRef } from 'react';
import { Upload } from 'lucide-react';
import type { CharacterCard } from '../../types';
import { useCharacterStore } from '../../stores/character-store';
import { useAppStore } from '../../stores/app-store';

function extractCharFromPNG(buffer: ArrayBuffer): CharacterCard | null {
  const bytes = new Uint8Array(buffer);
  const decoder = new TextDecoder();
  const pngStr = decoder.decode(bytes);

  // Try SillyTavern-style chara metadata
  const charaMatch = pngStr.match(/chara\0([\s\S]*?)(?:\0|$)/);
  if (charaMatch) {
    try {
      const b64 = charaMatch[1].trim();
      return JSON.parse(atob(b64));
    } catch { /* fall through */ }
  }

  // Fallback: search for embedded JSON with character fields
  const jsonMatch = pngStr.match(/\{[\s\S]*"name"[\s\S]*"persona"[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.name && parsed.persona) return parsed;
    } catch { /* nope */ }
  }

  return null;
}

export function CharacterImport() {
  const fileRef = useRef<HTMLInputElement>(null);
  const importCharacter = useCharacterStore((s) => s.importCharacter);
  const addToast = useAppStore((s) => s.addToast);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (file.name.endsWith('.json') || file.name.endsWith('.char.json')) {
        const text = await file.text();
        const card: CharacterCard = JSON.parse(text);
        if (!card.id || !card.name || !card.persona) {
          throw new Error('角色卡缺少必要字段: id, name, persona');
        }
        await importCharacter(card);
        addToast(`角色「${card.name}」导入成功`, 'success');
      } else if (file.name.endsWith('.png')) {
        const buffer = await file.arrayBuffer();
        const card = extractCharFromPNG(buffer);
        if (!card) throw new Error('PNG 中未找到角色卡数据');
        await importCharacter(card);
        addToast(`角色「${card.name}」导入成功`, 'success');
      } else {
        throw new Error('不支持的文件格式，请选择 .json 或 .png 文件');
      }
    } catch (err: unknown) {
      addToast(`导入失败: ${err instanceof Error ? err.message : String(err)}`, 'error');
    }

    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div>
      <input ref={fileRef} type="file" accept=".json,.png" onChange={handleFile} className="hidden" />
      <button
        onClick={() => fileRef.current?.click()}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-amber-glow text-white rounded-lg hover:bg-ember transition-colors text-sm"
      >
        <Upload size={16} />
        导入角色卡
      </button>
    </div>
  );
}
