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

  const todayLook = {
    text: "Today's Look",
    path: "/today",
    element: <CurrentLook />,
  };
  menuItems.push(todayLook);

  const demo = {
    text: "Barcode",
    path: "/quagga",
    element: <Demo />,
  };
  menuItems.push(demo);

  const router = createBrowserRouter([
    {
      path: "/",
      element: <CurrentLook />
    },
    ...menuItems
  ]);

  return (
    <div className="App">
      <Menu items={menuItems} />
      <RouterProvider router={router} />
    </div>
  );
}

export default App;
