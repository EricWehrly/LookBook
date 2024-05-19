import { ChangeEvent, Component } from 'react';
import Tags from '../tags/tags';
import './look.css';
import LookModel from './lookModel';
import { GetLook } from './looks';
import { EditText, onSaveProps } from 'react-edit-text';
import 'react-edit-text/dist/index.css';
import AlbumPicker from '../photos/albumpicker';

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
    instances : LookInstance[] = [];
    private currentInstance? : LookInstance;

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
        const photoContent = this.listPhotos();
        // TODO: Name should be the selected date if null ... today if date is today
        return <div className="look">
          <EditText
            name='textbox'
            className='look-title'
            value={this.name}
            onChange={(e) => this.handleChange(e, this.state.setText)}
            onSave={this.handleSave.bind(this)}
          />
            <Tags parentTypeName='look' parentId={this._id} />
            <h3 title={this.currentInstance?.photos?.length?.toString()}>Photos:</h3>
            {photoContent}
        </div>
    }

    private listPhotos() {

        const photos = this.currentInstance?.photos.map(photo => 
            <div key={photo.id} className="photo" 
            style={{
                width: '240px',
                height: '240px',
                backgroundImage: `url('${photo.src}=w240-h240')`
            }}>
            </div>
        );

        return <>
            <AlbumPicker  />
            {photos}
        </>
    }

    handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, setFn: { (value: React.SetStateAction<string>): void; (value: React.SetStateAction<string>): void; (value: React.SetStateAction<string>): void; (arg0: any): void; }) => {
      if(setFn) setFn(e.target.value);
    };

    handleSave(props: onSaveProps) {
        this.save();
    }

    addPhoto(photo: Photo) {

        this.currentInstance?.addPhoto(photo);
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

            if(options.name) {
                this.name = options.name;
            } else {
                this.name = this.nameFromDate(new Date());
            }
            // TODO: somehow track "name" with state
            this.state = {
                name: this.name,
                setText: this.state.setText
            };
            if(options.created) this.created = options.created;
            else this.created = new Date()

            Look.Looks[this._id] = this;
            // TODO: We need a generic persistence interface layer that can implement localStorage vs alternates
            localStorage.setItem('looks', JSON.stringify(Object.keys(Look.Looks)));
    
            this.save();
        }

        // TODO: fix later ...
        this.instances.push(new LookInstance(this));
        this.currentInstance = this.instances[0];
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

export class LookInstance {

    look: Look;
    photos : Photo[] = [];

    // TODO: 'created' should ONLY live in instance
    get created() {
        return this.look.created;
    }

    private get storageKey() {
        return `${this.look.storageKey}.${this.look.created}`;
    }

    private get photosStorageKey() {
        return `${this.storageKey}.photos`;
    }

    addPhoto(options: Photo) {

        this.photos.push(new Photo(options));
        localStorage.setItem(this.photosStorageKey, JSON.stringify(this.photos));
        console.log('hey eric check!');
    }

    constructor(look: Look) {
        this.look = look;

        const photos = localStorage.getItem(this.photosStorageKey);
        if(photos) {
            const parsed = JSON.parse(photos);
            this.photos = parsed;
        }
    }
}

export class Photo {

    id?: string;
    src: string;

    constructor(options: Photo) {

        this.src = options.src;
        this.id = options.id;
    }
}
