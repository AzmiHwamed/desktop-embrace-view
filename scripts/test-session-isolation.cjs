// Run: node --test scripts/test-session-isolation.cjs
// Uses real reducers/API/session code with isolated browser and Firebase adapters.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const deferred = () => {
  let resolve;
  const promise = new Promise(r => { resolve = r; });
  return { promise, resolve };
};
const response = (data, status = 200) => ({ status, ok: status < 400, text: async () => JSON.stringify({ data }) });
const tick = () => new Promise(resolve => setImmediate(resolve));

function harness() {
  const storage = new Map();
  const localStorage = {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: key => storage.delete(key),
  };
  const firebaseAuth = { currentUser: null };
  const firebaseDb = { online: true };
  const adapters = {
    fetch: async () => response({}),
    signIn: async (auth, token) => {
      auth.currentUser = { uid: token };
      return { user: auth.currentUser };
    },
  };
  const firebase = {
    signOut: async auth => { auth.currentUser = null; },
    signInWithCustomToken: (auth, token) => adapters.signIn(auth, token),
    goOffline: db => { db.online = false; },
    goOnline: db => { db.online = true; },
  };
  const context = vm.createContext({
    console, AbortController, AbortSignal, DOMException, Headers, FormData,
    setTimeout, clearTimeout, atob, localStorage,
    window: { localStorage, location: { pathname: '/login', replace() {} } },
    fetch: (...args) => adapters.fetch(...args),
  });
  const modules = new Map();
  function load(name, parent = root) {
    if (name === 'firebase/auth' || name === 'firebase/database') return firebase;
    if (!name.startsWith('.') && !name.startsWith('@/') && !path.isAbsolute(name)) return require(name);
    let file = name.startsWith('@/') ? path.join(root, 'src', name.slice(2)) : path.resolve(parent, name);
    if (file === path.join(root, 'src/lib/firebase')) return { firebaseAuth, firebaseDb };
    if (!path.extname(file)) file += '.ts';
    if (modules.has(file)) return modules.get(file).exports;
    if (file.endsWith('.json')) return JSON.parse(fs.readFileSync(file, 'utf8'));
    const module = { exports: {} };
    modules.set(file, module);
    const source = fs.readFileSync(file, 'utf8').replace('import.meta.env["VITE_API_BASE_URL"]', '"https://api.test"');
    const code = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText;
    vm.runInContext(`(function(exports,require,module){${code}\n})`, context)(
      module.exports, dep => load(dep, path.dirname(file)), module,
    );
    return module.exports;
  }
  const api = load('@/lib/api-client');
  const auth = load('@/features/auth/authSlice');
  const session = load('@/lib/firebase-session');
  const store = load('@/app/store').makeStore();
  return { store, api, auth, session, adapters, load, storage, firebaseAuth, firebaseDb };
}

test('logout resets every slice, reset tokens, budgets and chat; late actions are ignored', async () => {
  const h = harness();
  const initial = h.store.getState();
  const settle = (type, payload, id = type) => {
    h.store.dispatch({ type: `${type}/pending`, meta: { requestStatus: 'pending', requestId: id } });
    h.store.dispatch({ type: `${type}/fulfilled`, payload, meta: { requestStatus: 'fulfilled', requestId: id } });
  };
  h.api.storeTokens('A', 'refresh-A');
  h.firebaseAuth.currentUser = { uid: 'A' };
  settle('account/fetchProfile', { id: 'A' });
  settle('history/fetch', [{ id: 'expense-A' }]);
  settle('budgets/hydrate', { plans: [{ id: 'trip-A' }], activePlanId: 'trip-A' });
  settle('chat/fetchMyConversation', { id: 'chat-A' });
  settle('chat/fetchMessages', [{ id: 'message-A' }]);
  h.store.dispatch({ type: 'account/fetchProfile/pending', meta: { requestStatus: 'pending', requestId: 'late' } });
  h.store.dispatch(h.auth.logout());
  assert.deepEqual(h.store.getState(), initial);
  assert.equal(h.storage.has('smarttravel.token'), false);
  assert.equal(h.storage.has('smarttravel.refreshToken'), false);
  assert.equal(h.firebaseDb.online, false);
  h.store.dispatch({ type: 'account/fetchProfile/fulfilled', payload: { id: 'A' }, meta: { requestStatus: 'fulfilled', requestId: 'late' } });
  assert.equal(h.store.getState().account.profile, null);
  await tick();
  assert.equal(h.firebaseAuth.currentUser, null);
  h.store.dispatch(h.auth.continueAsGuest());
  assert.equal(h.store.getState().auth.isGuest, true);
  assert.equal(h.store.getState().budgets.hydrated, false);
});

