import { Component } from 'react';
import Tags from '../tags/tags';
import './look.css';
import LookModel, { LookProps } from './lookModel';
import { AddLookToIndex, GetLook } from './looks';
import { nameFromDate } from './lookName';
import { writeJson } from '../util/storage';
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

export default class Look extends Component<LookProps> implements LookModel {

    static Looks : { [id: string] : Look } = {};

    // The most recently constructed Look, whichever route created it.
    static #current: Look;
    static get Current() { return Look.#current; }

    private _id : string;
    name?: string;

    created: Date;
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

    constructor(options: LookProps) {
        super(options);

        Look.#current = this;

        if(options.id && options.id.length > 0) {
            const stored = GetLook(options.id);
            if(stored == null) {
                throw Error(`bad look id: nothing stored under '${options.id}'`);
            }

            this._id = options.id;
            this.created = stored.created;
            this.applyName(stored.name || nameFromDate(this.created));

            Look.Looks[this._id] = this;
        } else {
            this._id = crypto.randomUUID();
            this.created = options.created ?? new Date();
            this.applyName(options.name || nameFromDate(this.created));

            Look.Looks[this._id] = this;
            AddLookToIndex(this._id);

            this.save();
        }
    }

    // name is mirrored into state so the title can render before mount; setText keeps them in step afterwards.
    private applyName(name: string) {
        this.name = name;
        this.state = {
            name,
            setText: this.state.setText
        };
    }

    private save() {

        const storageObject : LookModel = {
            id: this._id,
            name: this.name,
            created: this.created
        };
        writeJson(this.storageKey, storageObject);
    }
}
