import { Component } from "react";
import Look from "./look";

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
            this.setState({
                photos: parsed
            });
        }

        if(!LookOccurrence.current) {
            LookOccurrence.current = this;
        }
    }

    render() {
        

        const photos = this.state.photos.map(photo => 
            <div key={photo.id} className="photo" 
            style={{
                width: '240px',
                height: '240px',
                backgroundImage: `url('${photo.src}=w240-h240')`
            }}>
            </div>
        );

        return <>
            and here are your photos:
            {photos}
        </>
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