test('late HTTP data cannot overwrite account B, even if fetch ignores abort', async () => {
  const h = harness();
  const old = deferred();
  let signal;
  h.api.storeTokens('A', 'refresh-A');
  h.adapters.fetch = async (_, options) => { signal = options.signal; return old.promise; };
  const { fetchProfile } = h.load('@/features/account/accountSlice');
  const request = h.store.dispatch(fetchProfile());
  h.store.dispatch(h.auth.logout());
  assert.equal(signal.aborted, true);
  h.api.storeTokens('B', 'refresh-B');
  h.adapters.fetch = async () => response({ id: 'B' });
  await h.store.dispatch(fetchProfile());
  old.resolve(response({ id: 'A' }));
  await request;
  assert.equal(h.store.getState().account.profile.id, 'B');
  assert.equal(h.store.getState().account.error, null);
});

test('refresh completing after logout cannot restore A tokens or erase B tokens', async () => {
  const h = harness();
  const refresh = deferred();
  h.api.storeTokens('A', 'refresh-A');
  h.adapters.fetch = async url => url.endsWith('/auth/refresh') ? refresh.promise : response({}, 401);
  const request = h.api.apiFetch('/users/me').catch(error => error);
  await tick();
  h.store.dispatch(h.auth.logout());
  h.api.storeTokens('B', 'refresh-B');
  refresh.resolve(response({ access_token: 'A-restored', refresh_token: 'refresh-A-restored' }));
  assert.equal((await request).name, 'AbortError');
  assert.equal(h.storage.get('smarttravel.token'), 'B');
  assert.equal(h.storage.get('smarttravel.refreshToken'), 'refresh-B');
});

test('pending login cannot restore credentials after logout', async () => {
  const h = harness();
  const login = deferred();
  h.adapters.fetch = async () => login.promise;
  const request = h.store.dispatch(h.auth.login({ email: 'a@example.test', password: 'test' }));
  h.store.dispatch(h.auth.logout());
  login.resolve(response({ idToken: 'A', refreshToken: 'refresh-A', user: { id: 'A' } }));
  await request;
  assert.equal(h.store.getState().auth.token, null);
  assert.equal(h.store.getState().auth.status, 'idle');
  assert.equal(h.storage.has('smarttravel.token'), false);
});

test('Firebase discards an old pending sign-in before establishing B', async () => {
  const h = harness();
  const signIn = deferred();
  h.api.storeTokens('A', 'refresh-A');
  h.adapters.fetch = async () => response({ customToken: 'A' });
  h.adapters.signIn = async (auth, token) => {
    if (token === 'A') await signIn.promise;
    auth.currentUser = { uid: token };
    return { user: auth.currentUser };
  };
  const old = h.session.ensureFirebaseSession().catch(error => error);
  await tick();
  h.store.dispatch(h.auth.logout());
  h.api.storeTokens('B', 'refresh-B');
  h.adapters.fetch = async () => response({ customToken: 'B' });
  const next = h.session.ensureFirebaseSession();
  signIn.resolve();
  assert.equal((await old).name, 'AbortError');
  await next;
  assert.equal(h.firebaseAuth.currentUser.uid, 'B');
  assert.equal(h.firebaseDb.online, true);
});

test('a persisted foreign Firebase user is replaced, not blindly reused', async () => {
  const h = harness();
  h.api.storeTokens('B', 'refresh-B');
  h.firebaseAuth.currentUser = { uid: 'A' };
  let calls = 0;
  h.adapters.fetch = async () => { calls++; return response({ customToken: 'B' }); };
  await Promise.all([h.session.ensureFirebaseSession(), h.session.ensureFirebaseSession()]);
  assert.equal(calls, 1);
  assert.equal(h.firebaseAuth.currentUser.uid, 'B');
});
