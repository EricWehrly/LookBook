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

    const inputString = event.queryStringParameters.upc; // Accessing input from query parameters

    return {
        statusCode: 200,
        body: JSON.stringify({
            message: "Success",
            inputReceived: inputString
        }),
    };
};
