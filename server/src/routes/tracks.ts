import { Router } from "express";
import { getSupabaseClient } from "../storage/database/supabase-client.ts";

const router = Router();

interface TrackRow {
  id: string;
  title: string;
  artist: string;
  album: string | null;
  duration_ms: number;
  cover_url: string | null;
  uri: string;
  created_at: string;
}

// 获取全部歌曲（按创建时间倒序）
export const listTracks = async () => {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from("tracks")
    .select("id, title, artist, album, duration_ms, cover_url, uri, created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`查询歌曲失败: ${error.message}`);
  return (data ?? []) as TrackRow[];
};

export const createTrack = async (body: {
  title: string;
  artist?: string;
  album?: string;
  duration_ms?: number;
  cover_url?: string;
  uri: string;
}) => {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from("tracks")
    .insert({
      title: body.title,
      artist: body.artist || "未知艺术家",
      album: body.album || null,
      duration_ms: body.duration_ms || 0,
      cover_url: body.cover_url || null,
      uri: body.uri,
    })
    .select("id, title, artist, album, duration_ms, cover_url, uri, created_at")
    .maybeSingle();
  if (error) throw new Error(`新增歌曲失败: ${error.message}`);
  return data as TrackRow;
};

export const deleteTrack = async (id: string) => {
  const client = getSupabaseClient();
  const { error } = await client.from("tracks").delete().eq("id", id);
  if (error) throw new Error(`删除歌曲失败: ${error.message}`);
};

router.get("/", async (_req, res) => {
  try {
    const tracks = await listTracks();
    res.json({ data: tracks });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { title, artist, album, duration_ms, cover_url, uri } = req.body || {};
    if (!title || !uri) {
      res.status(400).json({ error: "title 与 uri 为必填项" });
      return;
    }
    const track = await createTrack({ title, artist, album, duration_ms, cover_url, uri });
    res.status(201).json({ data: track });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await deleteTrack(req.params.id);
    res.json({ data: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

export default router;