/**
 * Uses the Web Speech API to speak a given text string.
 * @param text The text to be spoken.
 * @param lang The language code (e.g., 'en-US'). Defaults to 'en-US'.
 */
export const speak = (text: string, lang: string = 'en-US'): void => {
  if (!window.speechSynthesis) {
    console.warn("Browser does not support the Web Speech API.");
    return;
  }

  // Cancel any ongoing speech to prevent overlap
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 1.0; // Normal speed
  utterance.pitch = 1.0; // Normal pitch

  window.speechSynthesis.speak(utterance);
};
