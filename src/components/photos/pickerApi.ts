// Thin client for the Google Photos Picker API: https://developers.google.com/photos/picker

const BASE_URL = 'https://photospicker.googleapis.com/v1';

export interface PickerSession {
    id: string;
    pickerUri: string;
    pollingConfig?: { pollInterval?: string; timeoutIn?: string };
    expireTime?: string;
    mediaItemsSet?: boolean;
}

export interface PickedMediaItem {
    id: string;
    createTime?: string;
    type: 'TYPE_UNSPECIFIED' | 'PHOTO' | 'VIDEO';
    mediaFile: {
        // Valid for 60 minutes and only fetchable with the OAuth token in an Authorization header.
        baseUrl: string;
        mimeType: string;
        filename: string;
        mediaFileMetadata?: { width?: number; height?: number };
    };
}

const DEFAULT_POLL_MS = 5000;
const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000;

function authHeaders(token: string) {
    return { Authorization: `Bearer ${token}` };
}

async function parseJson<T>(response: Response, what: string): Promise<T> {
    if (!response.ok) {
        throw new Error(`${what} failed: ${response.status} ${response.statusText}`.trim());
    }
    return response.json() as Promise<T>;
}

/** Parses a protobuf duration such as "5s" or "0.5s" into milliseconds. */
export function parseDurationMs(duration: string | undefined, fallbackMs: number): number {
    const match = /^(\d+(?:\.\d+)?)s$/.exec(duration ?? '');
    return match ? Math.round(parseFloat(match[1]) * 1000) : fallbackMs;
}

/** The picker UI closes itself after selection when /autoclose is appended. */
export function pickerUriFor(session: PickerSession): string {
    return `${session.pickerUri.replace(/\/$/, '')}/autoclose`;
}

export async function createSession(token: string, maxItemCount = 20): Promise<PickerSession> {
    const response = await fetch(`${BASE_URL}/sessions`, {
        method: 'POST',
        headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
        body: JSON.stringify({ pickingConfig: { maxItemCount: String(maxItemCount) } })
    });
    return parseJson<PickerSession>(response, 'Creating picker session');
}

export async function getSession(token: string, sessionId: string): Promise<PickerSession> {
    const response = await fetch(`${BASE_URL}/sessions/${encodeURIComponent(sessionId)}`, {
        headers: authHeaders(token)
    });
    return parseJson<PickerSession>(response, 'Polling picker session');
}

export async function deleteSession(token: string, sessionId: string): Promise<void> {
    // Best effort cleanup: the session expires on its own, so a failure here is not worth surfacing.
    try {
        await fetch(`${BASE_URL}/sessions/${encodeURIComponent(sessionId)}`, {
            method: 'DELETE',
            headers: authHeaders(token)
        });
    } catch (error) {
        console.warn('Could not delete picker session', error);
    }
}

export async function listPickedItems(token: string, sessionId: string): Promise<PickedMediaItem[]> {
    const items: PickedMediaItem[] = [];
    let pageToken: string | undefined;

    do {
        const params = new URLSearchParams({ sessionId, pageSize: '100' });
        if (pageToken) params.set('pageToken', pageToken);

        const response = await fetch(`${BASE_URL}/mediaItems?${params}`, { headers: authHeaders(token) });
        const page = await parseJson<{ mediaItems?: PickedMediaItem[]; nextPageToken?: string }>(
            response, 'Listing picked items');
        items.push(...(page.mediaItems ?? []));
        pageToken = page.nextPageToken;
    } while (pageToken);

    return items;
}

interface WaitOptions {
    sleep?: (ms: number) => Promise<void>;
    now?: () => number;
    isCancelled?: () => boolean;
}

/**
 * Polls until the user finishes picking. Resolves false if cancelled, throws on expiry.
 * Honors the server's pollInterval/timeoutIn from the session.
 */
export async function waitForSelection(
    token: string,
    session: PickerSession,
    { sleep = (ms) => new Promise((r) => setTimeout(r, ms)), now = Date.now, isCancelled = () => false }: WaitOptions = {}
): Promise<boolean> {
    const intervalMs = parseDurationMs(session.pollingConfig?.pollInterval, DEFAULT_POLL_MS);
    const deadline = now() + parseDurationMs(session.pollingConfig?.timeoutIn, DEFAULT_TIMEOUT_MS);

    while (!isCancelled()) {
        await sleep(intervalMs);
        if (isCancelled()) break;

        const current = await getSession(token, session.id);
        if (current.mediaItemsSet) return true;
        if (now() > deadline) throw new Error('Timed out waiting for photo selection');
    }
    return false;
}

/** Downloads a picked photo, scaled so neither side exceeds maxSize pixels. */
export async function fetchPhotoBlob(token: string, baseUrl: string, maxSize = 1600): Promise<Blob> {
    const response = await fetch(`${baseUrl}=w${maxSize}-h${maxSize}`, { headers: authHeaders(token) });
    if (!response.ok) {
        throw new Error(`Downloading photo failed: ${response.status} ${response.statusText}`.trim());
    }
    return response.blob();
}
