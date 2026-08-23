# Voice Command Shopping Assistant

A strict voice-operated shopping list manager developed with React (Vite).

## Architecture & Implementation
To ensure optimal performance and strict adherence to the voice-only requirement, the application utilizes a lightweight, native technology stack. React handles the UI state, while the native Web Speech API manages real-time speech recognition and synthesis, ensuring zero reliance on heavy external dependencies.

The primary technical challenge involves parsing unstructured, multilingual audio input into deterministic actions. This is resolved by integrating Groq's API (Qwen 2.5 27B) as the NLP engine. A strict JSON schema guarantees accurate extraction of entities, quantities, categories, and price limits.

## Key Capabilities
- **Voice-Exclusive Interface:** Traditional UI interactions are intentionally disabled to enforce full voice control.
- **Advanced NLP:** Features silent auto-correction for transcription errors and contextual memory to resolve relative requests (e.g., "add one more").
- **Dynamic Suggestions:** Algorithmically recommends related categories and healthier dietary substitutes based on active shopping history.

## Setup Instructions
1. Execute `npm install`
2. Create a `.env.local` file containing: `VITE_GROQ_API_KEY=your_key`
3. Execute `npm run dev`
