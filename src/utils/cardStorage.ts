import type { CardConfig, CardTemplate, CreatedCard } from '../types';
import { TEMPLATES } from '../types';
import { supabase, isSupabaseReady } from './supabaseClient';
import { BACKEND_URL, getTunnelHeaders } from './apiConfig';

const TOKEN_KEY = 'lovecard_session_token';
const CARDS_CACHE_KEY = 'lovecard_cards_cache_v2';
const TEMPLATE_STATS_KEY = 'lovecard_template_stats_v2';
const USER_LIKED_TEMPLATES_KEY = 'lovecard_user_liked_templates_v2';

function getCurrentUserId(): string | null {
  try {
    const raw = localStorage.getItem('lovecard_user_v2');
    if (raw) {
      const u = JSON.parse(raw);
      return u?.id || null;
    }
  } catch {}
  return null;
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem(TOKEN_KEY);
  return getTunnelHeaders(token ? { Authorization: `Bearer ${token}` } : {});
}

// Generate unique short ID for card
export function generateShortId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'lc_';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Format numbers nicely: 1250 -> 1.3k
export function formatStat(num: number): string {
  if (!num || num === 0) return '0';
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace('.0', '') + 'k';
  }
  return num.toString();
}

// ----------------------------------------------------
// 1. TEMPLATES STATS & LIKES (SUPABASE & ORACLE FALLBACK)
// ----------------------------------------------------

export async function fetchLiveTemplateStats(): Promise<{
  stats: Record<string, { views: number; hearts: number; uses: number }>;
  likedTemplateIds: string[];
}> {
  // 1. Supabase Cloud Sync
  if (isSupabaseReady && supabase) {
    try {
      const { data: tmplData } = await supabase.from('templates').select('*');
      const stats: Record<string, { views: number; hearts: number; uses: number }> = {};
      if (tmplData) {
        tmplData.forEach((row: any) => {
          stats[row.id] = {
            views: row.views_count || 0,
            hearts: row.hearts_count || 0,
            uses: row.uses_count || 0,
          };
        });
      }

      const uid = getCurrentUserId();
      let likedIds: string[] = [];
      if (uid) {
        const { data: likesData } = await supabase
          .from('template_likes')
          .select('template_id')
          .eq('user_id', uid);
        if (likesData) {
          likedIds = likesData.map((l: any) => l.template_id);
        }
      }

      localStorage.setItem(TEMPLATE_STATS_KEY, JSON.stringify(stats));
      if (uid) {
        localStorage.setItem(USER_LIKED_TEMPLATES_KEY, JSON.stringify(likedIds));
      }

      return { stats, likedTemplateIds: likedIds };
    } catch (err) {
      console.warn('Supabase fetch templates stats fallback:', err);
    }
  }

  // 2. Oracle 19c local API fallback
  try {
    const res = await fetch(`${BACKEND_URL}/api/templates`, {
      headers: getAuthHeaders(),
    });
    const isJson = res.headers.get('content-type')?.includes('application/json');
    if (res.ok && isJson) {
      const data = await res.json();
      if (data.success) {
        localStorage.setItem(TEMPLATE_STATS_KEY, JSON.stringify(data.stats));
        if (data.likedTemplateIds) {
          localStorage.setItem(USER_LIKED_TEMPLATES_KEY, JSON.stringify(data.likedTemplateIds));
        }
        return {
          stats: data.stats || {},
          likedTemplateIds: data.likedTemplateIds || [],
        };
      }
    }
  } catch (err) {
    // Vercel static fallback
  }

  // 3. Fallback cache
  try {
    const raw = localStorage.getItem(TEMPLATE_STATS_KEY);
    const rawLiked = localStorage.getItem(USER_LIKED_TEMPLATES_KEY);
    return {
      stats: raw ? JSON.parse(raw) : {},
      likedTemplateIds: rawLiked ? JSON.parse(rawLiked) : [],
    };
  } catch {
    return { stats: {}, likedTemplateIds: [] };
  }
}

