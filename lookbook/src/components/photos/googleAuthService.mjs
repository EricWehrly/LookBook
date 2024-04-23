export default class GoogleAuthService {

    static #authorized = false;
    static get authorized() {
        return GoogleAuthService.#authorized;
    }
    static set authorized(value) {
        GoogleAuthService.#authorized = value;
    }

    constructor() {
        throw "Don't construct me!";
    }
}
