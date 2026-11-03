import { pgTable, serial, timestamp, varchar, text, integer, index } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// 歌曲（本地导入的音乐元数据）
export const tracks = pgTable(
	"tracks",
	{
		id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
		title: varchar("title", { length: 255 }).notNull(),
		artist: varchar("artist", { length: 255 }).notNull().default("未知艺术家"),
		album: varchar("album", { length: 255 }),
		duration_ms: integer("duration_ms").notNull().default(0),
		cover_url: text("cover_url"),
		uri: text("uri").notNull(), // 设备本地音乐文件 URI
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index("tracks_created_at_idx").on(table.created_at),
	]
);

// 播放列表
export const playlists = pgTable(
	"playlists",
	{
		id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
		name: varchar("name", { length: 128 }).notNull(),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index("playlists_created_at_idx").on(table.created_at),
	]
);

// 播放列表 — 歌曲关联
export const playlistTracks = pgTable(
	"playlist_tracks",
	{
		id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
		playlist_id: varchar("playlist_id", { length: 36 }).notNull().references(() => playlists.id, { onDelete: "cascade" }),
		track_id: varchar("track_id", { length: 36 }).notNull().references(() => tracks.id, { onDelete: "cascade" }),
		position: integer("position").notNull().default(0),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index("playlist_tracks_playlist_idx").on(table.playlist_id),
		index("playlist_tracks_track_idx").on(table.track_id),
	]
);

// 播放历史
export const playHistory = pgTable(
	"play_history",
	{
		id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
		track_id: varchar("track_id", { length: 36 }).notNull().references(() => tracks.id, { onDelete: "cascade" }),
		played_at: timestamp("played_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index("play_history_track_idx").on(table.track_id),
		index("play_history_played_at_idx").on(table.played_at),
	]
);