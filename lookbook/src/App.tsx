import './App.css';
import { default as Look } from './components/looks/look';
import { GetLooks } from './components/looks/looks';
import {default as GooglePhotosAuthButton } from './components/photos/authorize.mjs';
import Demo from './components/barcodes/demo';
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import CurrentLook from './components/looks/currentLook';

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
  
  // <GooglePhotosAuthButton />
  // <Look id={lookId || ''} />
  return (
    <div className="App">
    <RouterProvider router={router} />
    </div>
  );
}

export default App;
