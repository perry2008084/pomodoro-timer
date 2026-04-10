const chrome = {
  storage: {
    local: {
      _data: {},
      get(keys, callback) {
        const result = {};
        const keyList = Array.isArray(keys) ? keys : [keys];
        keyList.forEach((key) => {
          if (this._data[key] !== undefined) {
            result[key] = this._data[key];
          }
        });
        if (callback) callback(result);
      },
      set(items, callback) {
        Object.assign(this._data, items);
        if (callback) callback();
      },
      remove(keys, callback) {
        const keyList = Array.isArray(keys) ? keys : [keys];
        keyList.forEach((key) => delete this._data[key]);
        if (callback) callback();
      },
      clear(callback) {
        this._data = {};
        if (callback) callback();
      },
    },
  },
  alarms: {
    _alarms: {},
    create(name, alarmInfo) {
      this._alarms[name] = alarmInfo;
    },
    get(name, callback) {
      if (callback) callback(this._alarms[name] || null);
    },
    getAll(callback) {
      if (callback) callback(Object.values(this._alarms));
    },
    clear(name, callback) {
      const existed = !!this._alarms[name];
      delete this._alarms[name];
      if (callback) callback(existed);
    },
    clearAll(callback) {
      this._alarms = {};
      if (callback) callback(true);
    },
    onAlarm: {
      _listeners: [],
      addListener(callback) {
        this._listeners.push(callback);
      },
      removeListener(callback) {
        this._listeners = this._listeners.filter((l) => l !== callback);
      },
      fire(name) {
        this._listeners.forEach((l) => l({ name }));
      },
    },
  },
  runtime: {
    sendMessage(message, callback) {
      if (callback) callback({});
    },
    onMessage: {
      _listeners: [],
      addListener(callback) {
        this._listeners.push(callback);
      },
      removeListener(callback) {
        this._listeners = this._listeners.filter((l) => l !== callback);
      },
      fire(message, sender, sendResponse) {
        this._listeners.forEach((l) => l(message, sender, sendResponse));
      },
    },
    getURL(path) {
      return `chrome-extension://test-id/${path}`;
    },
  },
  notifications: {
    create(id, options, callback) {
      if (callback) callback();
    },
  },
};

global.chrome = chrome;
