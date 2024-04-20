import React, { Component } from 'react';
import Tags from '../tags/tags';
import './look.css';

export interface LookOptions {
    name : String
}

export default class Look extends Component<LookOptions> {

    name : String;
    instances : LookInstance[] = [];
    private currentInstance? : LookInstance;

    render() {
        return <div className="look">
            <h2>{this.name}</h2>
            <Tags />
            <h3>Photos:</h3>
            <div className="photo">+</div>
        </div>
    }

    constructor(options: LookOptions) {
        super(options);
        this.name = options.name;

        // TODO: fix later ...
        this.instances.push(new LookInstance());
        this.currentInstance = this.instances[0];
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
