const API_URL = '/contacts';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\d{11}$/;

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

function showToast(message, type = 'success') {
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  setTimeout(() => {
    toast.className = 'toast';
  }, 3000);
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
    const response = await fetch(API_URL);
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
    const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
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

fetchContacts();