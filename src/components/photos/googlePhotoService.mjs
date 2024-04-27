// https://github.com/mbborromeo/google-photos-viewer/blob/master/src/GooglePhotosService.js

// documentation:
// https://developers.google.com/photos/library/reference/rest/v1/albums#Album

class GooglePhotosService {

    get gapiClient() {
        return window.gapi.client;
    }

    constructor(gapiClient) {
        // until we can convert to tsx ...
        // if(!gapiClient) throw 'You need that';
        // if(gapiClient) this.gapiClient = gapiClient;
        // else this.gapiClient = window.gapi.client;
    }
  
    loadAlbums() {
      return this.gapiClient.photoslibrary.albums
        .list({})
        .then(function (fullResponse) {
          // { result: { albums } }
          const albums = fullResponse.result.albums;
          // Handle the results here (response.result has the parsed body).
          return albums;
        });
    }
  
    loadAlbumDetail(id, token) {
      return this.gapiClient.photoslibrary.albums
        .get({ albumId: id })
        .then((response) => {
          return response.result;
        })
        .then((album) => {
          //console.log('loadAlbumDetail album', album)
          return this.gapiClient.photoslibrary.mediaItems
            .search({ albumId: id, pageToken: token })
            .then(function (response) {
              //console.log('loadAlbumDetail then response', response)
  
              // join album data with mediaItems corresponding to album
              return {
                ...album,
                result: response.result,
              };
            });
        })
        .catch(function (e) {
          return undefined;
        });
    }
  
    loadPhotoDetail(id) {
      return this.gapiClient.photoslibrary.mediaItems
        .get({ mediaItemId: id })
        .then((response) => {
          return response.result;
        })
        .catch(function (e) {
          return undefined;
        });
    }
  }
  
  export default GooglePhotosService;
