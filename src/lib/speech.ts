export function canSpeak() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function stopSpeak() {
  if (!canSpeak()) return;
  window.speechSynthesis.cancel();
}

export function speak(text: string, onend?: () => void) {
  if (!canSpeak() || !text.trim()) {
    onend?.();
    return false;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text.trim());
  utterance.rate = 0.92;
  utterance.pitch = 1;
  utterance.lang = "en-GB";
  utterance.onend = () => onend?.();
  utterance.onerror = () => onend?.();
  window.speechSynthesis.speak(utterance);
  return true;
}
