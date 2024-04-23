import { Component } from "react";
import { default as GoogleAuthService } from './googleAuthService.mjs';

export default class AlbumPicker extends Component {

    constructor(props) {
        super(props);

        console.log('creating albumpicker');
        window.addEventListener('google-authenticated', this.#authed.bind(this));
    }

    #authed() {
        console.log('Authed!');
        this.forceUpdate(async () => {
            console.log('update complete?');
            await this.#listAlbums();
        });        
    }

    render() {
        let content;
        if(GoogleAuthService.authorized) {
            content = <div id='albums'>Yay!</div>
        }
        return <div>
            {content}
        </div>
    }

    // documentation:
    // https://developers.google.com/photos/library/reference/rest/v1/albums#Album

    /**
     * Print metadata for first 10 Albums.
     */
    async #listAlbums() {
        let response;
        try {
            response = await window.gapi.client.photoslibrary.albums.list({
                'pageSize': 10,
                'fields': 'albums(id,title,coverPhotoBaseUrl)',
            });
        } catch (err) {
            console.error(err);
            document.getElementById('albums').innerText = err.message;
            return;
        }
        const albums = response.result.albums;
        if (!albums || albums.length == 0) {
            document.getElementById('albums').innerText = 'No albums found.';
            return;
        }
        // Flatten to string to display
        const output = albums.reduce(
            (str, album) => `${str}${album.title} (${album.coverPhotoBaseUrl}\n`,
            'albums:\n');
        document.getElementById('albums').innerText = output;
    }
}
