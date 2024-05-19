import { Component } from "react";
import Look from "./look";

// TODO: Maybe we want these controllable some other way?
const photoWidth = 240;
const photoHeight = 240;

interface LookOccurrenceProps {
    look: Look;
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

    get photos() {
        return this.state.photos;
    }

    // TODO: 'created' should ONLY live in instance
    get created() {
        return this.look.created;
    }

    private get storageKey() {
        return `${this.look.storageKey}.${this.look.created}`;
    }

    private get photosStorageKey() {
        return `${this.storageKey}.photos`;
    }

    addPhoto(options: Photo) {

        const newPhoto = new Photo(options);
        this.setState(prevState => ({
            photos: [...prevState.photos, newPhoto]
        }), () => {
            localStorage.setItem(this.photosStorageKey, JSON.stringify(this.state.photos));
            console.log('hey eric check!');
        });
    }

    constructor(props: LookOccurrenceProps) {
        super(props);
        
        this.look = props.look;

        this.state = {
            photos: []
        };

        const photos = localStorage.getItem(this.photosStorageKey);
        if(photos) {
            const parsed = JSON.parse(photos);
            this.state = {
                photos: parsed
            };
        }

        if(!LookOccurrence.current) {
            LookOccurrence.current = this;
        }
    }

    render() {
        
        const photos = this.state.photos.map(photo => 
            <div key={photo.id} className="photo" 
            style={{
                width: `${photoWidth}px`,
                height: `${photoHeight}px`,
                margin: '4px',
                backgroundImage: `url('${photo.src}=w${photoWidth}-h${photoHeight}')`
            }}>
            </div>
        );

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