export function getTemplateLiveStats(templateId: string): { views: number; hearts: number; uses: number } {
  try {
    const raw = localStorage.getItem(TEMPLATE_STATS_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data && data[templateId]) {
        return {
          views: data[templateId].views || 0,
          hearts: data[templateId].hearts || 0,
          uses: data[templateId].uses || 0,
        };
      }
    }
  } catch {}
  return { views: 0, hearts: 0, uses: 0 };
}

export async function incrementTemplateView(templateId: string): Promise<void> {
  if (isSupabaseReady && supabase) {
    try {
      const { data } = await supabase.from('templates').select('views_count').eq('id', templateId).maybeSingle();
      const current = data?.views_count || 0;
      await supabase.from('templates').upsert({ id: templateId, views_count: current + 1, updated_at: new Date().toISOString() });
      return;
    } catch {}
  }
  try {
    await fetch(`${BACKEND_URL}/api/templates/${encodeURIComponent(templateId)}/view`, {
      method: 'POST',
      headers: getTunnelHeaders(),
    });
  } catch {}
}

export async function incrementTemplateUse(templateId: string): Promise<void> {
  if (isSupabaseReady && supabase) {
    try {
      const { data } = await supabase.from('templates').select('uses_count').eq('id', templateId).maybeSingle();
      const current = data?.uses_count || 0;
      await supabase.from('templates').upsert({ id: templateId, uses_count: current + 1, updated_at: new Date().toISOString() });
      return;
    } catch {}
  }
  try {
    await fetch(`${BACKEND_URL}/api/templates/${encodeURIComponent(templateId)}/use`, {
      method: 'POST',
      headers: getTunnelHeaders(),
    });
  } catch {}
}

