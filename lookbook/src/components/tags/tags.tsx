import { Component } from "react";

export default class Tags extends Component {

    state = {
        tags: []
    }

    render() {

        const tagElements = this.state.tags?.length ? this.state.tags.map(tag => 
            <span key={tag} className="tag">{tag}</span>
        ) : '';

        return <div className="tags">
            <span>Tags:</span>
            <span className="tag" onClick={this.addTag.bind(this)}>add tag</span>
            {tagElements}
        </div>
    }

    addTag() {

        // const name = window.prompt('Give your tag a name!');
        const name = 'test';
        if(name) {
            this.setState({
                tags: [
                    ...this.state.tags,
                    name
                ]
            });
        }
        console.log(this.state.tags);
    }

    constructor(tags : string[]) {

        super(tags);
        if(Array.isArray(tags)) {
            this.setState({
                tags: tags
            });
        }
    }
}
