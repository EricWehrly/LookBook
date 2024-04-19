// https://stackoverflow.com/a/52349344/5450892
export async function fetchHtmlAsText(url) {
    const response = await fetch(url);
    return await response.text();
}