// Google Identity Services token flow for the Photos Picker API.
// The Library API read scopes were removed by Google on 2025-03-31; only the picker scope can read a user's photos.

export const PICKER_SCOPE = 'https://www.googleapis.com/auth/photospicker.mediaitems.readonly';

// OAuth client IDs are public. Override per environment with REACT_APP_GOOGLE_CLIENT_ID.
const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID
    ?? '252542497123-6r2k4eh8sn7p2tn8mdujsoofc5fvjgn5.apps.googleusercontent.com';

const GIS_SRC = 'https://accounts.google.com/gsi/client';

// Refresh a little early so a token never expires mid-request.
const EXPIRY_MARGIN_MS = 60_000;

interface TokenResponse {
    access_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
}

interface TokenClient {
    requestAccessToken(overrides?: { prompt?: string }): void;
}

interface GisWindow {
    google?: {
        accounts: {
            oauth2: {
                initTokenClient(config: {
                    client_id: string;
                    scope: string;
                    callback: (resp: TokenResponse) => void;
                    error_callback?: (err: { type: string; message?: string }) => void;
                }): TokenClient;
            };
        };
    };
}

let scriptPromise: Promise<void> | null = null;
let cached: { token: string; expiresAt: number } | null = null;

function loadGis(): Promise<void> {
    if ((window as GisWindow).google?.accounts) return Promise.resolve();
    if (scriptPromise) return scriptPromise;

    scriptPromise = new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = GIS_SRC;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => {
            scriptPromise = null; // allow a retry after a network failure
            reject(new Error('Failed to load Google Identity Services'));
        };
        document.body.appendChild(script);
    });
    return scriptPromise;
}

/**
 * Returns a valid picker-scoped access token, prompting the user only when there is no unexpired one.
 * Must be called from a click handler the first time: the consent popup needs user activation.
 */
export async function requestAccessToken(): Promise<string> {
    if (cached && cached.expiresAt - EXPIRY_MARGIN_MS > Date.now()) return cached.token;

    await loadGis();
    const gis = (window as GisWindow).google;
    if (!gis) throw new Error('Google Identity Services unavailable');

    return new Promise<string>((resolve, reject) => {
        const client = gis.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: PICKER_SCOPE,
            callback: (resp) => {
                if (resp.error || !resp.access_token) {
                    reject(new Error(resp.error_description ?? resp.error ?? 'No access token returned'));
                    return;
                }
                cached = {
                    token: resp.access_token,
                    expiresAt: Date.now() + (resp.expires_in ?? 3600) * 1000
                };
                resolve(resp.access_token);
            },
            // Fires when the user closes the consent popup or the popup is blocked.
            error_callback: (err) => reject(new Error(err.message ?? err.type))
        });
        client.requestAccessToken();
    });
}

export function clearAccessToken() {
    cached = null;
}
