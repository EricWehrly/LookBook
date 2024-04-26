import './App.css';
import Demo from './components/barcodes/demo';
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import CurrentLook from './components/looks/currentLook';
import Menu, { MenuItem } from './components/menu/menu';

function App() {

  const menuItems: MenuItem[] = [];

  const todayLook: MenuItem = {
      text: "Today's Look",
      route: "/today"
  };
  menuItems.push(todayLook);

  const demo: MenuItem = {
      text: "Barcode",
      route: "/quagga"
  };
  menuItems.push(demo);

  const router = createBrowserRouter([
    {
      path: "/",
      element: <CurrentLook />,
    },
    {
      path: "/quagga",
      element: <Demo />,
    },
  ]);
  
  return (
    <div className="App">
      <Menu items={menuItems} />
    <RouterProvider router={router} />
    </div>
  );
}

export default App;
