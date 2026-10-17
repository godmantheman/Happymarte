import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  runTransaction,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Product, Order, Student, StoreConfig, OrderStatus } from '../types';
import {
  TEMPLATE_PRODUCTS,
  TEMPLATE_STUDENTS,
  TEMPLATE_CONFIG,
  TEMPLATE_TEACHER,
} from '../utils/initialData';

const PRODUCTS_COLLECTION = 'products';
const ORDERS_COLLECTION = 'orders';
const STUDENTS_COLLECTION = 'students';
const CONFIG_COLLECTION = 'storeConfig';
const CONFIG_DOC_ID = 'general';

/**
 * Initialize Firestore data if collections are empty on first run
 */
export async function seedInitialDataIfNeeded(): Promise<void> {
  try {
    // 1. Ensure students collection has template users
    const studentSnap = await getDocs(collection(db, STUDENTS_COLLECTION));
    if (studentSnap.empty) {
      for (const s of TEMPLATE_STUDENTS) {
        await setDoc(doc(db, STUDENTS_COLLECTION, s.id), {
          ...s,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    } else {
      // Ensure Bang So-jeong teacher account exists
      const teacherQ = query(
        collection(db, STUDENTS_COLLECTION),
        where('name', '==', '방소정')
      );
      const teacherSnap = await getDocs(teacherQ);
      if (teacherSnap.empty) {
        await setDoc(doc(db, STUDENTS_COLLECTION, TEMPLATE_TEACHER.id), {
          ...TEMPLATE_TEACHER,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }

    // 2. Ensure products collection has template goods
    const prodSnap = await getDocs(collection(db, PRODUCTS_COLLECTION));
    if (prodSnap.empty) {
      for (const p of TEMPLATE_PRODUCTS) {
        await setDoc(doc(db, PRODUCTS_COLLECTION, p.id), {
          ...p,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }

    // 3. Ensure store config exists
    const configDoc = await getDoc(doc(db, CONFIG_COLLECTION, CONFIG_DOC_ID));
    if (!configDoc.exists()) {
      await setDoc(doc(db, CONFIG_COLLECTION, CONFIG_DOC_ID), {
        ...TEMPLATE_CONFIG,
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error('Initial seeding error on Firestore:', err);
  }
}

/**
 * Reset / Reload template data to Firestore
 */
export async function resetToTemplateData(): Promise<void> {
  try {
    for (const s of TEMPLATE_STUDENTS) {
      await setDoc(doc(db, STUDENTS_COLLECTION, s.id), {
        ...s,
        updatedAt: new Date().toISOString(),
      });
    }
    for (const p of TEMPLATE_PRODUCTS) {
      await setDoc(doc(db, PRODUCTS_COLLECTION, p.id), {
        ...p,
        updatedAt: new Date().toISOString(),
      });
    }
    await setDoc(doc(db, CONFIG_COLLECTION, CONFIG_DOC_ID), {
      ...TEMPLATE_CONFIG,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'template-reset');
  }
}

/**
 * Name-based login function using Firebase Firestore:
 * - If name is "방소정", automatically grants teacher role!
 * - If student already exists in Firestore, logs in as that student.
 * - If student doesn't exist, automatically registers them in Firestore with default 2,000 happiness money.
 */
export async function loginByName(rawName: string): Promise<Student> {
  const name = rawName.trim();
  if (!name) {
    throw new Error('이름을 입력해주세요.');
  }

  const isTeacher = name === '방소정';

  try {
    const q = query(
      collection(db, STUDENTS_COLLECTION),
      where('name', '==', name)
    );
    const snap = await getDocs(q);

    if (!snap.empty) {
      const docSnap = snap.docs[0];
      const data = docSnap.data() as Student;
      const userObj: Student = {
        ...data,
        id: docSnap.id,
        role: isTeacher ? 'TEACHER' : (data.role || 'STUDENT'),
      };

      // If teacher role wasn't saved yet, update it
      if (isTeacher && data.role !== 'TEACHER') {
        await updateDoc(doc(db, STUDENTS_COLLECTION, docSnap.id), {
          role: 'TEACHER',
          avatar: 'teacher',
          grade: '교사',
          updatedAt: new Date().toISOString(),
        });
      }
      return userObj;
    }

    // User not found in Firestore -> Create new user doc
    const newId = isTeacher ? 'teacher-bang' : `student-${Date.now()}`;
    const newUser: Student = {
      id: newId,
      name,
      role: isTeacher ? 'TEACHER' : 'STUDENT',
      grade: isTeacher ? '교사' : '2학년',
      classroom: '특수학급',
      balance: isTeacher ? 0 : 2000,
      avatar: isTeacher ? 'teacher' : 'star',
      totalEarned: isTeacher ? 0 : 2000,
      totalSpent: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, STUDENTS_COLLECTION, newId), newUser);
    return newUser;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, STUDENTS_COLLECTION);
    // Fallback object in case of temporary offline
    return {
      id: `fallback-${Date.now()}`,
      name,
      role: isTeacher ? 'TEACHER' : 'STUDENT',
      grade: isTeacher ? '교사' : '2학년',
      classroom: '특수학급',
      balance: isTeacher ? 0 : 2000,
      avatar: isTeacher ? 'teacher' : 'star',
    };
  }
}

/**
 * Real-time subscription to Products
 */
export function subscribeProducts(callback: (products: Product[]) => void): () => void {
  try {
    const unsub = onSnapshot(
      collection(db, PRODUCTS_COLLECTION),
      (snapshot) => {
        if (snapshot.empty) {
          seedInitialDataIfNeeded();
          callback(TEMPLATE_PRODUCTS);
          return;
        }
        const items: Product[] = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...(docSnap.data() as Omit<Product, 'id'>) });
        });
        callback(items);
      },
      (error) => {
        console.error('Firestore products subscription error:', error);
        handleFirestoreError(error, OperationType.GET, PRODUCTS_COLLECTION);
        callback(TEMPLATE_PRODUCTS);
      }
    );
    return unsub;
  } catch {
    callback(TEMPLATE_PRODUCTS);
    return () => {};
  }
}

/**
 * Real-time subscription to Orders
 */
export function subscribeOrders(callback: (orders: Order[]) => void): () => void {
  try {
    const q = query(collection(db, ORDERS_COLLECTION), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list: Order[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...(docSnap.data() as Omit<Order, 'id'>) });
        });
        callback(list);
      },
      (error) => {
        console.error('Firestore orders subscription error:', error);
        handleFirestoreError(error, OperationType.GET, ORDERS_COLLECTION);
        callback([]);
      }
    );
    return unsub;
  } catch {
    callback([]);
    return () => {};
  }
}

/**
 * Real-time subscription to Students
 */
export function subscribeStudents(callback: (students: Student[]) => void): () => void {
  try {
    const unsub = onSnapshot(
      collection(db, STUDENTS_COLLECTION),
      (snapshot) => {
        if (snapshot.empty) {
          seedInitialDataIfNeeded();
          callback(TEMPLATE_STUDENTS);
          return;
        }
        const list: Student[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...(docSnap.data() as Omit<Student, 'id'>) });
        });
        callback(list);
      },
      (error) => {
        console.error('Firestore students subscription error:', error);
        handleFirestoreError(error, OperationType.GET, STUDENTS_COLLECTION);
        callback(TEMPLATE_STUDENTS);
      }
    );
    return unsub;
  } catch {
    callback(TEMPLATE_STUDENTS);
    return () => {};
  }
}

