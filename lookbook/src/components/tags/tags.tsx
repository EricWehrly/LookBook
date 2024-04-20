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
    private shouldSaveOnNextRender = false;

    private get storageKey() {
        return `${this.parentTypeName}.${this.parentId}.tags`;
    }

    render() {

        const tagElements = this.state.tags?.length ? this.state.tags.map(tag => 
            <span key={tag} className="tag">{tag}</span>
        ) : '';

        // this is a weird hack I need to learn better
        // https://stackoverflow.com/a/63266111/5450892
        if(this.shouldSaveOnNextRender) {
            localStorage.setItem(this.storageKey, JSON.stringify(this.state.tags));
            this.shouldSaveOnNextRender = false;
        }

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
            this.setState({
                tags: [
                    ...this.state.tags,
                    name
                ]
            });
            this.shouldSaveOnNextRender = true;
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
