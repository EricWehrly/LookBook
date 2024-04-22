import { Component } from "react";

export default class GooglePhotosAuthButton extends Component {

    #CLIENT_ID = '252542497123-6r2k4eh8sn7p2tn8mdujsoofc5fvjgn5.apps.googleusercontent.com';
    #API_KEY = 'AIzaSyDYEwsynZLswhuZqPpKllhrb7zl7GBQo0g';

    // Discovery doc URL for APIs used by the quickstart
    #DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/photoslibrary/v1/rest';

    // Authorization scopes required by the API; multiple scopes can be
    // included, separated by spaces.
    // const SCOPES = 'https://www.googleapis.com/auth/photoslibrary.readonly';
    #SCOPES = 'https://www.googleapis.com/auth/photoslibrary https://www.googleapis.com/auth/photoslibrary.readonly https://www.googleapis.com/auth/photoslibrary.readonly.appcreateddata';

    // #gapiInited = false;
    // #gisInited = false;
    tokenClient;

    state = {
        gapiInited: false,
        gisInited: false,
    };

    constructor(props) {
        super(props);

        this.#addScript('https://apis.google.com/js/api.js', this.#gapiLoaded.bind(this));
        this.#addScript('https://accounts.google.com/gsi/client', this.#gisLoaded.bind(this));
    }

    #addScript(src, loadEvent) {

        if(window && document) {
            const script = document.createElement('script');
            const body = document.getElementsByTagName('body')[0];
            script.src = src;
            script.addEventListener('load', () => {
                loadEvent();
            });
            body.appendChild(script);
        }
    }

    render() {

        let content;
        if(this.state.gapiInited && this.state.gisInited) {
            content = <button id="authorize_button" onClick={this.#handleAuthClick.bind(this)}>Authorize</button>
        }

        // <button id="signout_button" onClick={this.#handleSignoutClick}>Sign Out</button>

        return <div className="googlePhotosAuthButton">            
            {content}
            <div id="albums"></div>
        </div>
    }
    
    #gapiLoaded() {
        window.gapi.load('client', this.initializeGapiClient.bind(this));
    }

    /**
     * Callback after the API client is loaded. Loads the
     * discovery doc to initialize the API.
     */
    async initializeGapiClient() {
        await window.gapi.client.init({
            apiKey: this.#API_KEY,
            discoveryDocs: [this.#DISCOVERY_DOC],
        });
        this.state.gapiInited = true;
        // this.#maybeEnableButtons();
        this.setState({
            gapiInited: true,
            gisInited: this.state.gisInited
        });
    }

    /**
     * Callback after Google Identity Services are loaded.
     */
    #gisLoaded() {
        this.tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: this.#CLIENT_ID,
            scope: this.#SCOPES,
            callback: this.#handleCallback.bind(this),
        });
        this.setState({
            gisInited: true,
            gapiInited: this.state.gapiInited
        });
        // this.#maybeEnableButtons();
    }

    async #handleCallback(resp) {
        if (resp.error !== undefined) {
            throw (resp);
        }
        // TODO:
        // document.getElementById('signout_button').style.visibility = 'visible';
        // document.getElementById('authorize_button').innerText = 'Refresh';
        await this.#listAlbums.bind(this)();
    }

    /**
     *  Sign in the user upon button click.
     */
    #handleAuthClick() {

        if (window.gapi.client.getToken() === null) {
            // Prompt the user to select a Google Account and ask for consent to share their data
            // when establishing a new session.
            this.tokenClient.requestAccessToken({ prompt: 'consent' });
            // tokenClient.requestAccessToken();
        } else {
            // Skip display of account chooser and consent dialog for an existing session.
            this.tokenClient.requestAccessToken({ prompt: '' });
        }
    }

    /**
     *  Sign out the user upon button click.
     */
    #handleSignoutClick() {
        const token = window.gapi.client.getToken();
        if (token !== null) {
            window.google.accounts.oauth2.revoke(token.access_token);
            window.gapi.client.setToken('');
            document.getElementById('content').innerText = '';
            document.getElementById('authorize_button').innerText = 'Authorize';
            document.getElementById('signout_button').style.visibility = 'hidden';
        }
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
