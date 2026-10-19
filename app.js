// Change these two URLs when the servers are deployed
const CONFIG = {
  LOGIN_URL: 'http://localhost:3000/api/auth/login',
  WS_URL: 'wss://websocket-server-npvo.onrender.com'
};

const TOKEN_KEY = 'jwt';

const loginSection = document.getElementById('login-section');
const appSection = document.getElementById('app-section');
const loginForm = document.getElementById('login-form');
const loginMessage = document.getElementById('login-message');
const logoutBtn = document.getElementById('logout-btn');
const statusEl = document.getElementById('status');
const reconnectBtn = document.getElementById('reconnect-btn');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const messagesEl = document.getElementById('messages');

let socket = null;

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setStatus(state, text) {
  statusEl.textContent = text;
  statusEl.className = `status ${state}`;
}

// Show a received message
function addMessage(text) {
  const li = document.createElement('li');

  const span = document.createElement('span');
  span.textContent = text; // textContent, so received text is never run as HTML

  const copyBtn = document.createElement('button');
  copyBtn.type = 'button';
  copyBtn.textContent = 'Kopiera';
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(text);
      copyBtn.textContent = 'Kopierad!';
    } catch (err) {
      copyBtn.textContent = 'Kunde inte kopiera';
    }
    setTimeout(() => { copyBtn.textContent = 'Kopiera'; }, 1500);
  });

  li.append(span, copyBtn);
  messagesEl.prepend(li);
}

function sendMessage() {
  const text = messageInput.value;
  if (text.trim() === '') return;

  if (!socket || socket.readyState !== WebSocket.OPEN) {
    setStatus('disconnected', 'Frånkopplad  kan inte skicka');
    return;
  }

  socket.send(text);
  messageInput.value = '';
  // The server sends the message back to us too, so it shows up via onmessage
}

function closeSocket() {
  if (socket) {
    const old = socket;
    socket = null; // handlers below ignore sockets that are no longer current
    old.close();
  }
}

function connect() {
  const token = getToken();
  if (!token) {
    showLoggedOut();
    return;
  }

  closeSocket();
  setStatus('connecting', 'Ansluter...');

  const ws = new WebSocket(`${CONFIG.WS_URL}?token=${encodeURIComponent(token)}`);
  socket = ws;

  ws.onopen = () => {
    if (ws === socket) setStatus('connected', 'Ansluten');
  };
  ws.onmessage = (event) => {
    if (ws === socket) addMessage(event.data);
  };
  ws.onclose = () => {
    if (ws === socket) setStatus('disconnected', 'Frånkopplad');
  };
  // Browsers give no details about a failed connection; onclose follows anyway
  ws.onerror = () => {};
}

function showLoggedIn() {
  loginSection.hidden = true;
  appSection.hidden = false;
  connect();
}

function showLoggedOut(message = '') {
  closeSocket();
  loginSection.hidden = false;
  appSection.hidden = true;
  loginMessage.textContent = message;
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  loginMessage.textContent = '';

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  try {
    const response = await fetch(CONFIG.LOGIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      loginMessage.textContent = data.error || `Inloggningen misslyckades (${response.status})`;
      return;
    }

    localStorage.setItem(TOKEN_KEY, data.token);
    loginForm.reset();
    showLoggedIn();
  } catch (err) {
    loginMessage.textContent = 'Kunde inte nå inloggningstjänsten. Kontrollera adressen och att servern kör.';
  }
});

sendBtn.addEventListener('click', sendMessage);

// Ctrl+Enter sends from inside the text box
messageInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && event.ctrlKey) {
    event.preventDefault();
    sendMessage();
  }
});

reconnectBtn.addEventListener('click', connect);

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem(TOKEN_KEY);
  messagesEl.innerHTML = '';
  showLoggedOut();
});

// On page load: stay logged in if a token is stored
if (getToken()) {
  showLoggedIn();
} else {
  showLoggedOut();
}