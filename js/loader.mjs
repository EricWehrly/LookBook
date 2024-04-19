const root = window.location.origin + '/LookBook/';

// https://stackoverflow.com/a/52349344/5450892
export async function fetchHtmlAsText(url) {
    const response = await fetch(url);
    if(response.status > 199 && response.status < 300) {
        return await response.text();
    } else {
        console.error(response)
        return '';
    }
}

const header = document.createElement('div');
document.body.appendChild(header);
header.innerHTML = await fetchHtmlAsText(`${root}pages/header.html`);

(async () => {

    const photoDiv = document.getElementById('photos');
    if(photoDiv) {
        photoDiv.innerHTML = await fetchHtmlAsText(`${root}components/photos/photos.html`);
    }
})();
