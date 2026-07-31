/**
 * Centralized API and WebSocket Configuration
 * Reads from environment variables (PUBLIC_API_BASE_URL, PUBLIC_WS_URL)
 * with fallbacks for local development.
 */

export const API_BASE_URL =
  (import.meta.env.PUBLIC_API_BASE_URL as string) || 'http://localhost:3000';

export const WS_URL =
  (import.meta.env.PUBLIC_WS_URL as string) ||
  (API_BASE_URL.startsWith('https')
    ? API_BASE_URL.replace(/^https/, 'wss') + '/ws'
    : API_BASE_URL.replace(/^http/, 'ws') + '/ws');
