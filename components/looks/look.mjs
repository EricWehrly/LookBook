
export default class Look {

    #name;
    get name() { return this.#name; }
    set name(value) { this.#name = value; }

    #instances = [];

    getInstances(options) {
        // TODO: filter #instances based on options
        return this.#instances;
    }

    constructor(options) {

        if(options.name) this.#name = options.name;
    }
}

export class LookInstance {

    #date;
    #tags;
    #photos;

    addPhoto(photo) {
        
    }
}
