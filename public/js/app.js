const API_URL = '/contacts';
const AUTH_URL = '/auth';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\d{11}$/;

const authSection = document.getElementById('authSection');
const contactSection = document.getElementById('contactSection');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const forgotPasswordForm = document.getElementById('forgotPasswordForm');
const resetPasswordForm = document.getElementById('resetPasswordForm');
const tabLogin = document.getElementById('tabLogin');
const tabRegister = document.getElementById('tabRegister');
const logoutBtn = document.getElementById('logoutBtn');
const forgotPasswordLink = document.getElementById('forgotPasswordLink');
const backToLogin = document.getElementById('backToLogin');

const form = document.getElementById('contactForm');
const formTitle = document.getElementById('formTitle');
const contactId = document.getElementById('contactId');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');
const submitBtn = document.getElementById('submitBtn');
const cancelBtn = document.getElementById('cancelBtn');
const contactsList = document.getElementById('contactsList');
const loading = document.getElementById('loading');
const toast = document.getElementById('toast');

let token = localStorage.getItem('token');

function showToast(message, type = 'success') {
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  setTimeout(() => {
    toast.className = 'toast';
  }, 3000);
}

function getAuthHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

function showAuth() {
  authSection.style.display = 'block';
  contactSection.style.display = 'none';
  logoutBtn.style.display = 'none';
}

function showContacts() {
  authSection.style.display = 'none';
  contactSection.style.display = 'block';
  logoutBtn.style.display = 'block';
}

function updateUI() {
  if (token) {
    showContacts();
    fetchContacts();
  } else {
    checkResetToken();
    if (!getTokenFromUrl()) {
      showAuth();
    }
  }
}

tabLogin.addEventListener('click', () => {
  loginForm.style.display = 'block';
  registerForm.style.display = 'none';
  tabLogin.classList.add('active');
  tabRegister.classList.remove('active');
});

tabRegister.addEventListener('click', () => {
  loginForm.style.display = 'none';
  registerForm.style.display = 'block';
  tabLogin.classList.remove('active');
  tabRegister.classList.add('active');
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  try {
    const response = await fetch(`${AUTH_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const result = await response.json();

    if (response.ok) {
      token = result.token;
      localStorage.setItem('token', token);
      showToast('Login realizado com sucesso!');
      loginForm.reset();
      updateUI();
    } else {
      showToast(result.error, 'error');
    }
  } catch (error) {
    showToast('Erro ao fazer login', 'error');
  }
});

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value;
  const confirmPassword = document.getElementById('registerConfirmPassword').value;

  if (password !== confirmPassword) {
    showToast('As senhas não conferem', 'error');
    return;
  }

  try {
    const response = await fetch(`${AUTH_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const result = await response.json();

    if (response.ok) {
      token = result.token;
      localStorage.setItem('token', token);
      showToast('Conta criada com sucesso!');
      registerForm.reset();
      updateUI();
    } else {
      showToast(result.error, 'error');
    }
  } catch (error) {
    showToast('Erro ao criar conta', 'error');
  }
});

logoutBtn.addEventListener('click', () => {
  token = null;
  localStorage.removeItem('token');
  showToast('Logout realizado!');
  updateUI();
});

function showForgotPassword() {
  loginForm.style.display = 'none';
  registerForm.style.display = 'none';
  forgotPasswordForm.style.display = 'block';
  resetPasswordForm.style.display = 'none';
  tabLogin.parentElement.style.display = 'none';
}

function showLogin() {
  loginForm.style.display = 'block';
  registerForm.style.display = 'none';
  forgotPasswordForm.style.display = 'none';
  resetPasswordForm.style.display = 'none';
  tabLogin.parentElement.style.display = 'flex';
  tabLogin.classList.add('active');
  tabRegister.classList.remove('active');
}

function showResetPassword() {
  loginForm.style.display = 'none';
  registerForm.style.display = 'none';
  forgotPasswordForm.style.display = 'none';
  resetPasswordForm.style.display = 'block';
  tabLogin.parentElement.style.display = 'none';
}

function getTokenFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('token');
}

forgotPasswordLink.addEventListener('click', (e) => {
  e.preventDefault();
  showForgotPassword();
});

backToLogin.addEventListener('click', (e) => {
  e.preventDefault();
  showLogin();
});

forgotPasswordForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('forgotEmail').value.trim();

  try {
    const response = await fetch(`${AUTH_URL}/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const result = await response.json();

    if (response.ok) {
      showToast('Email de recuperação enviado! Verifique sua caixa de entrada.');
      forgotPasswordForm.reset();
    } else {
      showToast(result.error, 'error');
    }
  } catch (error) {
    showToast('Erro ao enviar email de recuperação', 'error');
  }
});

resetPasswordForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const password = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmNewPassword').value;
  const resetToken = getTokenFromUrl();

  if (!resetToken) {
    showToast('Token inválido', 'error');
    return;
  }

  if (password !== confirmPassword) {
    showToast('As senhas não conferem', 'error');
    return;
  }

  if (password.length < 6) {
    showToast('Senha deve ter pelo menos 6 caracteres', 'error');
    return;
  }

  try {
    const response = await fetch(`${AUTH_URL}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: resetToken, password })
    });

    const result = await response.json();

    if (response.ok) {
      showToast('Senha alterada com sucesso! Faça login com a nova senha.');
      window.location.href = '/';
    } else {
      showToast(result.error, 'error');
    }
  } catch (error) {
    showToast('Erro ao redefinir senha', 'error');
  }
});

