import './App.css';
import Demo from './components/barcodes/demo';
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import CurrentLook from './components/looks/currentLook';
import Menu from './components/menu/menu';

function App() {

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
      <Menu />
    <RouterProvider router={router} />
    </div>
  );
}

export default App;
