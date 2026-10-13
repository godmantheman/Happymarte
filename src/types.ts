export type ProductCategory = '간식' | '문구류' | '특별쿠폰' | '장난감' | '기타';

export interface Product {
  id: string;
  name: string;
  price: number;
  category: ProductCategory;
  stock: number;
  emoji: string;
  description: string;
  imageUrl?: string;
  isAvailable: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type OrderStatus = 'PENDING' | 'APPROVED' | 'COMPLETED' | 'REJECTED';

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  emoji: string;
}

export interface Order {
  id: string;
  studentName: string;
  studentId: string;
  items: OrderItem[];
  itemsSummary: string;
  totalPrice: number;
  memo?: string;
  status: OrderStatus;
  rejectReason?: string;
  createdAt: string;
  updatedAt?: string;
}

export type UserRole = 'TEACHER' | 'STUDENT';

export interface Student {
  id: string;
  name: string;
  role?: UserRole;
  grade: string;
  classroom: string;
  balance: number;
  avatar: string;
  totalEarned?: number;
  totalSpent?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface StoreConfig {
  id?: string;
  isOpen: boolean;
  storeNotice: string;
  currencyUnit: string;
  adminPin: string;
  soundEnabled: boolean;
  updatedAt?: string;
}

export interface MoneyTransaction {
  id: string;
  studentId: string;
  studentName: string;
  type: 'EARN' | 'SPEND' | 'REFUND' | 'SET';
  amount: number;
  reason: string;
  createdAt: string;
}