function checkResetToken() {
  const resetToken = getTokenFromUrl();
  if (resetToken) {
    showResetPassword();
  }
}

function validateForm() {
  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const phone = phoneInput.value.trim();

  if (!name) {
    showToast('Nome é obrigatório', 'error');
    nameInput.focus();
    return false;
  }

  if (!email) {
    showToast('Email é obrigatório', 'error');
    emailInput.focus();
    return false;
  }

  if (!EMAIL_REGEX.test(email)) {
    showToast('Email inválido', 'error');
    emailInput.focus();
    return false;
  }

  if (!phone) {
    showToast('Telefone é obrigatório', 'error');
    phoneInput.focus();
    return false;
  }

  if (!PHONE_REGEX.test(phone)) {
    showToast('Telefone inválido (deve ter 11 dígitos numéricos)', 'error');
    phoneInput.focus();
    return false;
  }

  return true;
}

async function fetchContacts() {
  loading.style.display = 'block';
  contactsList.innerHTML = '';
  
  try {
    const response = await fetch(API_URL, { headers: getAuthHeaders() });
    
    if (response.status === 401) {
      showToast('Sessão expirada. Faça login novamente.', 'error');
      logoutBtn.click();
      return;
    }
    
    const contacts = await response.json();
    loading.style.display = 'none';
    
    if (contacts.length === 0) {
      contactsList.innerHTML = '<p style="text-align: center; color: #6b7280;">Nenhum contato cadastrado</p>';
      return;
    }
    
    contacts.forEach(contact => {
      const card = document.createElement('div');
      card.className = 'contact-card';
      card.innerHTML = `
        <div class="contact-info">
          <h3>${escapeHtml(contact.name)}</h3>
          <p>${escapeHtml(contact.email)}</p>
          <p>${escapeHtml(contact.phone)}</p>
        </div>
        <div class="contact-actions">
          <button class="btn-edit" onclick="editContact('${contact.id}')">Editar</button>
          <button class="btn-delete" onclick="deleteContact('${contact.id}')">Excluir</button>
        </div>
      `;
      contactsList.appendChild(card);
    });
  } catch (error) {
    loading.style.display = 'none';
    showToast('Erro ao carregar contatos', 'error');
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function resetForm() {
  form.reset();
  contactId.value = '';
  formTitle.textContent = 'Novo Contato';
  submitBtn.textContent = 'Adicionar';
  cancelBtn.style.display = 'none';
}

function editContact(id) {
  const card = event.target.closest('.contact-card');
  const info = card.querySelector('.contact-info');
  
  contactId.value = id;
  nameInput.value = info.querySelector('h3').textContent;
  emailInput.value = info.querySelectorAll('p')[0].textContent;
  phoneInput.value = info.querySelectorAll('p')[1].textContent;
  
  formTitle.textContent = 'Editar Contato';
  submitBtn.textContent = 'Atualizar';
  cancelBtn.style.display = 'block';
  
  nameInput.focus();
}

async function deleteContact(id) {
  if (!confirm('Deseja realmente excluir este contato?')) return;
  
  try {
    const response = await fetch(`${API_URL}/${id}`, { 
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    if (response.status === 401) {
      showToast('Sessão expirada. Faça login novamente.', 'error');
      logoutBtn.click();
      return;
    }
    
    if (response.ok) {
      showToast('Contato excluído com sucesso!');
      fetchContacts();
    } else {
      showToast('Erro ao excluir contato', 'error');
    }
  } catch (error) {
    showToast('Erro ao excluir contato', 'error');
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  if (!validateForm()) return;
  
  const data = {
    name: nameInput.value.trim(),
    email: emailInput.value.trim(),
    phone: phoneInput.value.trim()
  };
  
  const isEditing = contactId.value !== '';
  const url = isEditing ? `${API_URL}/${contactId.value}` : API_URL;
  const method = isEditing ? 'PUT' : 'POST';
  
  try {
    const response = await fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    
    if (response.status === 401) {
      showToast('Sessão expirada. Faça login novamente.', 'error');
      logoutBtn.click();
      return;
    }
    
    const result = await response.json();
    
    if (response.ok) {
      showToast(isEditing ? 'Contato atualizado!' : 'Contato adicionado!');
      resetForm();
      fetchContacts();
    } else if (response.status === 400 || response.status === 409) {
      showToast(result.error, 'error');
    } else {
      showToast('Erro ao salvar contato', 'error');
    }
  } catch (error) {
    showToast('Erro ao salvar contato', 'error');
  }
});

cancelBtn.addEventListener('click', resetForm);

phoneInput.addEventListener('input', function() {
  this.value = this.value.replace(/\D/g, '');
});

updateUI();