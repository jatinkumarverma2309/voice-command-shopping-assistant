import React from 'react';
import { ShoppingProvider } from './context/ShoppingContext';
import VoiceShoppingAssistant from './components/VoiceShoppingAssistant';

function App() {
  return (
    <ShoppingProvider>
      <VoiceShoppingAssistant />
    </ShoppingProvider>
  );
}

export default App;
