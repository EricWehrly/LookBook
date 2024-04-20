import { Component } from "react";

interface TagProps {
    // TODO: Would love to have this typed
    parentTypeName: string,
    parentId: string,
    tags? : string[]
}

interface TagState {
    tags : string[]
};

export default class Tags extends Component<TagProps, TagState> {

    private parentTypeName : string;
    private parentId : string;

    private get storageKey() {
        return `${this.parentTypeName}.${this.parentId}.tags`;
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
            if(this.state.tags && this.state.tags.includes(name)) {
                console.warn('exists.');
                return;
            }
            const newTags = [
                ...this.state.tags,
                name
            ];
            this.setState({
                tags: newTags
            });
            localStorage.setItem(this.storageKey, JSON.stringify(newTags));
        }
        console.log(this.state.tags);
    }

    constructor(props : TagProps) {

        super(props);

        this.parentId = props.parentId;
        this.parentTypeName = props.parentTypeName;

        if(Array.isArray(props.tags)) {
            this.setState({
                tags: props.tags
            });
        } else {
            this.state = {
                tags: []
            }
        }
    }
}
