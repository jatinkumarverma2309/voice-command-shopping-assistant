import { useState, useEffect, useCallback } from 'react';

export function useSpeechRecognition(language = 'en-US') {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError('Browser does not support Speech Recognition');
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = language;

    rec.onstart = () => {
      setIsListening(true);
      setError(null);
      setTranscript('');
    };

    rec.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      setTranscript(finalTranscript);
    };

    rec.onerror = (event) => {
      setError(event.error);
      setIsListening(false);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    setRecognition(rec);
  }, [language]);

  const startListening = useCallback(() => {
    if (recognition) {
      try {
        recognition.start();
      } catch (err) {
      }
    }
  }, [recognition]);

  const stopListening = useCallback(() => {
    if (recognition) {
      recognition.stop();
    }
  }, [recognition]);

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening
  };
}
