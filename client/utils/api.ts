const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || '';

export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string | null;
  duration_ms: number;
  cover_url?: string | null;
  uri: string;
  played_at?: string;
  created_at?: string;
}

export interface Playlist {
  id: string;
  name: string;
  track_count: number;
  created_at: string;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}/api/v1${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as any)?.error || `请求失败(${res.status})`);
  }
  const json = await res.json();
  return json.data as T;
}

/**
 * 服务端文件：server/src/routes/tracks.ts
 * 接口：GET /api/v1/tracks
 */
export const fetchTracks = () => request<Track[]>('/tracks');

/**
 * 服务端文件：server/src/routes/tracks.ts
 * 接口：POST /api/v1/tracks
 * Body 参数：title: string, artist?: string, album?: string, duration_ms?: number, cover_url?: string, uri: string
 */
export const createTrack = (body: {
  title: string;
  artist?: string;
  album?: string;
  duration_ms?: number;
  cover_url?: string;
  uri: string;
}) =>
  request<Track>('/tracks', {
    method: 'POST',
    body: JSON.stringify(body),
  });

/**
 * 服务端文件：server/src/routes/tracks.ts
 * 接口：DELETE /api/v1/tracks/:id
 */
export const deleteTrack = (id: string) =>
  request<boolean>(`/tracks/${id}`, { method: 'DELETE' });

/**
 * 服务端文件：server/src/routes/playlists.ts
 * 接口：GET /api/v1/playlists
 */
export const fetchPlaylists = () => request<Playlist[]>('/playlists');

/**
 * 服务端文件：server/src/routes/playlists.ts
 * 接口：POST /api/v1/playlists  Body: name: string
 */
export const createPlaylist = (name: string) =>
  request<Playlist>('/playlists', { method: 'POST', body: JSON.stringify({ name }) });

/**
 * 服务端文件：server/src/routes/playlists.ts
 * 接口：PUT /api/v1/playlists/:id  Body: name: string
 */
export const renamePlaylist = (id: string, name: string) =>
  request<boolean>(`/playlists/${id}`, { method: 'PUT', body: JSON.stringify({ name }) });

/**
 * 服务端文件：server/src/routes/playlists.ts
 * 接口：DELETE /api/v1/playlists/:id
 */
export const deletePlaylist = (id: string) =>
  request<boolean>(`/playlists/${id}`, { method: 'DELETE' });

/**
 * 服务端文件：server/src/routes/playlists.ts
 * 接口：GET /api/v1/playlists/:id/tracks
 */
export const fetchPlaylistTracks = (id: string) =>
  request<Track[]>(`/playlists/${id}/tracks`);

/**
 * 服务端文件：server/src/routes/playlists.ts
 * 接口：POST /api/v1/playlists/:id/tracks  Body: track_id: string
 */
export const addTrackToPlaylist = (playlistId: string, trackId: string) =>
  request<{ added: boolean; duplicate?: boolean }>(`/playlists/${playlistId}/tracks`, {
    method: 'POST',
    body: JSON.stringify({ track_id: trackId }),
  });

/**
 * 服务端文件：server/src/routes/playlists.ts
 * 接口：DELETE /api/v1/playlists/:id/tracks/:trackId
 */
export const removeTrackFromPlaylist = (playlistId: string, trackId: string) =>
  request<boolean>(`/playlists/${playlistId}/tracks/${trackId}`, { method: 'DELETE' });

/**
 * 服务端文件：server/src/routes/history.ts
 * 接口：GET /api/v1/history
 */
export const fetchHistory = () => request<Track[]>('/history');

/**
 * 服务端文件：server/src/routes/history.ts
 * 接口：POST /api/v1/history  Body: track_id: string
 */
export const recordHistory = (trackId: string) =>
  request<boolean>('/history', { method: 'POST', body: JSON.stringify({ track_id: trackId }) });