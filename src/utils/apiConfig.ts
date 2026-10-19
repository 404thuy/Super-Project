/**
 * API Configuration for LoveCard 20/10
 * Connects directly to local Node.js + Oracle 19c backend via public tunnel
 */

export const BACKEND_URL = 
  import.meta.env.VITE_API_URL || 
  (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5000'
    : 'https://lovecard-2010.loca.lt');

export function getTunnelHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  return {
    'Bypass-Tunnel-Reminder': 'true',
    'bypass-tunnel-reminder': 'true',
    ...extraHeaders,
  };
}
