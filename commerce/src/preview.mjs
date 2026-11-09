import { createStore } from './store.mjs';

// This entry point is only used by the loopback-only preview config.
const store = createStore(() => true, { preview: true });

export default {
  fetch(request, env) {
    if (new URL(request.url).hostname !== '127.0.0.1') {
      return new Response('Local preview only.', { status: 403 });
    }
    return store.fetch(request, env);
  }
};
