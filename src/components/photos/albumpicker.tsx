import { Component } from "react";
import { default as GoogleAuthService } from './googleAuthService.mjs';
import GooglePhotosService from "./googlePhotoService.mjs";
import './albumpicker.css';
import Look from "../looks/look";

interface GooglePhotoAlbum {
    id: string,
    coverPhotoMediaItemId: string,
    coverPhotoBaseUrl: string,
    mediaItemsCount: number,
    productUrl: string,
    title: string
}

interface GooglePhoto {
    baseUrl: string,
    filename: string,
    id: string,
    mimeType: string,
    productUrl: string,

    mediaMetadata?: {
        creationTime?: Date,
        height?: number,
        width?: number
    },

    selected: boolean
}

interface AlbumPickerState {
    albums: GooglePhotoAlbum[],
    // TODO: Extract to separate component ...
    photos: GooglePhoto[]
}

export default class AlbumPicker extends Component {

    photoService : GooglePhotosService;
    state: AlbumPickerState;

    constructor(props: any) {
        super(props);

        this.photoService = new GooglePhotosService();
        this.state = {
            albums: [],
            photos: []
        };

        if(GoogleAuthService.authorized) {
            this.#onAuthenticated.bind(this)();
        } else {
            window.addEventListener('google-authenticated', this.#onAuthenticated.bind(this));
        }
    }

    render() {
        const photoContent = this.#getPhotoContent();
        const albumContent = this.#getAlbumContent();
        const content = photoContent ? photoContent : albumContent;
        return <div id='albumPicker'>
            {content}
        </div>
    }

    #getAlbumContent() {

        return GoogleAuthService.authorized ? this.state.albums.map(album => 
            <div key={album.id} className="album" 
                onClick={(event) => this.#pickAlbum.bind(this)(album.id)}
                style={{
                backgroundImage: `url('${album.coverPhotoBaseUrl}=w240-h240')`
            }}>
                {album.title}
            </div>
        ) : null;
    }

    #getPhotoContent() {
        // TODO: (if we have the metadata) math up requesting photo in existing aspect ratio
        return GoogleAuthService.authorized && this.state.photos.length > 0
        ? this.state.photos.map(photo => 
            <div key={photo.id} className="photo"
            onClick={(event) => this.#pickPhoto.bind(this)(photo.id)}
            style={{
                backgroundImage: `url('${photo.baseUrl}=w240-h240')`
            }}
            ></div>
        ) : null;
    }

    async #pickAlbum(id: string) {

        const albumDetails = await this.photoService.loadAlbumDetail(id);
        const nextPageToken = albumDetails.result.nextPageToken;
        const photos : GooglePhoto[] = albumDetails.result.mediaItems;
        this.setState({
            photos
        });
        console.log(albumDetails);

        // quit rendering album picker and render photo picker instead
    }

    async #pickPhoto(id: string) {

        console.log(id);
        const photos = this.state.photos.filter(photo => photo.id == id);
        console.log(photos);
        photos[0].selected = !photos[0].selected;
        Look.Current.addPhoto({
            id: photos[0].id,
            src: photos[0].baseUrl
        });
        this.forceUpdate();
    }

    async #onAuthenticated() {
        const albums = await this.photoService.loadAlbums();
        this.setState({
            albums
        });
    }
}
