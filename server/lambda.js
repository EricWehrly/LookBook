const CORS_HEADERS = { "Access-Control-Allow-Origin": "*" };

function respond(statusCode, body) {
    return {
        statusCode,
        headers: CORS_HEADERS,
        body: JSON.stringify(body)
    };
}

exports.handler = async (event) => {

    if (!event?.queryStringParameters?.upc) {
        return respond(400, {
            message: "Bad Request",
            inputReceived: event?.queryStringParameters
        });
    }

    const upc = event.queryStringParameters.upc; // Accessing input from query parameters

    try {
        const response = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${encodeURIComponent(upc)}`);

        // The trial tier is rate limited; a throttled call is not "no such product".
        if (response.status === 429) {
            return respond(429, { message: "UPC lookup is rate limited, try again later.", upc });
        }

        const data = await response.json();

        if (!data?.items || data.items.length === 0) {
            return respond(response.ok ? 404 : 502, {
                message: response.ok
                    ? "UPC lookup returned no items."
                    : "UPC lookup provider returned an error.",
                upc,
                upstreamStatus: response.status
            });
        }

        // Offers and images are optional in upcitemdb results.
        const item = data.items[0];
        return respond(200, {
            name: item.title,
            barcode: upc,
            src: item.offers?.[0]?.link,
            previewImageUrl: item.images?.[0]
        });
    } catch (error) {
        console.error('Error:', error);
        return respond(500, { message: error?.message ?? "Unexpected error" });
    }

};
