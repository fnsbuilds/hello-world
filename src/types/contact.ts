export interface CreateContactInput {
  name: string;
  email: string;
  phone: string;
}

export interface UpdateContactInput {
  name?: string;
  email?: string;
  phone?: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: Date;
  updatedAt: Date;
}