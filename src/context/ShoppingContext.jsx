import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSuggestions } from '../utils/nlpProcessor';

const ShoppingContext = createContext();

export function ShoppingProvider({ children }) {
  const [items, setItems] = useState([]);
  const [history, setHistory] = useState([]);
  const [removedHistory, setRemovedHistory] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [language, setLanguage] = useState('en-US');
  const [searchQuery, setSearchQuery] = useState('');
  const [maxPrice, setMaxPrice] = useState(null);

  useEffect(() => {
    const savedItems = localStorage.getItem('shoppingList');
    if (savedItems) {
      setItems(JSON.parse(savedItems));
    }
  }, []);

  useEffect(() => {
    if (searchQuery.trim() && !searchHistory.includes(searchQuery)) {
      setSearchHistory(prev => [searchQuery, ...prev].slice(0, 10));
    }
  }, [searchQuery]);

  useEffect(() => {
    localStorage.setItem('shoppingList', JSON.stringify(items));
    
    const newSuggestions = getSuggestions(history, removedHistory, searchHistory).filter(
      s => !items.some(i => i.name.toLowerCase() === s.toLowerCase())
    );
    setSuggestions(newSuggestions);
  }, [items, history, removedHistory, searchHistory]);

  const addItem = (itemName, quantity = 1, category = 'other', substitute = null) => {
    setItems(prev => {
      const existing = prev.find(i => i.name.toLowerCase() === itemName.toLowerCase());
      if (existing) {
        return prev.map(i => 
          i.id === existing.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, {
        id: Date.now().toString(),
        name: itemName,
        quantity,
        price: Math.floor(Math.random() * 8) + 2,
        category: category,
        substitute: substitute,
        checked: false
      }];
    });
    
    setHistory(prev => [...prev, itemName]);
  };

  const removeItem = (itemName) => {
    setItems(prev => {
      const toRemove = prev.filter(i => i.name.toLowerCase().includes(itemName.toLowerCase()));
      if (toRemove.length) setRemovedHistory(curr => [toRemove[0].name, ...curr].slice(0, 10));
      return prev.filter(i => !i.name.toLowerCase().includes(itemName.toLowerCase()));
    });
  };

  const removeById = (id) => {
    setItems(prev => {
      const toRemove = prev.find(i => i.id === id);
      if (toRemove) setRemovedHistory(curr => [toRemove.name, ...curr].slice(0, 10));
      return prev.filter(i => i.id !== id);
    });
  };

  const toggleItem = (id) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, checked: !i.checked } : i));
  };

  const clearList = () => {
    setItems(prev => {
      if (prev.length) setRemovedHistory(curr => [...prev.map(i => i.name), ...curr].slice(0, 15));
      return [];
    });
  };

  const clearCategory = (category) => {
    setItems(prev => {
      const toRemove = prev.filter(i => i.category.toLowerCase() === category.toLowerCase());
      if (toRemove.length) setRemovedHistory(curr => [...toRemove.map(i => i.name), ...curr].slice(0, 15));
      return prev.filter(i => i.category.toLowerCase() !== category.toLowerCase());
    });
  };

  const updateQuantity = (id, quantity) => {
    if (quantity <= 0) {
      removeById(id);
      return;
    }
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity } : i));
  };

  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  let filteredGroupedItems = groupedItems;
  if (searchQuery || maxPrice !== null) {
    const lowerQ = searchQuery.toLowerCase();
    filteredGroupedItems = {};
    for (const [cat, catItems] of Object.entries(groupedItems)) {
      const filtered = catItems.filter(i => {
        const matchesQ = !searchQuery || i.name.toLowerCase().includes(lowerQ);
        const matchesP = maxPrice === null || i.price <= maxPrice;
        return matchesQ && matchesP;
      });
      if (filtered.length > 0) {
        filteredGroupedItems[cat] = filtered;
      }
    }
  }

  const value = {
    items,
    history,
    groupedItems: filteredGroupedItems,
    suggestions,
    language,
    searchQuery,
    maxPrice,
    setLanguage,
    setSearchQuery,
    setMaxPrice,
    addItem,
    removeItem,
    removeById,
    toggleItem,
    updateQuantity,
    clearList,
    clearCategory
  };

  return (
    <ShoppingContext.Provider value={value}>
      {children}
    </ShoppingContext.Provider>
  );
}

export function useShopping() {
  return useContext(ShoppingContext);
}
