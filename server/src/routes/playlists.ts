import { Router } from "express";
import { getSupabaseClient } from "../storage/database/supabase-client.ts";

const router = Router();

interface PlaylistRow {
  id: string;
  name: string;
  created_at: string;
}

// 创建播放列表
export const createPlaylist = async (name: string) => {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from("playlists")
    .insert({ name })
    .select("id, name, created_at")
    .maybeSingle();
  if (error) throw new Error(`创建播放列表失败: ${error.message}`);
  return data as PlaylistRow;
};

export const renamePlaylist = async (id: string, name: string) => {
  const client = getSupabaseClient();
  const { error } = await client.from("playlists").update({ name }).eq("id", id);
  if (error) throw new Error(`重命名播放列表失败: ${error.message}`);
};

export const deletePlaylist = async (id: string) => {
  const client = getSupabaseClient();
  const { error } = await client.from("playlists").delete().eq("id", id);
  if (error) throw new Error(`删除播放列表失败: ${error.message}`);
};

// 列表页：播放列表 + 歌曲数量
router.get("/", async (_req, res) => {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from("playlists")
      .select("id, name, created_at, playlist_tracks(count)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(`查询播放列表失败: ${error.message}`);
    const list = (data ?? []).map((p: any) => ({
      id: p.id,
      name: p.name,
      created_at: p.created_at,
      track_count: p.playlist_tracks?.[0]?.count ?? 0,
    }));
    res.json({ data: list });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// 查看播放列表内的歌曲
router.get("/:id/tracks", async (req, res) => {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from("playlist_tracks")
      .select("id, position, tracks(id, title, artist, album, duration_ms, cover_url, uri)")
      .eq("playlist_id", req.params.id)
      .order("position", { ascending: true });
    if (error) throw new Error(`查询播放列表歌曲失败: ${error.message}`);
    const list = (data ?? [])
      .map((pt: any) => pt.tracks)
      .filter(Boolean);
    res.json({ data: list });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// 往播放列表加入歌曲
router.post("/:id/tracks", async (req, res) => {
  try {
    const trackId: string = req.body?.track_id;
    if (!trackId) {
      res.status(400).json({ error: "track_id 为必填项" });
      return;
    }
    const client = getSupabaseClient();
    // 避免重复加入
    const { data: existing } = await client
      .from("playlist_tracks")
      .select("id")
      .eq("playlist_id", req.params.id)
      .eq("track_id", trackId)
      .maybeSingle();
    if (existing) {
      res.status(200).json({ data: { added: false, duplicate: true } });
      return;
    }
    const { data: countData, count } = await client
      .from("playlist_tracks")
      .select("id", { count: "exact", head: true })
      .eq("playlist_id", req.params.id);
    void countData;
    const { error } = await client
      .from("playlist_tracks")
      .insert({ playlist_id: req.params.id, track_id: trackId, position: count ?? 0 });
    if (error) throw new Error(`加入歌曲失败: ${error.message}`);
    res.status(201).json({ data: { added: true } });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// 从播放列表移除歌曲
router.delete("/:id/tracks/:trackId", async (req, res) => {
  try {
    const client = getSupabaseClient();
    const { error } = await client
      .from("playlist_tracks")
      .delete()
      .eq("playlist_id", req.params.id)
      .eq("track_id", req.params.trackId);
    if (error) throw new Error(`移除歌曲失败: ${error.message}`);
    res.json({ data: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// 动态路由放最后
router.post("/", async (req, res) => {
  try {
    const name: string = req.body?.name;
    if (!name?.trim()) {
      res.status(400).json({ error: "name 为必填项" });
      return;
    }
    const playlist = await createPlaylist(name.trim());
    res.status(201).json({ data: playlist });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const name: string = req.body?.name;
    if (!name?.trim()) {
      res.status(400).json({ error: "name 为必填项" });
      return;
    }
    await renamePlaylist(req.params.id, name.trim());
    res.json({ data: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await deletePlaylist(req.params.id);
    res.json({ data: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

export default router;