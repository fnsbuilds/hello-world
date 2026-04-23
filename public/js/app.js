const API_URL = '/contacts';

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
  
  const data = {
    name: nameInput.value,
    email: emailInput.value,
    phone: phoneInput.value
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
    
    if (response.ok) {
      showToast(isEditing ? 'Contato atualizado!' : 'Contato adicionado!');
      resetForm();
      fetchContacts();
    } else if (response.status === 409) {
      showToast('Email já cadastrado', 'error');
    } else {
      showToast('Erro ao salvar contato', 'error');
    }
  } catch (error) {
    showToast('Erro ao salvar contato', 'error');
  }
});

cancelBtn.addEventListener('click', resetForm);

fetchContacts();