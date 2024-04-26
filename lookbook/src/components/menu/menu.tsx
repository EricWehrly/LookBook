import { Component, ReactNode } from "react";

export interface MenuItem {
    text: string,
    path: string
}

export interface MenuProps {
    items: MenuItem[]
}

export default class Menu extends Component<MenuProps> {

    private items: MenuItem[] = [];

    constructor(props: MenuProps) {
        super(props);

        this.items = props.items;
    }

    handleClick(route: string) {
        console.log("handleClick", route);
    }

    render(): ReactNode {

        return (
            <ul className="menu">
            {this.items.map(item => (
                <li key={item.path} onClick={this.handleClick.bind(this, item.path)}>{item.text}</li>
            ))}
            </ul>
        );
    }
}
