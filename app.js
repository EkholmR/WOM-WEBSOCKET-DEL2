// byt när del 1 är deployad
const CONFIG = {
  LOGIN_URL: 'http://localhost:3000/api/auth/login',
  WS_URL: 'ws://localhost:8080'
};

const TOKEN_KEY = 'jwt';

const loginSection = document.getElementById('login-section');
const appSection = document.getElementById('app-section');
const loginForm = document.getElementById('login-form');
const loginMessage = document.getElementById('login-message');
const logoutBtn = document.getElementById('logout-btn');

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function showLoggedIn() {
  loginSection.hidden = true;
  appSection.hidden = false;
}

function showLoggedOut(message = '') {
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

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem(TOKEN_KEY);
  showLoggedOut();
});

//  stay logged in if a token is stored
if (getToken()) {
  showLoggedIn();
} else {
  showLoggedOut();
}