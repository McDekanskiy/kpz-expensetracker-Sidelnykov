class EventBus {
  constructor() { this.listeners = new Map(); }

  subscribe(eventName, listener) {
    const list = this.listeners.get(eventName) || [];
    list.push(listener);
    this.listeners.set(eventName, list);
  }

  unsubscribe(eventName, listener) {
    const list = this.listeners.get(eventName) || [];
    this.listeners.set(eventName, list.filter((item) => item !== listener));
  }

  publish(eventName, payload) {
    const list = this.listeners.get(eventName) || [];
    list.forEach((listener) => listener(payload));
  }
}

module.exports = { EventBus };