export function getUserLikedTemplateIds(_userId?: string | null): string[] {
  try {
    const raw = localStorage.getItem(USER_LIKED_TEMPLATES_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function isTemplateLikedByUser(templateId: string, _userId?: string | null): boolean {
  const list = getUserLikedTemplateIds();
  return list.includes(templateId);
}

// Toggle Heart
export async function toggleTemplateHeart(
  templateId: string,
  userIdParam?: string
): Promise<{ isLiked: boolean; newHearts: number }> {
  const uid = userIdParam || getCurrentUserId() || 'guest';

  // 1. Supabase Cloud Sync
  if (isSupabaseReady && supabase) {
    try {
      const { data: existing } = await supabase
        .from('template_likes')
        .select('*')
        .eq('user_id', uid)
        .eq('template_id', templateId)
        .maybeSingle();

      const { data: tmpl } = await supabase
        .from('templates')
        .select('hearts_count')
        .eq('id', templateId)
        .maybeSingle();

      let hearts = tmpl?.hearts_count || 0;
      let isLiked = false;

      if (existing) {
        // Unlike
        await supabase.from('template_likes').delete().eq('user_id', uid).eq('template_id', templateId);
        hearts = Math.max(0, hearts - 1);
        isLiked = false;
      } else {
        // Like
        await supabase.from('template_likes').insert({ user_id: uid, template_id: templateId });
        hearts += 1;
        isLiked = true;
      }

      await supabase.from('templates').upsert({ id: templateId, hearts_count: hearts, updated_at: new Date().toISOString() });

      // Update local storage
      const currentLikes = getUserLikedTemplateIds();
      let updatedLikes: string[];
      if (isLiked) {
        updatedLikes = [...currentLikes.filter((id) => id !== templateId), templateId];
      } else {
        updatedLikes = currentLikes.filter((id) => id !== templateId);
      }
      localStorage.setItem(USER_LIKED_TEMPLATES_KEY, JSON.stringify(updatedLikes));

      const rawStats = localStorage.getItem(TEMPLATE_STATS_KEY);
      const statsData = rawStats ? JSON.parse(rawStats) : {};
      if (!statsData[templateId]) statsData[templateId] = { views: 0, hearts: 0, uses: 0 };
      statsData[templateId].hearts = hearts;
      localStorage.setItem(TEMPLATE_STATS_KEY, JSON.stringify(statsData));

      return { isLiked, newHearts: hearts };
    } catch (err) {
      console.warn('Supabase toggleTemplateHeart error:', err);
    }
  }

  // 2. Oracle 19c local API fallback
  try {
    const res = await fetch(`${BACKEND_URL}/api/templates/${encodeURIComponent(templateId)}/like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        const currentLikes = getUserLikedTemplateIds();
        let updatedLikes: string[];
        if (data.isLiked) {
          updatedLikes = [...currentLikes.filter((id) => id !== templateId), templateId];
        } else {
          updatedLikes = currentLikes.filter((id) => id !== templateId);
        }
        localStorage.setItem(USER_LIKED_TEMPLATES_KEY, JSON.stringify(updatedLikes));

        const rawStats = localStorage.getItem(TEMPLATE_STATS_KEY);
        const statsData = rawStats ? JSON.parse(rawStats) : {};
        if (statsData[templateId]) {
          statsData[templateId].hearts = data.newHearts;
          localStorage.setItem(TEMPLATE_STATS_KEY, JSON.stringify(statsData));
        }

        return { isLiked: data.isLiked, newHearts: data.newHearts };
      }
    }
  } catch (err) {
    console.warn('Toggle template heart error:', err);
  }
  return { isLiked: false, newHearts: 0 };
}

export function getLikedTemplates(userId: string | null): CardTemplate[] {
  const likedIds = getUserLikedTemplateIds(userId);
  return TEMPLATES.filter((t) => likedIds.includes(t.id));
}

// ----------------------------------------------------
// 2. CARDS & CARD IMAGES (SUPABASE & ORACLE CLOUD/LOCAL)
// ----------------------------------------------------

// Fetch single card from Supabase or Oracle 19c
export async function fetchCardById(id: string): Promise<CreatedCard | null> {
  // 1. Supabase Cloud fetch
  if (isSupabaseReady && supabase) {
    try {
      const { data, error } = await supabase.from('cards').select('*').eq('id', id).maybeSingle();
      if (!error && data) {
        const card: CreatedCard = {
          id: data.id,
          creatorId: data.user_id,
          templateId: data.template_id,
          title: data.template_id,
          cardData: data.card_data,
          viewsCount: data.views_count || 1,
          heartsCount: data.hearts_count || 0,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
        cacheCardLocally(card);
        return card;
      }
    } catch (err) {
      console.warn('Supabase fetchCardById fallback:', err);
    }
  }

  // 2. Oracle 19c local API fallback
  try {
    const res = await fetch(`${BACKEND_URL}/api/cards/${encodeURIComponent(id)}`, {
      headers: getAuthHeaders(),
    });
    const isJson = res.headers.get('content-type')?.includes('application/json');
    if (res.ok && isJson) {
      const data = await res.json();
      if (data.success && data.card) {
        cacheCardLocally(data.card);
        return data.card;
      }
    }
  } catch (err) {
    // Vercel static fallback
  }

  // 3. Fallback to local cache if offline or direct template
  return getCardById(id);
}

// Save or update card into Supabase or Oracle 19c
export async function saveCard(card: CreatedCard): Promise<CreatedCard> {
  // Update local cache first
  cacheCardLocally(card);

  // 1. Save to Supabase Cloud
  if (isSupabaseReady && supabase) {
    try {
      const row = {
        id: card.id,
        user_id: card.creatorId || getCurrentUserId() || null,
        template_id: card.templateId,
        sender_name: card.cardData?.senderName || null,
        recipient_name: card.cardData?.recipientName || null,
        wish_message: card.cardData?.mainText || null,
        card_data: card.cardData,
        views_count: card.viewsCount || 1,
        hearts_count: card.heartsCount || 0,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('cards').upsert(row);
      if (!error) {
        return card;
      }
      console.warn('Supabase upsert card error:', error);
    } catch (err) {
      console.warn('Supabase saveCard fallback:', err);
    }
  }

  // 2. Save to Oracle 19c local API fallback
  try {
    const res = await fetch(`${BACKEND_URL}/api/cards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(card),
    });

    const isJson = res.headers.get('content-type')?.includes('application/json');
    if (res.ok && isJson) {
      const data = await res.json();
      if (data.success && data.card) {
        cacheCardLocally(data.card);
        return data.card;
      }
    }
  } catch (err) {
    // Vercel static fallback
  }

  return card;
}

// Delete card
export async function deleteCard(id: string): Promise<void> {
  removeCardFromLocalCache(id);

  if (isSupabaseReady && supabase) {
    try {
      await supabase.from('cards').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase deleteCard error:', err);
    }
  }

  try {
    await fetch(`${BACKEND_URL}/api/cards/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
  } catch (err) {
    // Vercel static fallback
  }
}

// Fetch all cards belonging to current user
export async function fetchUserCards(): Promise<CreatedCard[]> {
  const currentUid = getCurrentUserId();

  // 1. Fetch from Supabase Cloud
  if (isSupabaseReady && supabase && currentUid) {
    try {
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .eq('user_id', currentUid)
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        const cards: CreatedCard[] = data.map((d: any) => ({
          id: d.id,
          creatorId: d.user_id,
          templateId: d.template_id,
          title: d.template_id,
          cardData: d.card_data,
          viewsCount: d.views_count || 1,
          heartsCount: d.hearts_count || 0,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
        }));
        localStorage.setItem(CARDS_CACHE_KEY, JSON.stringify(cards));
        return cards;
      }
    } catch (err) {
      console.warn('Supabase fetchUserCards fallback:', err);
    }
  }

  // 2. Fetch from Oracle 19c local API
  try {
    const res = await fetch(`${BACKEND_URL}/api/users/me/cards`, {
      headers: getAuthHeaders(),
    });
    const isJson = res.headers.get('content-type')?.includes('application/json');
    if (res.ok && isJson) {
      const data = await res.json();
      if (data.success && Array.isArray(data.cards)) {
        localStorage.setItem(CARDS_CACHE_KEY, JSON.stringify(data.cards));
        return data.cards;
      }
    }
  } catch (err) {
    // Vercel static fallback
  }

  // 3. Fallback to cached cards
  return getAllCards();
}

// Increment view count
export async function incrementCardViews(id: string): Promise<number> {
  if (isSupabaseReady && supabase) {
    try {
      const { data } = await supabase.from('cards').select('views_count').eq('id', id).maybeSingle();
      const current = data?.views_count || 0;
      await supabase.from('cards').update({ views_count: current + 1 }).eq('id', id);
      return current + 1;
    } catch {}
  }
  try {
    await fetch(`${BACKEND_URL}/api/cards/${encodeURIComponent(id)}/view`, {
      method: 'POST',
      headers: getTunnelHeaders(),
    });
  } catch {}
  return 1;
}

// Increment hearts count
export async function incrementCardHearts(id: string): Promise<number> {
  if (isSupabaseReady && supabase) {
    try {
      const { data } = await supabase.from('cards').select('hearts_count').eq('id', id).maybeSingle();
      const current = data?.hearts_count || 0;
      await supabase.from('cards').update({ hearts_count: current + 1 }).eq('id', id);
      return current + 1;
    } catch {}
  }
  try {
    await fetch(`${BACKEND_URL}/api/cards/${encodeURIComponent(id)}/heart`, {
      method: 'POST',
      headers: getTunnelHeaders(),
    });
  } catch {}
  return 1;
}

// ----------------------------------------------------
// LOCAL CACHE HELPERS
// ----------------------------------------------------

function cacheCardLocally(card: CreatedCard) {
  try {
    const cards = getAllCards();
    const index = cards.findIndex((c) => c.id === card.id);
    let updated: CreatedCard[];
    if (index >= 0) {
      updated = [...cards];
      updated[index] = card;
    } else {
      updated = [card, ...cards];
    }
    localStorage.setItem(CARDS_CACHE_KEY, JSON.stringify(updated));
  } catch {}
}

function removeCardFromLocalCache(id: string) {
  try {
    const cards = getAllCards();
    const updated = cards.filter((c) => c.id !== id);
    localStorage.setItem(CARDS_CACHE_KEY, JSON.stringify(updated));
  } catch {}
}

export function getAllCards(): CreatedCard[] {
  try {
    const raw = localStorage.getItem(CARDS_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getUserCards(userId: string | null): CreatedCard[] {
  const all = getAllCards();
  if (userId) {
    return all.filter((c) => c.creatorId === userId);
  }
  return all.filter((c) => !c.creatorId || c.creatorId === 'guest');
}

export function getCardById(id: string): CreatedCard | null {
  const cards = getAllCards();
  const cleanId = id.replace(/^demo-/, '');
  const found = cards.find((c) => c.id === id || c.id === cleanId || c.id === `demo-${cleanId}`);
  if (found) return found;

  const tmpl = TEMPLATES.find((t) => t.id === cleanId || t.id === id);
  if (tmpl) {
    return {
      id: tmpl.id,
      creatorId: null,
      templateId: tmpl.id,
      title: tmpl.titleVi,
      cardData: {
        ...tmpl.defaultConfig,
        images: [], // Tuyệt đối không dùng ảnh mẫu
      },
      viewsCount: 1,
      heartsCount: 0,
      createdAt: new Date().toLocaleDateString('vi-VN'),
      updatedAt: new Date().toLocaleDateString('vi-VN'),
    };
  }
  return null;
}

// ----------------------------------------------------
// QR-Safe URL Encoding & Decoding (Never Overflows URL)
// ----------------------------------------------------

interface CompactPayload {
  t: string;       // templateId
  id?: string;     // card shortId for hydration from Oracle
  c: {
    r: string;     // recipientName
    s: string;     // senderName
    m: string;     // mainText
    p?: string;    // passcode
    ph?: string;   // passcodeHint
    a?: string;    // audioUrl
    mp?: string;   // musicPreset
    ast?: number;  // audioStartTime
    aet?: number;  // audioEndTime
    f?: string;    // fontFamily
    tc?: string;   // themeColor
    ct?: 'cyan' | 'purple' | 'rose' | 'gold' | 'midnight'; // crystalTheme
    cc?: 'rose' | 'heart' | 'swans' | 'castle' | 'teddy';  // crystalCenterpiece
    cw?: 'snow' | 'sparkles' | 'petals' | 'hearts' | 'notes'; // crystalWeather
    cbt?: string;  // crystalBaseTitle
    cbs?: string;  // crystalBaseSubtitle
    cq?: string[]; // crystalQuotes
    ccap?: string[]; // cinemaCaptions
  };
}

export function encodeCardData(
  templateId: string,
  config: CardConfig,
  cardId?: string
): string {
  try {
    const payload: CompactPayload = {
      t: templateId,
      id: cardId,
      c: {
        r: config.recipientName,
        s: config.senderName,
        m: config.mainText,
        p: config.passcode,
        ph: config.passcodeHint,
        a: config.audioUrl,
        mp: config.musicPreset,
        ast: config.audioStartTime,
        aet: config.audioEndTime,
        f: config.fontFamily,
        tc: config.themeColor,
        ct: config.crystalTheme,
        cc: config.crystalCenterpiece,
        cw: config.crystalWeather,
        cbt: config.crystalBaseTitle,
        cbs: config.crystalBaseSubtitle,
        cq: config.crystalQuotes,
        ccap: config.cinemaCaptions,
      },
    };

    const jsonStr = JSON.stringify(payload);
    const utf8Bytes = encodeURIComponent(jsonStr).replace(
      /%([0-9A-F]{2})/g,
      (_, p1) => String.fromCharCode(parseInt(p1, 16))
    );
    // Mã hóa Base64 URL-safe (thay + bằng -, / bằng _, bỏ padding =)
    const rawBase64 = btoa(utf8Bytes);
    return rawBase64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch (err) {
    console.error('Error encoding card data:', err);
    return '';
  }
}

export function decodeCardData(
  encodedOrId: string,
  fallbackTemplate: CardTemplate
): { templateId: string; config: CardConfig; cardId?: string } {
  try {
    // Check if direct shortId like lc_...
    if (encodedOrId.startsWith('lc_')) {
      const stored = getCardById(encodedOrId);
      if (stored) {
        return {
          templateId: stored.templateId,
          config: {
            ...stored.cardData,
            images: stored.cardData?.images || [],
          },
          cardId: stored.id,
        };
      }
    }

    let cleanEncoded = encodedOrId.replace(/^c_/, '');
    // Chuyển đổi ngược Base64 URL-safe về Base64 chuẩn
    cleanEncoded = cleanEncoded.replace(/-/g, '+').replace(/_/g, '/');
    while (cleanEncoded.length % 4 !== 0) {
      cleanEncoded += '=';
    }

    const binaryStr = atob(cleanEncoded);
    const jsonStr = decodeURIComponent(
      binaryStr
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const data: CompactPayload = JSON.parse(jsonStr);

    return {
      templateId: data.t || fallbackTemplate.id,
      cardId: data.id,
      config: {
        recipientName: data.c?.r || fallbackTemplate.defaultConfig.recipientName,
        senderName: data.c?.s || fallbackTemplate.defaultConfig.senderName,
        mainText: data.c?.m || fallbackTemplate.defaultConfig.mainText,
        passcode: data.c?.p || fallbackTemplate.defaultConfig.passcode,
        passcodeHint: data.c?.ph || fallbackTemplate.defaultConfig.passcodeHint,
        audioUrl: data.c?.a || fallbackTemplate.defaultConfig.audioUrl,
        musicPreset: data.c?.mp || fallbackTemplate.defaultConfig.musicPreset,
        audioStartTime: data.c?.ast ?? fallbackTemplate.defaultConfig.audioStartTime,
        audioEndTime: data.c?.aet ?? fallbackTemplate.defaultConfig.audioEndTime,
        fontFamily: data.c?.f || fallbackTemplate.defaultConfig.fontFamily,
        themeColor: data.c?.tc || fallbackTemplate.defaultConfig.themeColor,
        crystalTheme: data.c?.ct || fallbackTemplate.defaultConfig.crystalTheme,
        crystalCenterpiece: data.c?.cc || fallbackTemplate.defaultConfig.crystalCenterpiece,
        crystalWeather: data.c?.cw || fallbackTemplate.defaultConfig.crystalWeather,
        crystalBaseTitle: data.c?.cbt || fallbackTemplate.defaultConfig.crystalBaseTitle,
        crystalBaseSubtitle: data.c?.cbs || fallbackTemplate.defaultConfig.crystalBaseSubtitle,
        crystalQuotes: data.c?.cq || fallbackTemplate.defaultConfig.crystalQuotes,
        cinemaCaptions: data.c?.ccap || fallbackTemplate.defaultConfig.cinemaCaptions,
        images: [], // Default to empty array - only user images are loaded
      },
    };
  } catch (err) {
    console.warn('Could not decode card data, using fallback:', err);
    return {
      templateId: fallbackTemplate.id,
      config: {
        ...fallbackTemplate.defaultConfig,
        images: [],
      },
    };
  }
}
