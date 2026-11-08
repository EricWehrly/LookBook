import { useEffect, useState } from "react";
import { getPhotoStore } from "./photoStore";

interface StoredPhotoProps {
    id: string;
    width: number;
    height: number;
}

/** Renders a photo previously saved by PhotoPicker, resolving its blob from the photo store. */
export default function StoredPhoto({ id, width, height }: StoredPhotoProps) {
    const [url, setUrl] = useState<string | null>(null);

    useEffect(() => {
        let objectUrl: string | null = null;
        let cancelled = false;

        getPhotoStore().get(id).then((blob) => {
            if (cancelled || !blob) return;
            objectUrl = URL.createObjectURL(blob);
            setUrl(objectUrl);
        }).catch((error) => console.error('Could not load stored photo', id, error));

        return () => {
            cancelled = true;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [id]);

    return <div className="photo" data-photo-id={id}
        style={{
            width: `${width}px`,
            height: `${height}px`,
            backgroundImage: url ? `url('${url}')` : undefined,
            backgroundSize: 'cover'
        }} />;
}
