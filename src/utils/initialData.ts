import { Product, Student, StoreConfig } from '../types';
import { isChristmasSeason } from './seasonTheme';

export const LEGACY_DEFAULT_PRODUCT_IDS = [
  'prod-template-1',
  'prod-template-2',
  'prod-template-3',
  'prod-template-4',
  'prod-template-5',
  'prod-template-6',
];

export const TEMPLATE_TEACHER: Student = {
  id: 'teacher-bang',
  name: '방소정',
  role: 'TEACHER',
  grade: '교사',
  classroom: '2학년',
  balance: 0,
  avatar: 'teacher',
  totalEarned: 0,
  totalSpent: 0,
  createdAt: new Date().toISOString(),
};

export const TEMPLATE_STUDENTS: Student[] = [
  TEMPLATE_TEACHER,
  {
    id: 'student-1',
    name: '김도윤',
    role: 'STUDENT',
    grade: '2학년',
    classroom: '특수학급',
    balance: 3000,
    avatar: 'lion',
    totalEarned: 3000,
    totalSpent: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'student-2',
    name: '이서연',
    role: 'STUDENT',
    grade: '2학년',
    classroom: '특수학급',
    balance: 3000,
    avatar: 'rabbit',
    totalEarned: 3000,
    totalSpent: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'student-3',
    name: '박지훈',
    role: 'STUDENT',
    grade: '2학년',
    classroom: '특수학급',
    balance: 3000,
    avatar: 'panda',
    totalEarned: 3000,
    totalSpent: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'student-4',
    name: '최예은',
    role: 'STUDENT',
    grade: '2학년',
    classroom: '특수학급',
    balance: 3000,
    avatar: 'cat',
    totalEarned: 3000,
    totalSpent: 0,
    createdAt: new Date().toISOString(),
  },
];

// Default products removed so teacher adds real items directly
export const TEMPLATE_PRODUCTS: Product[] = [];

export const TEMPLATE_CONFIG: StoreConfig = {
  isOpen: true,
  storeNotice: '',
  currencyUnit: isChristmasSeason() ? 'CM' : '원',
  adminPin: '1234',
  soundEnabled: true,
};
