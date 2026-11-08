import { Component } from "react";
import { readJson, writeJson } from "../util/storage";

export type TagParentType = 'look' | 'product';

interface TagProps {
    parentTypeName: TagParentType,
    parentId: string,
    tags? : string[]
}

interface TagState {
    tags : string[]
}

export default class Tags extends Component<TagProps, TagState> {

    private get storageKey() {
        return `${this.props.parentId}.tags`;
    }

    render() {

        const tagElements = this.state.tags.length ? this.state.tags.map(tag => 
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
            if(this.state.tags.includes(name)) {
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
            writeJson(this.storageKey, newTags);
        }
    }

    constructor(props : TagProps) {

        super(props);

        // Explicit props win over what was stored; setState is not available before mount.
        const stored = readJson<unknown>(this.storageKey);
        this.state = {
            tags: Array.isArray(props.tags) ? props.tags
                : Array.isArray(stored) ? stored.filter((t): t is string => typeof t === 'string')
                : []
        };
    }
}
