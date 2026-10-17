import type { CardConfig, CardTemplate, CreatedCard } from '../types';
import { TEMPLATES } from '../types';

const TOKEN_KEY = 'lovecard_session_token';
const CARDS_CACHE_KEY = 'lovecard_cards_cache_v2';
const TEMPLATE_STATS_KEY = 'lovecard_template_stats_v2';
const USER_LIKED_TEMPLATES_KEY = 'lovecard_user_liked_templates_v2';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
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
// 1. TEMPLATES STATS & LIKES (ORACLE 19C DA.TEMPLATES)
// ----------------------------------------------------

export async function fetchLiveTemplateStats(): Promise<{
  stats: Record<string, { views: number; hearts: number; uses: number }>;
  likedTemplateIds: string[];
}> {
  try {
    const res = await fetch('/api/templates', {
      headers: getAuthHeaders(),
    });
    if (res.ok) {
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
    console.warn('Could not fetch template stats from backend:', err);
  }

  // Fallback cache
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
  try {
    await fetch(`/api/templates/${encodeURIComponent(templateId)}/view`, { method: 'POST' });
  } catch {}
}

export async function incrementTemplateUse(templateId: string): Promise<void> {
  try {
    await fetch(`/api/templates/${encodeURIComponent(templateId)}/use`, { method: 'POST' });
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

// Toggle Heart: calls POST /api/templates/:templateId/like (Stores in DA.TEMPLATE_LIKES in Oracle)
export async function toggleTemplateHeart(
  templateId: string,
  _userId?: string
): Promise<{ isLiked: boolean; newHearts: number }> {
  try {
    const res = await fetch(`/api/templates/${encodeURIComponent(templateId)}/like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        // Update local cache
        const currentLikes = getUserLikedTemplateIds();
        let updatedLikes: string[];
        if (data.isLiked) {
          updatedLikes = [...currentLikes.filter((id) => id !== templateId), templateId];
        } else {
          updatedLikes = currentLikes.filter((id) => id !== templateId);
        }
        localStorage.setItem(USER_LIKED_TEMPLATES_KEY, JSON.stringify(updatedLikes));

        // Update stats cache
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
// 2. CARDS & CARD IMAGES (ORACLE 19C DA.CARDS & DA.CARD_IMAGES)
// ----------------------------------------------------

// Fetch single card from Oracle 19c
export async function fetchCardById(id: string): Promise<CreatedCard | null> {
  try {
    const res = await fetch(`/api/cards/${encodeURIComponent(id)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.card) {
        cacheCardLocally(data.card);
        return data.card;
      }
    }
  } catch (err) {
    console.warn('Fetch card error from Oracle API:', err);
  }

  // Fallback to local cache if offline or direct template
  return getCardById(id);
}

// Save or update card into Oracle 19c (DA.CARDS & DA.CARD_IMAGES)
export async function saveCard(card: CreatedCard): Promise<CreatedCard> {
  // Update local cache first
  cacheCardLocally(card);

  try {
    const res = await fetch('/api/cards', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(card),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.card) {
        cacheCardLocally(data.card);
        return data.card;
      }
    }
  } catch (err) {
    console.error('Error saving card to Oracle API:', err);
  }

  return card;
}

// Delete card from Oracle 19c
export async function deleteCard(id: string): Promise<void> {
  removeCardFromLocalCache(id);

  try {
    await fetch(`/api/cards/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
  } catch (err) {
    console.error('Error deleting card from Oracle API:', err);
  }
}

// Fetch all cards belonging to current user from Oracle 19c
export async function fetchUserCards(): Promise<CreatedCard[]> {
  try {
    const res = await fetch('/api/users/me/cards', {
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.cards)) {
        localStorage.setItem(CARDS_CACHE_KEY, JSON.stringify(data.cards));
        return data.cards;
      }
    }
  } catch (err) {
    console.warn('Could not fetch user cards from backend:', err);
  }

  // Fallback to cached cards
  return getAllCards();
}

// Increment view count
export async function incrementCardViews(id: string): Promise<number> {
  try {
    await fetch(`/api/cards/${encodeURIComponent(id)}/view`, { method: 'POST' });
  } catch {}
  return 1;
}

// Increment hearts count
export async function incrementCardHearts(id: string): Promise<number> {
  try {
    await fetch(`/api/cards/${encodeURIComponent(id)}/heart`, { method: 'POST' });
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
    f?: string;    // fontFamily
    tc?: string;   // themeColor
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
        f: config.fontFamily,
        tc: config.themeColor,
      },
    };

    const jsonStr = JSON.stringify(payload);
    const utf8Bytes = encodeURIComponent(jsonStr).replace(
      /%([0-9A-F]{2})/g,
      (_, p1) => String.fromCharCode(parseInt(p1, 16))
    );
    return btoa(utf8Bytes);
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

    const cleanEncoded = encodedOrId.replace(/^c_/, '');
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
        fontFamily: data.c?.f || fallbackTemplate.defaultConfig.fontFamily,
        themeColor: data.c?.tc || fallbackTemplate.defaultConfig.themeColor,
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
