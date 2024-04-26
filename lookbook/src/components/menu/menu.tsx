import { Component, ReactNode } from "react";

export interface MenuItem {
    text: string,
    route: string
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
                <li key={item.route} onClick={this.handleClick.bind(this, item.route)}>{item.text}</li>
            ))}
            </ul>
        );
    }
}
