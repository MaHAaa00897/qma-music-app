import { Router } from "express";
import { getSupabaseClient } from "../storage/database/supabase-client.ts";

const router = Router();

// 最近播放：每首歌只保留一条最新播放记录，按播放时间倒序
router.get("/", async (_req, res) => {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from("play_history")
      .select("id, played_at, tracks(id, title, artist, album, duration_ms, cover_url, uri)")
      .order("played_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(`查询播放历史失败: ${error.message}`);
    const list = (data ?? [])
      .map((h: any) => (h.tracks ? { ...h.tracks, played_at: h.played_at } : null))
      .filter(Boolean);
    res.json({ data: list });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// 记录一次播放：删除该歌旧记录后插入新记录，保证列表去重且最新在前
router.post("/", async (req, res) => {
  try {
    const trackId: string = req.body?.track_id;
    if (!trackId) {
      res.status(400).json({ error: "track_id 为必填项" });
      return;
    }
    const client = getSupabaseClient();
    const { error: delError } = await client.from("play_history").delete().eq("track_id", trackId);
    if (delError) throw new Error(`更新历史失败: ${delError.message}`);
    const { error: insError } = await client.from("play_history").insert({ track_id: trackId });
    if (insError) throw new Error(`记录播放失败: ${insError.message}`);
    res.status(201).json({ data: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

export default router;