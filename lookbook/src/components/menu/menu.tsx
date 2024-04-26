import { Component, ReactNode } from "react";

interface MenuItem {
    text: string,
    route: string
}

class Menu extends Component {

    private items: MenuItem[] = [];

    constructor(props: Object) {
        super(props);

        const todayLook: MenuItem = {
            text: "Today's Look",
            route: "/today"
        };
        this.items.push(todayLook);

        const demo: MenuItem = {
            text: "Barcode",
            route: "/quagga"
        };
        this.items.push(demo);
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

export default Menu;