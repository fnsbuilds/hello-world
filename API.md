# API de Cadastro de Contatos

API RESTful para gerenciamento de contatos construída com Fastify, TypeScript e Prisma.

## Documentação Interativa

Acesse a documentação Swagger em: **http://localhost:3000/docs**

---

## Base URL

```
http://localhost:3000
```

## Endpoints

### Contatos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/contacts` | Lista todos os contatos |
| GET | `/contacts/:id` | Busca contato por ID |
| POST | `/contacts` | Cria novo contato |
| PUT | `/contacts/:id` | Atualiza contato |
| DELETE | `/contacts/:id` | Remove contato |

---

## GET /contacts

Lista todos os contatos cadastrados.

**Resposta**
```json
{
  "statusCode": 200,
  "contacts": [
    {
      "id": "uuid",
      "name": "Felipe Silva",
      "email": "felipe@email.com",
      "phone": "11999999999",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

## GET /contacts/:id

Busca um contato específico pelo ID.

**Parâmetros**
| Nome | Tipo | Descrição |
|------|------|-----------|
| id | string | UUID do contato |

**Resposta (200)**
```json
{
  "id": "uuid",
  "name": "Felipe Silva",
  "email": "felipe@email.com",
  "phone": "11999999999",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Resposta (404)**
```json
{
  "statusCode": 404,
  "error": "Contato não encontrado"
}
```

---

## POST /contacts

Cria um novo contato.

**Corpo da requisição**
```json
{
  "name": "Felipe Silva",
  "email": "felipe@email.com",
  "phone": "11999999999"
}
```

**Campos**
| Campo | Tipo | Obrigatório | Regras |
|-------|------|-------------|--------|
| name | string | Sim | Não vazio |
| email | string | Sim | Formato válido, único |
| phone | string | Sim | 11 dígitos numéricos, único |

**Resposta (201)**
```json
{
  "id": "uuid",
  "name": "Felipe Silva",
  "email": "felipe@email.com",
  "phone": "11999999999",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Erros**
| Status | Erro |
|--------|------|
| 400 | Nome é obrigatório |
| 400 | Email inválido |
| 400 | Telefone inválido (deve ter 11 dígitos numéricos) |
| 409 | Email já cadastrado |
| 409 | Telefone já cadastrado |

---

## PUT /contacts/:id

Atualiza um contato existente.

**Parâmetros**
| Nome | Tipo | Descrição |
|------|------|-----------|
| id | string | UUID do contato |

**Corpo da requisição** (todos opcionais)
```json
{
  "name": "Felipe Silva",
  "email": "felipe@novoemail.com",
  "phone": "21999999999"
}
```

**Resposta (200)**
```json
{
  "id": "uuid",
  "name": "Felipe Silva",
  "email": "felipe@novoemail.com",
  "phone": "21999999999",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Erros**
| Status | Erro |
|--------|------|
| 400 | Nome é obrigatório |
| 400 | Email inválido |
| 400 | Telefone inválido (deve ter 11 dígitos numéricos) |
| 404 | Contato não encontrado |
| 409 | Email já cadastrado |
| 409 | Telefone já cadastrado |

---

## DELETE /contacts/:id

Remove um contato.

**Parâmetros**
| Nome | Tipo | Descrição |
|------|------|-----------|
| id | string | UUID do contato |

**Resposta**
- Status: `204 No Content`

**Erros**
| Status | Erro |
|--------|------|
| 404 | Contato não encontrado |

---

## Exemplos

### Criar contato com cURL

```bash
curl -X POST http://localhost:3000/contacts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Felipe Silva",
    "email": "felipe@email.com",
    "phone": "11999999999"
  }'
```

### Listar todos os contatos

```bash
curl http://localhost:3000/contacts
```

### Buscar contato por ID

```bash
curl http://localhost:3000/contacts/uuid-aqui
```

### Atualizar contato

```bash
curl -X PUT http://localhost:3000/contacts/uuid-aqui \
  -H "Content-Type: application/json" \
  -d '{"name": "Felipe Atualizado"}'
```

### Deletar contato

```bash
curl -X DELETE http://localhost:3000/contacts/uuid-aqui
```

---

## Códigos de Status

| Status | Descrição |
|--------|-----------|
| 200 |OK |
| 201 | Criado com sucesso |
| 204 | Deletado com sucesso |
| 400 | Erro de validação |
| 404 | Recurso não encontrado |
| 409 | Conflito (dado duplicado) |
| 500 | Erro interno do servidor |