/**
 * Real-time subscription to Store Configuration
 */
export function subscribeStoreConfig(callback: (config: StoreConfig) => void): () => void {
  try {
    const docRef = doc(db, CONFIG_COLLECTION, CONFIG_DOC_ID);
    const unsub = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          callback({ id: snapshot.id, ...(snapshot.data() as StoreConfig) });
        } else {
          seedInitialDataIfNeeded();
          callback(TEMPLATE_CONFIG);
        }
      },
      (error) => {
        console.error('Firestore config subscription error:', error);
        handleFirestoreError(error, OperationType.GET, `${CONFIG_COLLECTION}/${CONFIG_DOC_ID}`);
        callback(TEMPLATE_CONFIG);
      }
    );
    return unsub;
  } catch {
    callback(TEMPLATE_CONFIG);
    return () => {};
  }
}

/**
 * Place a new Order:
 * Decreases student's happiness money and product stock directly in Firestore
 */
export async function placeOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'status'>): Promise<string> {
  const orderId = `ord-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const now = new Date().toISOString();

  const newOrder: Order = {
    id: orderId,
    ...orderData,
    status: 'PENDING',
    createdAt: now,
    updatedAt: now,
  };

  try {
    // 1. Guaranteed Student Balance Deduction
    let targetStudentRef = null;
    let currentBalance = 3000;
    let currentSpent = 0;

    // Check by studentId first if given and not 'guest'
    if (orderData.studentId && orderData.studentId !== 'guest') {
      const byIdRef = doc(db, STUDENTS_COLLECTION, orderData.studentId);
      const byIdSnap = await getDoc(byIdRef);
      if (byIdSnap.exists()) {
        targetStudentRef = byIdRef;
        const sData = byIdSnap.data() as Student;
        currentBalance = sData.balance !== undefined ? sData.balance : 3000;
        currentSpent = sData.totalSpent || 0;
      }
    }

    // If not found by ID, look up by studentName
    if (!targetStudentRef && orderData.studentName) {
      const q = query(
        collection(db, STUDENTS_COLLECTION),
        where('name', '==', orderData.studentName.trim())
      );
      const nameSnap = await getDocs(q);
      if (!nameSnap.empty) {
        targetStudentRef = nameSnap.docs[0].ref;
        const sData = nameSnap.docs[0].data() as Student;
        currentBalance = sData.balance !== undefined ? sData.balance : 3000;
        currentSpent = sData.totalSpent || 0;
      }
    }

    if (targetStudentRef) {
      // Deduct balance directly in Firestore
      const newBal = Math.max(0, currentBalance - orderData.totalPrice);
      await updateDoc(targetStudentRef, {
        balance: newBal,
        totalSpent: currentSpent + orderData.totalPrice,
        updatedAt: now,
      });
    } else if (orderData.studentName) {
      // If student not found at all, create new student record with balance deducted from 3000
      const newStudentId = `student-${Date.now()}`;
      const newBal = Math.max(0, 3000 - orderData.totalPrice);
      await setDoc(doc(db, STUDENTS_COLLECTION, newStudentId), {
        id: newStudentId,
        name: orderData.studentName.trim(),
        role: 'STUDENT',
        grade: '중학교 2학년',
        classroom: '특수학급',
        balance: newBal,
        totalSpent: orderData.totalPrice,
        totalEarned: 3000,
        avatar: '🧒',
        createdAt: now,
        updatedAt: now,
      });
    }

    // 2. Decrement item stock safely
    for (const item of orderData.items) {
      try {
        const prodRef = doc(db, PRODUCTS_COLLECTION, item.productId);
        const pSnap = await getDoc(prodRef);
        if (pSnap.exists()) {
          const pData = pSnap.data() as Product;
          const newStock = Math.max(0, (pData.stock || 0) - item.quantity);
          await updateDoc(prodRef, {
            stock: newStock,
            isAvailable: newStock > 0,
            updatedAt: now,
          });
        }
      } catch (prodErr) {
        console.warn('Stock update warning for item:', item.productId, prodErr);
      }
    }

    // 3. Save Order to Firestore
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    await setDoc(orderRef, newOrder);
  } catch (error) {
    console.error('Order creation error:', error);
    try {
      await setDoc(doc(db, ORDERS_COLLECTION, orderId), newOrder);
    } catch (setErr) {
      handleFirestoreError(setErr, OperationType.CREATE, ORDERS_COLLECTION);
    }
  }

  return orderId;
}

/**
 * Teacher updates order status (APPROVE, COMPLETE, or REJECT)
 * When REJECTED: Restores student's happiness money balance and item stock!
 */
export async function updateOrderStatus(
  order: Order,
  newStatus: OrderStatus,
  rejectReason?: string
): Promise<void> {
  const now = new Date().toISOString();
  const orderRef = doc(db, ORDERS_COLLECTION, order.id);

  try {
    // If rejecting an order, refund student and restore stock!
    if (newStatus === 'REJECTED' && order.status !== 'REJECTED') {
      let targetStudentRef = null;
      let currentBal = 0;
      let currentSpent = 0;

      // Look up by studentId first
      if (order.studentId && order.studentId !== 'guest') {
        const sRef = doc(db, STUDENTS_COLLECTION, order.studentId);
        const sSnap = await getDoc(sRef);
        if (sSnap.exists()) {
          targetStudentRef = sRef;
          const sData = sSnap.data() as Student;
          currentBal = sData.balance || 0;
          currentSpent = sData.totalSpent || 0;
        }
      }

      // If not found, look up by name
      if (!targetStudentRef && order.studentName) {
        const nameQ = query(
          collection(db, STUDENTS_COLLECTION),
          where('name', '==', order.studentName.trim())
        );
        const nameSnap = await getDocs(nameQ);
        if (!nameSnap.empty) {
          targetStudentRef = nameSnap.docs[0].ref;
          const sData = nameSnap.docs[0].data() as Student;
          currentBal = sData.balance || 0;
          currentSpent = sData.totalSpent || 0;
        }
      }

      if (targetStudentRef) {
        await updateDoc(targetStudentRef, {
          balance: currentBal + order.totalPrice,
          totalSpent: Math.max(0, currentSpent - order.totalPrice),
          updatedAt: now,
        });
      }

      // Restore items stock
      for (const item of order.items) {
        try {
          const prodRef = doc(db, PRODUCTS_COLLECTION, item.productId);
          const pSnap = await getDoc(prodRef);
          if (pSnap.exists()) {
            const pData = pSnap.data() as Product;
            await updateDoc(prodRef, {
              stock: (pData.stock || 0) + item.quantity,
              isAvailable: true,
              updatedAt: now,
            });
          }
        } catch (pErr) {
          console.warn('Stock restore error:', pErr);
        }
      }
    }

    // Update order status in Firestore
    await updateDoc(orderRef, {
      status: newStatus,
      rejectReason: rejectReason || (newStatus === 'REJECTED' ? '선생님 확인 후 취소되었습니다' : ''),
      updatedAt: now,
    });
  } catch (error) {
    console.error('Order update error:', error);
  }
}

/**
 * Direct Money Setting by Teacher ("친구들 돈 설정"):
 * Sets exact balance for a student in Firestore
 */
export async function setStudentBalance(
  studentId: string,
  newBalance: number
): Promise<void> {
  const now = new Date().toISOString();
  const studentRef = doc(db, STUDENTS_COLLECTION, studentId);
  try {
    await updateDoc(studentRef, {
      balance: Math.max(0, newBalance),
      updatedAt: now,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${STUDENTS_COLLECTION}/${studentId}`);
  }
}

