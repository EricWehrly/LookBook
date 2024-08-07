import { Component } from 'react';
import Tags from '../tags/tags';
import './look.css';
import LookModel from './lookModel';
import { GetLook } from './looks';
import { EditText, onSaveProps } from 'react-edit-text';
import 'react-edit-text/dist/index.css';
import AlbumPicker from '../photos/albumpicker';
import { LookOccurrence } from './lookOccurrence';
import Products from '../products/products';
import GooglePhotosAuthButton from '../photos/authorize.mjs';

interface LookState {
    name? : string,
    setText: { (value: React.SetStateAction<string>): void; }
}

export default class Look extends Component<LookModel> implements LookModel {

    // tbh we probly only care about LookModels
    static Looks : { [id: string] : Look } = {};

    // hack
    static #current: Look;
    static get Current() { return Look.#current; }

    private _id : string;
    name?: string;

    // TODO: (big lift) Move 'created' to instance ...
    created!: Date; // TODO: the exclamation asserts it's "definitely" getting assigned in constructor...
    instances : LookOccurrence[] = [];

    state : LookState = {
        name: '',
        setText: this.setText.bind(this)
    };

    private setText(value: React.SetStateAction<string>) {
        this.name = value.toString();
        this.setState({
            name: value.toString()
        });
    }

    get id() { return this._id; }

    get storageKey() {
        return `${this._id}`;
    }
    // <h2>{this.name}</h2>
    // <h2 contentEditable="true" onInput={this.h2Edited.bind(this)}>{this.name || "Today's Look"}</h2>

    render() {
        // TODO: Name should be the selected date if null ... today if date is today
        return <div>
            <GooglePhotosAuthButton />
            <div className="look">
            <EditText
                name='textbox'
                className='look-title'
                value={this.name}
                onChange={(e) => this.handleChange(e, this.state.setText)}
                onSave={this.handleSave.bind(this)}
            />
                <Tags parentTypeName='look' parentId={this._id} />
                <h3 title={LookOccurrence.Current?.photos?.length?.toString()}>Photos:</h3>            
                <AlbumPicker  />
                <LookOccurrence look={this} />            
                <h3>Products:</h3>
                <Products look={this} />
            </div>
        </div>
    }

    handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, setFn: { (value: React.SetStateAction<string>): void; (value: React.SetStateAction<string>): void; (value: React.SetStateAction<string>): void; (arg0: any): void; }) => {
      if(setFn) setFn(e.target.value);
    };

    handleSave(props: onSaveProps) {
        this.save();
    }

    constructor(options: LookModel) {
        super(options);

        Look.#current = this;

        if(options.id && options.id.length > 0) {
            console.log(`Using provided id ${options.id}`);
            this._id = options.id;

            this.buildFromStorage(this._id);

            Look.Looks[this._id] = this;
        } else {
            this._id = crypto.randomUUID();
            this.defaultLook(options);
        }
    }

    private defaultLook(options: LookModel) {

        if (options.name) {
            this.name = options.name;
        } else {
            this.name = this.nameFromDate(new Date());
        }
        // TODO: somehow track "name" with state
        this.state = {
            name: this.name,
            setText: this.state.setText
        };
        if (options.created) this.created = options.created;
        else this.created = new Date();

        Look.Looks[this._id] = this;
        // TODO: We need a generic persistence interface layer that can implement localStorage vs alternates
        localStorage.setItem('looks', JSON.stringify(Object.keys(Look.Looks)));

        this.save();
    }

    private buildFromStorage(id : string) {

        const lookModel = GetLook(id);
        if(lookModel == null) {
            throw Error('bad');
        }

        // TODO: somehow track "name" with state
        this.name = lookModel.name;
        if(!this.name) {
            this.name = this.nameFromDate(this.created);
        }
        this.state = {
            name: lookModel.name,
            setText: this.state.setText
        };

        if(lookModel.created) {
            this.created = lookModel.created;
        }
        else this.created = new Date();
    }

    private save() {

        console.log(`saving look ${this.id}`);

        const storageObject = {
            id: this._id,
            name: this.name,
            created: this.created
        };
        localStorage.setItem(this.storageKey, JSON.stringify(storageObject));
    }

    private nameFromDate(date: Date) : string {

        const name = "Today's Look";

        return name;
    }
}
