import './App.css';
import { default as Look } from './components/looks/look';
import { GetLooks } from './components/looks/looks';
import OnScreenConsole from './components/util/onScreenConsole';
import {default as GooglePhotosAuthButton } from './components/photos/authorize.mjs';

function App() {

  const looks = GetLooks({
    day: new Date()
  });
  const lookId = looks.length > 0 ? looks[0].id : undefined;
  console.log(looks);

  return (
    <div className="App">
      <OnScreenConsole />
      <GooglePhotosAuthButton />
      <Look id={lookId || ''} />
    </div>
  );
}

export default App;
