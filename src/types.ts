export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'admin' | 'user';
  createdAt: number;
}

export interface Business {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  category: string;
  logo?: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  createdAt: number;
  updatedAt: number;
}

export interface Product {
  id: string;
  businessId: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  category: string;
  stock: number;
  createdAt: number;
  updatedAt: number;
}

export interface Negotiation {
  id: string;
  businessId: string;
  customerId: string;
  productId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'countered';
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
  offerPrice?: number;
}
