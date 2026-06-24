import { useRef } from 'react';
import { Upload } from 'lucide-react';
import type { WorldBook } from '../../types';
import { useWorldStore } from '../../stores/world-store';
import { useAppStore } from '../../stores/app-store';

export function WorldImport() {
  const fileRef = useRef<HTMLInputElement>(null);
  const importWorld = useWorldStore((s) => s.importWorld);
  const addToast = useAppStore((s) => s.addToast);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const world: WorldBook = JSON.parse(text);
      if (!world.id || !world.name || !world.description) {
        throw new Error('世界书缺少必要字段: id, name, description');
      }
      await importWorld(world);
      addToast(`世界「${world.name}」导入成功`, 'success');
    } catch (err: unknown) {
      addToast(`导入失败: ${err instanceof Error ? err.message : String(err)}`, 'error');
    }

    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div>
      <input ref={fileRef} type="file" accept=".json" onChange={handleFile} className="hidden" />
      <button
        onClick={() => fileRef.current?.click()}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-amber-glow text-white rounded-lg hover:bg-ember transition-colors text-sm"
      >
        <Upload size={16} />
        导入世界书
      </button>
    </div>
  );
}
