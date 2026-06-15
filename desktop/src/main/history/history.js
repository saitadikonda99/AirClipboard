import { createStore } from '../store.js';
import { MAX_HISTORY } from '../../shared/constants.js';

const store = createStore('clippr-history');

export function getHistory() {
  return store.get('items', []);
}

export function addEntry(entry) {
  const items = getHistory();
  if (items.length > 0 && items[0].content === entry.content) return;
  items.unshift(entry);
  if (items.length > MAX_HISTORY) items.splice(MAX_HISTORY);
  store.set('items', items);
}

export function clearHistory() {
  store.set('items', []);
}
