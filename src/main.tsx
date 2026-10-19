import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';
import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { initTelegram } from './telegram/telegram';

initTelegram();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
