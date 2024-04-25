export default class GoogleAuthService {

    static #authorized = false;
    static get authorized() {
        return GoogleAuthService.#authorized;
    }
    static set authorized(value) {
        GoogleAuthService.#authorized = value;
        window.dispatchEvent(new CustomEvent('google-authenticated'));
    }

    constructor() {
        throw "Don't construct me!";
    }
}
