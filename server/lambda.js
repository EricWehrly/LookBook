exports.handler = async (event) => {

    if (!event?.queryStringParameters?.upc) {
        return {
            statusCode: 400,
            body: JSON.stringify({
                message: "Bad Request",
                inputReceived: event.queryStringParameters
            }),
        };
    }

    const upc = event.queryStringParameters.upc; // Accessing input from query parameters

    try {
        const response = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${upc}`);
        const data = await response.json();

        if(!data.items || data.items.length === 0) {
            return {
                statusCode: 404,
                headers: { "Access-Control-Allow-Origin" : "*" },
                body: JSON.stringify({
                    message: "UPC lookup returned no items.",
                    response
                })
            };
        }

        // console.log(data);
        const item = data.items[0];
        return {
            statusCode: 200,
            headers: { "Access-Control-Allow-Origin" : "*" },
            body: JSON.stringify({
                name: item.title,
                barcode: upc,
                src: item.offers[0].link,
                previewImageUrl: item.images[0]
            })
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers: { "Access-Control-Allow-Origin" : "*" },
            body: JSON.stringify(error)
        };
    }

};
