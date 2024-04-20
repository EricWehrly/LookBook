import React from 'react';
import logo from './logo.svg';
import './App.css';
import { default as Look, LookOptions } from './components/looks/look';

// TODO: Load look from persistence

function App() {
  return (
    <div className="App">
      <Look name="Today's Look" />
    </div>
  );
}

export default App;
