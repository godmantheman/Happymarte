# Happy Mart Security Specification

## 1. Data Invariants
1. Products: Must have positive or zero price, non-negative stock, valid name (<=100 chars), valid category (<=50 chars).
2. Orders: Must contain studentName (1..50 chars), valid status ('PENDING', 'APPROVED', 'COMPLETED', 'REJECTED'), non-negative totalPrice. When created, status starts as 'PENDING'.
3. Order Status Transitions:
   - PENDING -> APPROVED | REJECTED
   - APPROVED -> COMPLETED | REJECTED
   - REJECTED is a terminal state.
   - Teachers (Admin: 0319sea2@gmail.com) can manage orders and update status.
4. Students: Student records have valid name (1..50 chars) and non-negative balance.
5. StoreConfig: Open/close status and notice can only be adjusted by teachers.

## 2. The Dirty Dozen Test Scenarios
1. Injecting 2MB string into product name.
2. Negative price product creation (e.g. price: -500).
3. Student creating order directly in APPROVED or COMPLETED state.
4. Student altering order status to APPROVED themselves.
5. Updating student balance to negative without validation.
6. Non-admin modifying storeConfig to closed or open.
7. Unauthenticated user deleting products collection.
8. Injection of invalid status string ('HACKED_STATE') into orders.
9. Excessive length memo (> 1000 characters).
10. Attempting to modify immutable order createdAt.
11. Attempting to modify product id path with special injection characters.
12. Attempting to bypass rejectReason limit with malicious buffer.

## 3. Security Rules Defense
All collections implement role validation (Admin teacher verification: 0319sea2@gmail.com or authenticated session), type safety, length checking, and action gates.
