import { Component } from "react";
import Look from "./look";
import { GetLooks } from "./looks";

class CurrentLook extends Component {

    constructor(props: Object) {
        super(props);
    }

    render() {
        const looks = GetLooks({
            day: new Date()
        });
        const lookId = looks.length > 0 ? looks[0].id : undefined;

        return <Look id={lookId || ''} />
    }
}

export default CurrentLook;
