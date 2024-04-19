import Look from "./look.mjs";

export function getLook(options) {

    // TODO: search existing based on options

    // default
    return new Look({
        name: "Today's Look"
    });
}