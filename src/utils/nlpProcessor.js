export const INTENTS = {
  ADD: 'ADD',
  REMOVE: 'REMOVE',
  SEARCH: 'SEARCH',
  CHECK: 'CHECK',
  CLEAR: 'CLEAR',
  UNKNOWN: 'UNKNOWN'
};

export async function processCommand(transcript, lastAddedItem = null) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;

  if (!apiKey) {
    console.error("VITE_GROQ_API_KEY is not set.");
    return { intent: INTENTS.UNKNOWN, items: [], query: '', maxPrice: null, targetCategory: null, relatedSuggestion: '', original: transcript, error: 'API Key missing' };
  }

  if (!transcript || !transcript.trim()) {
    return { intent: INTENTS.UNKNOWN, items: [], query: '', maxPrice: null, targetCategory: null, relatedSuggestion: '', original: transcript, error: null };
  }

  const systemPrompt = `You are a shopping assistant NLP engine. Parse the user's command (which may be in English, Spanish, French, or Hindi) and return ONLY a strict JSON object with this exact schema:
{
  "intent": "ADD" | "REMOVE" | "SEARCH" | "CHECK" | "CLEAR" | "UNKNOWN",
  "items": [{ 
    "name": "string (the clean item name without fillers)", 
    "quantity": number (default 1), 
    "category": "produce, dairy, bakery, meat, snacks, beverages, pantry, or other",
    "healthierSubstitute": "string or null (a realistic healthier or dietary substitute, e.g. 'Almond Milk' for milk, 'Stevia' for sugar, 'Whole Wheat Bread' for bread. Null if none applies)"
  }],
  "query": "string (if intent is SEARCH, the clean search term)",
  "maxPrice": number or null (if intent is SEARCH and a price limit was specified),
  "targetCategory": "string or null (if intent is CLEAR, specify the category to clear, e.g. 'dairy'. If clearing everything, use null)",
  "relatedSuggestion": "string or null (If intent is ADD, generate ONE relevant grocery item from the SAME category to suggest to the user. E.g. if they add milk, suggest cheese. If none, null)"
}

Rules:
- Auto-correct any speech recognition typos silently. If a word sounds like a typo or phonetic mistake (e.g. 'malk' instead of 'milk'), output the CORRECTED word in the 'items' array.
- Contextual understanding: the user might say 'add one more' or 'and more'. 'More' is NOT an item. If they say 'add one more', it means they want 1 more of the last added item. The last added item was: ${lastAddedItem ? lastAddedItem.name : 'unknown'}.
- For CLEAR, check if the user specifies a category. If they say 'remove everything in dairy', targetCategory is 'dairy'. If 'clear my list', targetCategory is null.
- For ADD/REMOVE/CHECK, extract the items. For CHECK, it means marking an item as done/crossed off.
- Automatically classify each item into a logical grocery category (e.g. dairy, produce, snacks, bakery, meat, beverages, pantry, other).
- For SEARCH, extract the item name into "query". If a max price is mentioned (e.g. "under 5 dollars", "kam 5", "moins de 5"), set maxPrice to the number.
- Output MUST be valid JSON, nothing else. No markdown wrappers.`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'qwen/qwen3.6-27b',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: transcript }
        ],
        temperature: 0,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    const resultContent = data.choices[0].message.content;
    const parsed = JSON.parse(resultContent);

    return {
      intent: INTENTS[parsed.intent] || INTENTS.UNKNOWN,
      items: parsed.items || [],
      query: parsed.query || '',
      maxPrice: parsed.maxPrice !== undefined ? parsed.maxPrice : null,
      targetCategory: parsed.targetCategory || null,
      relatedSuggestion: parsed.relatedSuggestion || '',
      original: transcript
    };

  } catch (error) {
    console.error("NLP API Error:", error);
    return { intent: INTENTS.UNKNOWN, items: [], query: '', maxPrice: null, targetCategory: null, relatedSuggestion: '', original: transcript, error: error.message || 'API call failed' };
  }
}

export function getSuggestions(history = [], removedHistory = [], searchHistory = []) {
  const combined = [...removedHistory, ...searchHistory, ...history];
  const uniqueSuggestions = [...new Set(combined)];
  return uniqueSuggestions.filter(Boolean).slice(0, 4);
}
