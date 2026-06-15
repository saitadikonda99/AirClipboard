import fs from 'fs';
import path from 'path';
import electronMain from 'electron/main';

const { app } = electronMain;

export function createStore(name) {
  function filePath() {
    return path.join(app.getPath('userData'), `${name}.json`);
  }

  function read() {
    try { return JSON.parse(fs.readFileSync(filePath(), 'utf8')); } catch { return {}; }
  }

  function write(data) {
    const fp = filePath();
    fs.mkdirSync(path.dirname(fp), { recursive: true });
    fs.writeFileSync(fp, JSON.stringify(data, null, 2));
  }

  return {
    get(key, defaultVal) {
      const data = read();
      return key in data ? data[key] : defaultVal;
    },
    set(key, val) {
      const data = read();
      data[key] = val;
      write(data);
    },
    delete(key) {
      const data = read();
      delete data[key];
      write(data);
    },
  };
}
