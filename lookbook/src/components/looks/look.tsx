import { Component } from 'react';
import Tags from '../tags/tags';
import './look.css';

export interface LookOptions {
    name? : string,
    id? : string,
    created? : Date
}

export default class Look extends Component<LookOptions> {

    static Looks : { [id: string] : Look } = {};

    static FromState(id : string) {

        return null;
    }

    private id : string;
    name? : string;
    // TODO: (big lift) Move to instance ...
    created: Date;
    instances : LookInstance[] = [];
    private currentInstance? : LookInstance;

    private get storageKey() {
        return `${this.id}`;
    }

    render() {
        return <div className="look">
            <h2>{this.name || "Today's Look"}</h2>
            <Tags parentTypeName='look' parentId={this.id} />
            <h3>Photos:</h3>
            <div className="photo">+</div>
        </div>
    }

    constructor(options: LookOptions) {
        super(options);

        if(options.id) {
            console.log('I have an id..ea...');
        } else {

        }

        this.id = crypto.randomUUID();
        if(options.name) this.name = options.name;
        if(options.created) this.created = options.created;
        else this.created = new Date();

        // TODO: fix later ...
        this.instances.push(new LookInstance());
        this.currentInstance = this.instances[0];
        Look.Looks[this.id] = this;
        localStorage.setItem('looks', JSON.stringify(Object.keys(Look.Looks)));

        this.save();
    }

    private save() {

        let storageObject = {
            id: this.id,
            name: this.name
        };
        localStorage.setItem(this.storageKey, JSON.stringify(storageObject));
    }
}

export class LookInstance {

    photos : Photo[] = [];
}

export class Photo {

    src;

    constructor(options: { src: String; }) {

        this.src = options.src;
    }
}
