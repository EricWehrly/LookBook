// https://stackoverflow.com/a/52349344/5450892
export async function fetchHtmlAsText(url) {
    const response = await fetch(url);
    return await response.text();
}

function getAttributesAsQueryParams(element) {

    let result = '';
    const blackList = [
        'class'
    ];

    for(var attr of element.attributes) {
        if(!blackList.includes(attr.name)) {
            result += attr.name + '=' + attr.value + '&';
        }
    }

    return result;
}