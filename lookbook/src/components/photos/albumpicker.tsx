import { Component } from "react";
import { default as GoogleAuthService } from './googleAuthService.mjs';
import GooglePhotosService from "./googlePhotoService.mjs";
import './albumpicker.css';

interface GooglePhotoAlbum {
    id: string,
    coverPhotoMediaItemId: string,
    coverPhotoBaseUrl: string,
    mediaItemsCount: number,
    productUrl: string,
    title: string
}

interface AlbumPickerState {
    albums: GooglePhotoAlbum[]
}

export default class AlbumPicker extends Component {

    photoService : GooglePhotosService;
    state: AlbumPickerState;

    constructor(props : any) {
        super(props);

        this.photoService = new GooglePhotosService();
        this.state = {
            albums: []
        };

        if(GoogleAuthService.authorized) {
            this.#onAuthenticated.bind(this)();
        } else {
            window.addEventListener('google-authenticated', this.#onAuthenticated.bind(this));
        }
    }

    render() {
        const content = GoogleAuthService.authorized ? this.state.albums.map(album => 
            <div key={album.id} className="album"
            style={{
                backgroundImage: `url('${album.coverPhotoBaseUrl}=w240-h240')`
            }}>
                {album.title}
            </div>
        ) : '';
        return <div id='albumPicker'>
            {content}
        </div>
    }

    async #onAuthenticated() {
        const albums = await this.photoService.loadAlbums();
        this.setState({
            albums
        });
    }
}
