import React from 'react';
import logo from './logo.svg';
import './App.css';
import Look from './components/looks/look';

const look = new Look({});

function App() {
  return (
    <div className="App">
      <Look />
    </div>
  );
}

export default App;
