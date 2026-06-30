// App-wide state store — single source of truth for client state.
const state = {
  user: null,
  token: null,
};

const listeners = [];

export function getState() {
  return { ...state };
}

export function setState(patch) {
  Object.assign(state, patch);
  listeners.forEach((fn) => fn(state));
}

export function subscribe(fn) {
  listeners.push(fn);
  return () => listeners.splice(listeners.indexOf(fn), 1);
}
