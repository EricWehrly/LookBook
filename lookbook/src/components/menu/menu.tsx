import { Component, ReactNode } from "react";
import { NavigateFunction } from "react-router-dom";

export interface MenuItem {
    text: string,
    path: string
}

export interface MenuProps {
    items: MenuItem[],
    navigator?: NavigateFunction,
    router: any
}

export default class Menu extends Component<MenuProps> {

    private items: MenuItem[] = [];
    private navigate;

    constructor(props: MenuProps) {
        super(props);

        this.items = props.items;
        this.navigate = props.router.navigate;
    }

    handleClick(event: React.MouseEvent<HTMLLIElement>, route: string) {
        this.navigate(route);
    }

    render(): ReactNode {

        return (
            <ul className="menu">
            {this.items.map(item => (
                <li key={item.path} onClick={(event) => this.handleClick(event, item.path)}>
                {item.text}
                </li>
            ))}
            </ul>
        );
    }
}
