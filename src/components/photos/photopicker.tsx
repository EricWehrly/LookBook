import { useEffect, useRef, useState } from "react";
import { LookOccurrence } from "../looks/lookOccurrence";
import { requestAccessToken } from "./pickerAuth";
import {
    PickerSession, createSession, deleteSession, fetchPhotoBlob,
    listPickedItems, pickerUriFor, waitForSelection
} from "./pickerApi";
import { getPhotoStore } from "./photoStore";

type Phase =
    | { name: 'idle' }
    | { name: 'authorizing' }
    | { name: 'waiting'; pickerUri: string }
    | { name: 'importing'; done: number; total: number }
    | { name: 'error'; message: string };

/**
 * Adds photos to the current look via the Google Photos Picker API.
 * The picker URL is shown as a link rather than auto-opened: the session is created
 * asynchronously, after the click's user activation is gone, so window.open would be popup-blocked.
 */
export default function PhotoPicker() {
    const [phase, setPhase] = useState<Phase>({ name: 'idle' });
    const cancelled = useRef(false);

    useEffect(() => {
        cancelled.current = false;
        return () => { cancelled.current = true; };
    }, []);

    const start = async () => {
        let token: string | undefined;
        let session: PickerSession | undefined;
        try {
            setPhase({ name: 'authorizing' });
            token = await requestAccessToken();
            session = await createSession(token);
            setPhase({ name: 'waiting', pickerUri: pickerUriFor(session) });

            const picked = await waitForSelection(token, session, { isCancelled: () => cancelled.current });
            if (!picked) return;

            const items = (await listPickedItems(token, session.id)).filter((item) => item.type === 'PHOTO');
            const store = getPhotoStore();
            for (let i = 0; i < items.length; i++) {
                if (cancelled.current) return;
                setPhase({ name: 'importing', done: i, total: items.length });

                const blob = await fetchPhotoBlob(token, items[i].mediaFile.baseUrl);
                const id = crypto.randomUUID();
                await store.put(id, blob);
                LookOccurrence.Current?.addPhoto({ id, src: `stored:${id}` });
            }
            setPhase({ name: 'idle' });
        } catch (error) {
            console.error(error);
            setPhase({ name: 'error', message: error instanceof Error ? error.message : String(error) });
        } finally {
            if (token && session) await deleteSession(token, session.id);
        }
    };

    return <div className="photoPicker">
        {(phase.name === 'idle' || phase.name === 'error') &&
            <button onClick={start}>Add photos from Google Photos</button>}
        {phase.name === 'authorizing' && <span>Connecting to Google…</span>}
        {phase.name === 'waiting' &&
            <a href={phase.pickerUri} target="_blank" rel="noreferrer">
                Choose photos in Google Photos (opens a new tab)
            </a>}
        {phase.name === 'importing' &&
            <span>Importing photo {phase.done + 1} of {phase.total}…</span>}
        {phase.name === 'error' && <p role="alert">{phase.message}</p>}
    </div>;
}