/**
 * Adjust student money by delta (+ / -) in Firestore
 */
export async function adjustStudentBalance(
  studentId: string,
  amountChange: number,
  reason: string
): Promise<void> {
  const now = new Date().toISOString();
  const studentRef = doc(db, STUDENTS_COLLECTION, studentId);

  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(studentRef);
      if (snap.exists()) {
        const data = snap.data() as Student;
        const newBalance = Math.max(0, (data.balance || 0) + amountChange);
        const newEarned = amountChange > 0 ? (data.totalEarned || 0) + amountChange : data.totalEarned || 0;
        tx.update(studentRef, {
          balance: newBalance,
          totalEarned: newEarned,
          updatedAt: now,
        });
      }
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${STUDENTS_COLLECTION}/${studentId}`);
  }
}

/**
 * Batch adjust all friends' money in Firestore (Teacher action)
 */
export async function batchAdjustAllStudents(amountChange: number): Promise<void> {
  const snap = await getDocs(collection(db, STUDENTS_COLLECTION));
  for (const docSnap of snap.docs) {
    const data = docSnap.data() as Student;
    if (data.role !== 'TEACHER') {
      const newBal = Math.max(0, (data.balance || 0) + amountChange);
      await updateDoc(docSnap.ref, {
        balance: newBal,
        updatedAt: new Date().toISOString(),
      });
    }
  }
}

/**
 * Batch set all friends' money to a target amount in Firestore (Teacher action)
 */
export async function batchSetAllStudents(targetAmount: number): Promise<void> {
  const snap = await getDocs(collection(db, STUDENTS_COLLECTION));
  for (const docSnap of snap.docs) {
    const data = docSnap.data() as Student;
    if (data.role !== 'TEACHER') {
      await updateDoc(docSnap.ref, {
        balance: Math.max(0, targetAmount),
        updatedAt: new Date().toISOString(),
      });
    }
  }
}

/**
 * Add product (Teacher panel)
 */
export async function addProduct(product: Omit<Product, 'id'>): Promise<string> {
  const id = `prod-${Date.now()}`;
  const now = new Date().toISOString();
  const newProduct: Product = {
    ...product,
    id,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(doc(db, PRODUCTS_COLLECTION, id), newProduct);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, PRODUCTS_COLLECTION);
  }
  return id;
}

/**
 * Update product (Teacher panel)
 */
export async function updateProduct(id: string, updates: Partial<Product>): Promise<void> {
  const now = new Date().toISOString();
  try {
    await updateDoc(doc(db, PRODUCTS_COLLECTION, id), {
      ...updates,
      updatedAt: now,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${PRODUCTS_COLLECTION}/${id}`);
  }
}

