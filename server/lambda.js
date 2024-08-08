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
