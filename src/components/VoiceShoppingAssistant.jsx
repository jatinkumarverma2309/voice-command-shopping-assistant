import React, { useEffect, useState } from 'react';
import styles from './VoiceShoppingAssistant.module.css';
import { useShopping } from '../context/ShoppingContext';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { processCommand } from '../utils/nlpProcessor';

const MicIcon = () => (
  <svg className={styles.micIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
  </svg>
);

const TrashIcon = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const CheckIcon = () => (
  <svg className={styles.checkIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
  </svg>
);

const SearchIcon = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

export default function VoiceShoppingAssistant() {
  const { 
    groupedItems, suggestions, addItem, removeById, 
    toggleItem, updateQuantity, setSearchQuery, searchQuery, items,
    history, maxPrice, setMaxPrice, language, setLanguage,
    clearList, clearCategory
  } = useShopping();
  
  const { isListening, transcript, startListening, stopListening, error } = useSpeechRecognition(language);
  const [feedback, setFeedback] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [textInput, setTextInput] = useState('');

  const speakFeedback = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    if (!isListening && transcript) {
      handleCommand(transcript);
    }
  }, [isListening, transcript]);

  const handleCommand = async (text) => {
    setIsProcessing(true);
    setFeedback("Thinking...");
    
    const lastAddedItem = history.length > 0 ? history[history.length - 1] : null;
    const result = await processCommand(text, lastAddedItem);
    setIsProcessing(false);
    
    if (result.error) {
      setFeedback(`Error: ${result.error}`);
      setTimeout(() => setFeedback(''), 3000);
      return;
    }

    if (result.intent === 'ADD' && result.items.length > 0) {
      result.items.forEach(item => addItem(item.name, item.quantity, item.category, item.healthierSubstitute));
      let msg = `Added ${result.items.map(i => `${i.quantity} ${i.name}`).join(', ')}.`;
      
      const firstSubItem = result.items.find(i => i.healthierSubstitute);
      if (firstSubItem) {
        msg += ` By the way, ${firstSubItem.healthierSubstitute} is a great substitute.`;
      } else if (result.relatedSuggestion) {
        msg += ` Do you also need ${result.relatedSuggestion}?`;
      }
      
      setFeedback(msg);
      speakFeedback(msg);
    }
    else if (result.intent === 'CHECK' && result.items.length > 0) {
      result.items.forEach(itemToChk => {
        const match = items.find(i => i.name.toLowerCase().includes(itemToChk.name.toLowerCase()));
        if (match) toggleItem(match.id);
      });
      const msg = `Checked off ${result.items.map(i => i.name).join(', ')}`;
      setFeedback(msg);
      speakFeedback(msg);
    }
    else if (result.intent === 'REMOVE' && result.items.length > 0) {
      result.items.forEach(itemToRem => {
        const match = items.find(i => i.name.toLowerCase().includes(itemToRem.name.toLowerCase()));
        if (match) removeById(match.id);
      });
      const msg = `Removed ${result.items.map(i => i.name).join(', ')}`;
      setFeedback(msg);
      speakFeedback(msg);
    }
    else if (result.intent === 'CLEAR') {
      if (result.targetCategory) {
        clearCategory(result.targetCategory);
        const msg = `Cleared all items in ${result.targetCategory}.`;
        setFeedback(msg);
        speakFeedback(msg);
      } else {
        clearList();
        const msg = "Cleared your entire shopping list.";
        setFeedback(msg);
        speakFeedback(msg);
      }
    }
    else if (result.intent === 'SEARCH' && (result.query || result.maxPrice !== null)) {
      setSearchQuery(result.query || '');
      setMaxPrice(result.maxPrice !== null ? result.maxPrice : null);
      
      let msg = "Searching";
      if (result.query) msg += ` for "${result.query}"`;
      if (result.maxPrice !== null) msg += ` under $${result.maxPrice}`;
      setFeedback(msg);
      speakFeedback(msg);
    }
    else {
      const msg = "Didn't catch that. Try 'Add milk' or 'Find apples under $5'.";
      setFeedback(msg);
      speakFeedback(msg);
    }

    setTimeout(() => setFeedback(''), 3000);
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (textInput.trim()) {
      handleCommand(textInput);
      setTextInput('');
    }
  };

  const handleMicClick = () => {
    if (isListening) stopListening();
    else {
      setSearchQuery('');
      setMaxPrice(null);
      startListening();
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <h1>Smart Cart</h1>
          <select 
            className={styles.langSelect}
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="en-US">English</option>
            <option value="es-ES">Español</option>
            <option value="fr-FR">Français</option>
            <option value="hi-IN">हिन्दी</option>
          </select>
        </div>
        <p style={{textAlign: 'left', marginBottom: '1.5rem'}}>Your Voice-Only Shopping Assistant</p>
      </header>

      <section className={styles.guideSection}>
        <div className={styles.guideTitle}>What you can say:</div>
        <div className={styles.guideChips}>
          <div className={styles.guideChip}>"Add 2 apples and milk"</div>
          <div className={styles.guideChip}>"Remove the bananas"</div>
          <div className={styles.guideChip}>"Check off bread"</div>
          <div className={styles.guideChip}>"Find snacks under $5"</div>
        </div>
      </section>

      <div className={`${styles.statusCard} ${isListening ? styles.listening : ''}`}>
        <div className={styles.transcript}>
          {transcript && isListening ? (
            `"${transcript}"`
          ) : (
            <div className={styles.placeholder}>
              Tap the mic below and start speaking...
            </div>
          )}
        </div>
        {(feedback || isProcessing) && <div className={styles.feedback}>{feedback}</div>}
        {error && <div className={styles.feedback} style={{color: 'var(--danger)', marginTop: '0.5rem'}}>{error}</div>}
      </div>

      {suggestions.length > 0 && !searchQuery && maxPrice === null && (
        <section className={styles.section}>
          <div className={styles.sectionTitle}>
            {history.length > 0 ? "Based on your history, you might need:" : "Suggested for you:"}
          </div>
          <div className={styles.suggestions}>
            {suggestions.map(s => (
              <div 
                key={s} 
                className={styles.suggestionBadge}
                style={{ cursor: 'default' }}
              >
                {s}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className={styles.section} style={{flex: 1}}>
        <div className={styles.sectionTitle}>
          {searchQuery || maxPrice !== null ? `Search Results` : 'Your List'}
        </div>
        
        {Object.keys(groupedItems).length === 0 ? (
          <div className={styles.emptyState}>
            <SearchIcon />
            <p>Your list is empty</p>
          </div>
        ) : (
          Object.entries(groupedItems).map(([category, catItems]) => (
            <div key={category} className={styles.listGroup}>
              <div className={styles.categoryTitle}>{category}</div>
              {catItems.map(item => {
                const sub = item.substitute;
                return (
                  <div key={item.id} className={`${styles.listItem} ${item.checked ? styles.checked : ''}`}>
                    <div className={styles.itemCheck} style={{ cursor: 'default' }}>
                      {item.checked && <CheckIcon />}
                    </div>
                    <div className={styles.itemContent}>
                      <div className={styles.itemName}>
                        {item.name} <span style={{color: 'var(--success)', fontSize: '0.85rem', marginLeft: '0.5rem'}}>${item.price}</span>
                        {sub && !item.checked && (
                          <span className={styles.substituteHint}>
                            Try: {sub}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={styles.itemActions}>
                      <span className={styles.qtyLabel}>Qty: {item.quantity}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </section>

      <div className={styles.micButtonContainer}>
        <button 
          className={`${styles.micButton} ${isListening ? styles.recording : ''}`}
          onClick={handleMicClick}
          aria-label={isListening ? "Stop listening" : "Start listening"}
        >
          <MicIcon />
        </button>
      </div>
    </div>
  );
}