/**
 * Delete product (Teacher panel)
 */
export async function deleteProduct(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, PRODUCTS_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${PRODUCTS_COLLECTION}/${id}`);
  }
}

/**
 * Add new student to Firestore
 */
export async function addStudent(name: string, initialBalance: number = 2000, avatar: string = 'star'): Promise<string> {
  const id = `student-${Date.now()}`;
  const now = new Date().toISOString();
  const newStudent: Student = {
    id,
    name: name.trim(),
    role: name.trim() === '방소정' ? 'TEACHER' : 'STUDENT',
    grade: name.trim() === '방소정' ? '교사' : '2학년',
    classroom: '특수학급',
    balance: initialBalance,
    avatar,
    totalEarned: initialBalance,
    totalSpent: 0,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(doc(db, STUDENTS_COLLECTION, id), newStudent);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, STUDENTS_COLLECTION);
  }
  return id;
}

/**
 * Delete student from Firestore
 */
export async function deleteStudent(studentId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, STUDENTS_COLLECTION, studentId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${STUDENTS_COLLECTION}/${studentId}`);
  }
}

/**
 * Update store configuration
 */
export async function updateStoreConfig(config: Partial<StoreConfig>): Promise<void> {
  const now = new Date().toISOString();
  const docRef = doc(db, CONFIG_COLLECTION, CONFIG_DOC_ID);
  try {
    await updateDoc(docRef, {
      ...config,
      updatedAt: now,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${CONFIG_COLLECTION}/${CONFIG_DOC_ID}`);
  }
}
