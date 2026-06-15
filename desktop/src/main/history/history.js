const Store = require('electron-store');
const { MAX_HISTORY } = require('../../shared/constants');

const store = new Store({ name: 'clippr-history' });

function getHistory() {
  return store.get('items', []);
}

function addEntry(entry) {
  const items = getHistory();
  // Avoid duplicate consecutive entries
  if (items.length > 0 && items[0].payload === entry.payload) return;
  items.unshift(entry);
  if (items.length > MAX_HISTORY) items.splice(MAX_HISTORY);
  store.set('items', items);
}

function clearHistory() {
  store.set('items', []);
}

module.exports = { getHistory, addEntry, clearHistory };
