import { Component, useState } from "react";

export default class Tags extends Component {

    tags : string[] = [];

    render() {

        const tagElements = this.tags?.length ? this.tags.map(tag => 
            <span className="tag">{tag}</span>
        ) : '';

        return <div className="tags">
            <span>Tags:</span>
            <span className="tag" onClick={this.addTag.bind(this)}>add tag</span>
            {tagElements}
        </div>
    }

    addTag() {

        const name = window.prompt('Give your tag a name!');
        if(name) {
            this.tags.push(name);
        }
        console.log(this.tags);
    }

    constructor(tags : string[]) {

        super(tags);
        if(Array.isArray(tags)) this.tags = tags;
    }
}
