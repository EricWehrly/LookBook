import { Component } from 'react';
import Tags from '../tags/tags';
import './look.css';
import LookModel from './lookModel';
import { GetLook } from './looks';

export default class Look extends Component<LookModel> implements LookModel {

    // tbh we probly only care about LookModels
    static Looks : { [id: string] : Look } = {};

    static FromState(id : string) {

        return null;
    }

    private _id : string;
    name? : string;
    // TODO: (big lift) Move 'created' to instance ...
    created!: Date; // TODO: the exclamation asserts it's "definitely" getting assigned in constructor...
    instances : LookInstance[] = [];
    private currentInstance? : LookInstance;

    get id() { return this._id; }

    private get storageKey() {
        return `${this._id}`;
    }

    render() {
        // TODO: Name should be the selected date if null ... today if date is today
        return <div className="look">
            <h2>{this.name || "Today's Look"}</h2>
            <Tags parentTypeName='look' parentId={this._id} />
            <h3>Photos:</h3>
            <div className="photo">+</div>
        </div>
    }

    constructor(options: LookModel) {
        super(options);

        if(options.id && options.id.length > 0) {
            console.log(`Using provided id ${options.id}`);
            this._id = options.id;

            this.buildFromStorage(this._id);

            Look.Looks[this._id] = this;
        } else {
            this._id = crypto.randomUUID();

            if(options.name) this.name = options.name;
            if(options.created) this.created = options.created;
            else this.created = new Date()

            Look.Looks[this._id] = this;
            // TODO: We need a generic persistence interface layer that can implement localStorage vs alternates
            localStorage.setItem('looks', JSON.stringify(Object.keys(Look.Looks)));
    
            this.save();
        }

        // TODO: fix later ...
        this.instances.push(new LookInstance());
        this.currentInstance = this.instances[0];
    }

    private buildFromStorage(id : string) {

        const lookModel = GetLook(this._id);
        if(lookModel == null) {
            throw 'bad';
        }

        this.name = lookModel.name;

        if(lookModel.created) {
            this.created = lookModel.created;
        }
        else this.created = new Date();
    }

    private save() {

        const storageObject = {
            id: this._id,
            name: this.name,
            created: this.created
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
