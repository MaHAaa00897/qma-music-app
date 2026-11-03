export function formatDuration(ms: number): string {
  if (!ms || ms < 0) return '00:00';
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  const mm = m < 10 ? `0${m}` : `${m}`;
  const ss = s < 10 ? `0${s}` : `${s}`;
  return `${mm}:${ss}`;
}

// 简单字符串哈希，用于为曲目稳定分配默认封面
export function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

// 精选音乐氛围封面（Unsplash 真实图片），标题或歌手同名曲目会得到一致的封面
const COVERS: string[] = [
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1458560871784-56d23406c091?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=600&q=80',
];

// 为曲目分配稳定的默认封面
export function coverForTitle(title: string, artist?: string): string {
  const seed = hashString(`${title}-${artist || ''}`);
  return COVERS[seed % COVERS.length];
}

export function fileTitleFromName(name: string): string {
  // 去掉扩展名并截断第一段，作为默认曲名
  const withoutExt = name.replace(/\.[^.]+$/, '').trim();
  return withoutExt || '未命名曲目';
}