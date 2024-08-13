import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Look from './components/looks/look';
import { GetLooks } from './components/looks/looks';
import { ProductScanner } from './components/products/productScanner';
import OnScreenConsole from './components/util/onScreenConsole';

function App() {

  const looks = GetLooks({
    day: new Date()
  });
  const lookId = looks.length > 0 ? looks[0].id : undefined;
  console.log(looks);

  // TODO: Move GooglePhotosAuthButton into look, or into photo places
  // but it also needs to be some kind of singleton?
  return (
    <div className="App">
      <OnScreenConsole />
      <Router>
        <Routes>
        <Route path="/index.html" element={<Look id={lookId || ''} />} />
        <Route path="/" element={<Look id={lookId || ''} />} />
          <Route path="/product" element={<ProductScanner />} />
          <Route path="/looks/:id" element={<Look />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
