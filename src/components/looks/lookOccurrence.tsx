import { Component } from "react";
import Look from "./look";
import './lookOccurrence.css';
import { readJson, writeJson } from "../util/storage";
import StoredPhoto from "../photos/storedPhoto";
import { getPhotoStore } from "../photos/photoStore";

// Photo.src values with this prefix point at a blob in the photo store; anything else is a remote URL.
const STORED_PREFIX = 'stored:';

const DEFAULT_PHOTO_WIDTH = 240;
const DEFAULT_PHOTO_HEIGHT = 240;

interface LookOccurrenceProps {
    look: Look;
    // The day this occurrence is for. Defaults to the look's own date.
    created?: Date;
    photoWidth?: number;
    photoHeight?: number;
  }

interface LookOccurrenceState {
    photos: Photo[];
}

export class LookOccurrence extends Component<LookOccurrenceProps, LookOccurrenceState> {

    private static current : LookOccurrence;

    static get Current() {
        return LookOccurrence.current;
    }

    look: Look;
    created: Date;

    get photos() {
        return this.state.photos;
    }

    // The key embeds Date#toString of the occurrence date; changing that format orphans every stored photo list.
    private get storageKey() {
        return `${this.look.storageKey}.${this.created}`;
    }

    private get photosStorageKey() {
        return `${this.storageKey}.photos`;
    }

    addPhoto(options: Photo) {

        const newPhoto = new Photo(options);
        this.setState(prevState => ({
            photos: [...prevState.photos, newPhoto]
        }), () => {
            writeJson(this.photosStorageKey, this.state.photos);
        });
    }

    removePhoto(photo: Photo) {

        this.setState(prevState => ({
            photos: prevState.photos.filter(p => p.id !== photo.id)
        }), () => {
            writeJson(this.photosStorageKey, this.state.photos);
        });

        if (photo.src.startsWith(STORED_PREFIX)) {
            getPhotoStore().delete(photo.src.slice(STORED_PREFIX.length))
                .catch((error) => console.error('Could not delete stored photo', photo.id, error));
        }
    }

    constructor(props: LookOccurrenceProps) {
        super(props);

        this.look = props.look;
        this.created = props.created ?? props.look.created;

        const photos = readJson<Photo[]>(this.photosStorageKey);
        this.state = {
            photos: Array.isArray(photos) ? photos : []
        };

        if(!LookOccurrence.current) {
            LookOccurrence.current = this;
        }
    }

    render() {

        const photoWidth = this.props.photoWidth ?? DEFAULT_PHOTO_WIDTH;
        const photoHeight = this.props.photoHeight ?? DEFAULT_PHOTO_HEIGHT;

        const photos = this.state.photos.map(photo => <div key={photo.id} className="photoItem">
            {photo.src.startsWith(STORED_PREFIX)
                ? <StoredPhoto id={photo.src.slice(STORED_PREFIX.length)}
                    width={photoWidth} height={photoHeight} />
                : <div className="photo"
                    style={{
                        width: `${photoWidth}px`,
                        height: `${photoHeight}px`,
                        backgroundImage: `url('${photo.src}=w${photoWidth}-h${photoHeight}')`
                    }} />}
            <button type="button" className="removePhoto" aria-label="Remove photo"
                onClick={() => this.removePhoto(photo)}>&times;</button>
        </div>);

        return <div className="lookOccurrence">
            {photos}
        </div>
    }
}

export class Photo {

    id?: string;
    src: string;

    constructor(options: Photo) {

        this.src = options.src;
        this.id = options.id;
    }
}
