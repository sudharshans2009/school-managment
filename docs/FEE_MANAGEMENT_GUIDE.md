# Fee Management System Guide

## Overview

The Fee Management System provides comprehensive functionality for managing fee structures, recording payments, tracking dues, and generating fee receipts. It supports multiple fee types, payment methods, and automated fee collection tracking.

## Server Actions

All fee management operations are handled through server actions located in `/actions/fees.ts`. These actions follow the repository pattern of returning `{ success, data?, error? }` for consistent error handling.

### Available Actions

#### 1. createFeeStructure

Create a new fee structure for a classroom or grade.

**Signature:**

```typescript
createFeeStructure(feeData: {
  classroomId?: string;
  grade?: string;
  feeType: string;
  amount: number;
  frequency?: string;
  dueDay?: number;
  academicYear: string;
  isActive?: boolean;
}): Promise<{ success: boolean; data?: FeeStructure; error?: string }>
```

**Fee Types**: tuition, transport, library, sports, lab, hostel, exam, etc.
**Frequency**: monthly, quarterly, annually, one-time

**Example Usage:**

```typescript
import { createFeeStructure } from "@/actions/fees";

const result = await createFeeStructure({
  classroomId: "classroom-uuid",
  feeType: "tuition",
  amount: 5000,
  frequency: "monthly",
  dueDay: 5, // 5th of each month
  academicYear: "2024-2025",
  isActive: true,
});

if (result.success) {
  console.log("Fee structure created:", result.data);
}
```

#### 2. updateFeeStructure

Update an existing fee structure.

**Signature:**

```typescript
updateFeeStructure(
  feeStructureId: string,
  feeData: Partial<{
    classroomId: string;
    grade: string;
    feeType: string;
    amount: number;
    frequency: string;
    dueDay: number;
    academicYear: string;
    isActive: boolean;
  }>
): Promise<{ success: boolean; data?: FeeStructure; error?: string }>
```

**Example Usage:**

```typescript
import { updateFeeStructure } from "@/actions/fees";

const result = await updateFeeStructure("fee-structure-uuid", {
  amount: 5500, // Update amount
  isActive: true,
});

if (result.success) {
  console.log("Fee structure updated");
}
```

#### 3. deleteFeeStructure

Delete a fee structure.

**Signature:**

```typescript
deleteFeeStructure(
  feeStructureId: string
): Promise<{ success: boolean; error?: string }>
```

**Note**: Deleting a fee structure will affect associated payment records. Consider setting `isActive: false` instead.

**Example Usage:**

```typescript
import { deleteFeeStructure } from "@/actions/fees";

const result = await deleteFeeStructure("fee-structure-uuid");

if (result.success) {
  console.log("Fee structure deleted");
}
```

#### 4. getFeeStructures

Get all fee structures with optional filters.

**Signature:**

```typescript
getFeeStructures(filters?: {
  classroomId?: string;
  grade?: string;
  academicYear?: string;
  isActive?: boolean;
}): Promise<{ success: boolean; data?: FeeStructure[]; error?: string }>
```

**Example Usage:**

```typescript
import { getFeeStructures } from "@/actions/fees";

// Get all active fee structures for current academic year
const result = await getFeeStructures({
  academicYear: "2024-2025",
  isActive: true,
});

// Get fee structures for a specific classroom
const classroomFees = await getFeeStructures({
  classroomId: "classroom-uuid",
});

if (result.success && result.data) {
  result.data.forEach((fee) => {
    console.log(`${fee.feeType}: ₹${fee.amount} (${fee.frequency})`);
  });
}
```

#### 5. recordPayment

Record a fee payment for a student.

**Signature:**

```typescript
recordPayment(paymentData: {
  studentId: string;
  feeStructureId: string;
  amount: number;
  paymentDate?: string | Date;
  dueDate: string | Date;
  status?: "pending" | "paid" | "overdue" | "partial";
  paymentMethod?: string;
  transactionId?: string;
  receiptNumber?: string;
  remarks?: string;
}): Promise<{ success: boolean; data?: FeePayment; error?: string }>
```

**Payment Methods**: cash, online, cheque, bank_transfer, upi, card

**Example Usage:**

```typescript
import { recordPayment } from "@/actions/fees";

const result = await recordPayment({
  studentId: "student-uuid",
  feeStructureId: "fee-structure-uuid",
  amount: 5000,
  paymentDate: new Date(),
  dueDate: "2024-12-05",
  status: "paid",
  paymentMethod: "online",
  transactionId: "TXN123456",
  receiptNumber: "REC2024001",
  remarks: "December 2024 tuition fee",
});

if (result.success) {
  console.log("Payment recorded:", result.data);
}
```

#### 6. updatePayment

Update an existing fee payment.

**Signature:**

```typescript
updatePayment(
  paymentId: string,
  paymentData: Partial<{
    amount: number;
    paymentDate: string | Date;
    dueDate: string | Date;
    status: "pending" | "paid" | "overdue" | "partial";
    paymentMethod: string;
    transactionId: string;
    receiptNumber: string;
    remarks: string;
  }>
): Promise<{ success: boolean; data?: FeePayment; error?: string }>
```

**Example Usage:**

```typescript
import { updatePayment } from "@/actions/fees";

const result = await updatePayment("payment-uuid", {
  status: "paid",
  paymentDate: new Date(),
  transactionId: "TXN789012",
});

if (result.success) {
  console.log("Payment updated");
}
```

#### 7. getFeesByStudent

Get all fee payments for a specific student.

**Signature:**

```typescript
getFeesByStudent(
  studentId: string,
  filters?: {
    status?: "pending" | "paid" | "overdue" | "partial";
    startDate?: string | Date;
    endDate?: string | Date;
  }
): Promise<{ success: boolean; data?: FeePayment[]; error?: string }>
```

**Example Usage:**

```typescript
import { getFeesByStudent } from "@/actions/fees";

// Get all pending fees
const result = await getFeesByStudent("student-uuid", {
  status: "pending",
});

// Get fees for academic year
const yearFees = await getFeesByStudent("student-uuid", {
  startDate: "2024-04-01",
  endDate: "2025-03-31",
});

if (result.success && result.data) {
  const totalDue = result.data.reduce(
    (sum, fee) => sum + parseFloat(fee.amount),
    0,
  );
  console.log(`Total due: ₹${totalDue}`);
}
```

#### 8. getFeesByClassroom

Get all fee payments for students in a classroom.

**Signature:**

```typescript
getFeesByClassroom(
  classroomId: string,
  filters?: {
    status?: "pending" | "paid" | "overdue" | "partial";
    academicYear?: string;
  }
): Promise<{ success: boolean; data?: FeePayment[]; error?: string }>
```

**Example Usage:**

```typescript
import { getFeesByClassroom } from "@/actions/fees";

const result = await getFeesByClassroom("classroom-uuid", {
  status: "pending",
});

if (result.success && result.data) {
  console.log(`Pending payments: ${result.data.length}`);
}
```

#### 9. getStudentFeeStatus

Get comprehensive fee status for a student including all dues and payments.

**Signature:**

```typescript
getStudentFeeStatus(
  studentId: string
): Promise<{ success: boolean; data?: StudentFeeStatus; error?: string }>
```

**Returns:**

```typescript
interface StudentFeeStatus {
  studentId: string;
  studentName: string;
  rollNumber: string;
  totalDue: number;
  totalPaid: number;
  totalPending: number;
  overdueFees: number;
  feeDetails: FeePayment[];
}
```

**Example Usage:**

```typescript
import { getStudentFeeStatus } from "@/actions/fees";

const result = await getStudentFeeStatus("student-uuid");

if (result.success && result.data) {
  const status = result.data;
  console.log(`Student: ${status.studentName}`);
  console.log(`Total Due: ₹${status.totalDue}`);
  console.log(`Paid: ₹${status.totalPaid}`);
  console.log(`Pending: ₹${status.totalPending}`);
  console.log(`Overdue: ₹${status.overdueFees}`);
}
```

#### 10. generateFeeReceipts

Generate fee receipts for all students in a classroom.

**Signature:**

```typescript
generateFeeReceipts(
  classroomId: string,
  feeStructureId: string,
  dueDate: string | Date
): Promise<{ success: boolean; data?: { count: number }; error?: string }>
```

**Use Case**: Bulk generation of monthly fee receipts for entire classroom.

**Example Usage:**

```typescript
import { generateFeeReceipts } from "@/actions/fees";

// Generate December fees for entire classroom
const result = await generateFeeReceipts(
  "classroom-uuid",
  "tuition-fee-structure-uuid",
  "2024-12-05",
);

if (result.success && result.data) {
  console.log(`Generated ${result.data.count} fee receipts`);
}
```

## Data Types

### FeeStructure

```typescript
interface FeeStructure {
  id: string;
  classroomId: string | null;
  grade: string | null;
  feeType: string;
  amount: string; // Decimal stored as string
  frequency: string | null; // monthly, quarterly, annually
  dueDay: number | null; // Day of month (1-31)
  academicYear: string;
  isActive: boolean | null;
  createdAt: Date | null;
  classroomName?: string | null;
}
```

### FeePayment

```typescript
interface FeePayment {
  id: string;
  studentId: string;
  feeStructureId: string;
  amount: string; // Decimal stored as string
  paymentDate: Date | null;
  dueDate: Date;
  status: "pending" | "paid" | "overdue" | "partial";
  paymentMethod: string | null;
  transactionId: string | null;
  receiptNumber: string | null;
  remarks: string | null;
  createdAt: Date | null;
  studentName?: string | null;
  studentRollNumber?: string | null;
  feeType?: string | null;
}
```

## Usage in Pages

### Admin Fee Management Page

```typescript
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createFeeStructure,
  getFeeStructures,
  generateFeeReceipts,
} from "@/actions/fees";

export default function AdminFeesPage() {
  const queryClient = useQueryClient();

  // Fetch fee structures
  const { data: feesResult } = useQuery({
    queryKey: ["fee-structures", academicYear],
    queryFn: () =>
      getFeeStructures({
        academicYear,
        isActive: true,
      }),
  });

  // Create fee structure
  const createMutation = useMutation({
    mutationFn: (feeData) => createFeeStructure(feeData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fee-structures"] });
      toast.success("Fee structure created");
    },
  });

  // Generate monthly receipts
  const generateMutation = useMutation({
    mutationFn: ({ classroomId, feeStructureId, dueDate }) =>
      generateFeeReceipts(classroomId, feeStructureId, dueDate),
    onSuccess: (result) => {
      toast.success(`Generated ${result.data?.count} receipts`);
    },
  });

  // Render UI...
}
```

### Student Fee Status Page

```typescript
import { getStudentFeeStatus, getFeesByStudent } from "@/actions/fees";

export default function StudentFeesPage() {
  // Get comprehensive fee status
  const { data: statusResult } = useQuery({
    queryKey: ["student-fee-status", studentId],
    queryFn: () => getStudentFeeStatus(studentId),
  });

  // Get detailed payment history
  const { data: paymentsResult } = useQuery({
    queryKey: ["student-payments", studentId],
    queryFn: () => getFeesByStudent(studentId),
  });

  if (statusResult?.success && statusResult.data) {
    const status = statusResult.data;

    return (
      <div>
        <h2>Fee Status</h2>
        <p>Total Due: ₹{status.totalDue}</p>
        <p>Paid: ₹{status.totalPaid}</p>
        <p>Pending: ₹{status.totalPending}</p>
        {status.overdueFees > 0 && (
          <p className="text-red-600">
            Overdue: ₹{status.overdueFees}
          </p>
        )}
      </div>
    );
  }

  // Render UI...
}
```

### Parent Fee Dashboard

```typescript
import { getStudentFeeStatus } from "@/actions/fees";

export default function ParentFeeDashboard() {
  const { data: children } = useQuery({
    queryKey: ["parent-children", parentId],
    queryFn: () => getParentChildren(parentId),
  });

  // Get fee status for each child
  const childFeeStatuses = useQueries({
    queries:
      children?.map((child) => ({
        queryKey: ["fee-status", child.id],
        queryFn: () => getStudentFeeStatus(child.id),
      })) || [],
  });

  // Calculate total pending across all children
  const totalPending = childFeeStatuses.reduce((sum, query) => {
    if (query.data?.success && query.data.data) {
      return sum + query.data.data.totalPending;
    }
    return sum;
  }, 0);

  // Render UI...
}
```

## Fee Collection Workflow

### 1. Setup Fee Structures

Admin creates fee structures for the academic year:

```typescript
// Tuition fee
await createFeeStructure({
  classroomId: "class-10-a",
  feeType: "tuition",
  amount: 5000,
  frequency: "monthly",
  dueDay: 5,
  academicYear: "2024-2025",
});

// Transport fee
await createFeeStructure({
  grade: "10",
  feeType: "transport",
  amount: 2000,
  frequency: "quarterly",
  academicYear: "2024-2025",
});
```

### 2. Generate Monthly Receipts

At the start of each month, generate fee receipts:

```typescript
const result = await generateFeeReceipts(
  "class-10-a",
  "tuition-fee-id",
  "2024-12-05", // Due date: 5th Dec
);
```

### 3. Record Payments

When student makes payment:

```typescript
await recordPayment({
  studentId: "student-uuid",
  feeStructureId: "tuition-fee-id",
  amount: 5000,
  paymentDate: new Date(),
  dueDate: "2024-12-05",
  status: "paid",
  paymentMethod: "online",
  transactionId: "TXN123",
  receiptNumber: generateReceiptNumber(),
});
```

### 4. Track Overdue Fees

Automatically identify overdue payments:

```typescript
const result = await getFeesByStudent(studentId, {
  status: "pending",
});

const today = new Date();
const overdueFees = result.data?.filter((fee) => new Date(fee.dueDate) < today);
```

## Best Practices

1. **Receipt Numbers**: Generate unique receipt numbers for each payment:

```typescript
const generateReceiptNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const random = Math.floor(Math.random() * 10000);
  return `REC${year}${month}${String(random).padStart(4, "0")}`;
};
```

2. **Partial Payments**: For partial payments:

```typescript
await recordPayment({
  // ... other fields
  amount: 2500, // Partial amount
  status: "partial",
  remarks: "Paid 50% - Balance ₹2500",
});
```

3. **Payment Reminders**: Send reminders before due date:

```typescript
const upcomingDues = await getFeesByStudent(studentId, {
  status: "pending",
});

const threeDaysFromNow = new Date();
threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

const duesSoon = upcomingDues.data?.filter(
  (fee) => new Date(fee.dueDate) <= threeDaysFromNow,
);

if (duesSoon && duesSoon.length > 0) {
  // Send reminder notification
}
```

4. **Fee Concessions**: Handle fee concessions through remarks:

```typescript
await createFeeStructure({
  // ... other fields
  amount: 3500, // Discounted from 5000
  remarks: "30% scholarship applied",
});
```

5. **Multi-Fee Payments**: Pay multiple fees at once:

```typescript
const fees = [tuitionFee, transportFee, labFee];
const totalAmount = fees.reduce((sum, fee) => sum + fee.amount, 0);

// Record single transaction with multiple fee references
for (const fee of fees) {
  await recordPayment({
    studentId,
    feeStructureId: fee.id,
    amount: fee.amount,
    paymentDate: new Date(),
    dueDate: fee.dueDate,
    status: "paid",
    transactionId: commonTransactionId,
    receiptNumber: commonReceiptNumber,
  });
}
```

## Role-Based Access

### Admin

- Create and manage fee structures
- Generate fee receipts for classrooms
- View all payments across school
- Update payment status
- Generate fee reports

### Accountant (Future Role)

- Record payments
- View all payments
- Generate receipts
- Track collections
- Generate financial reports

### Teacher

- View fee status for assigned classes
- Generate class-wise fee reports
- Cannot modify fee structures or payments

### Student

- View own fee status
- View payment history
- Download receipts

### Parent

- View children's fee status
- View payment history
- Make online payments (future enhancement)
- Download receipts

## Database Schema

### Fee Structures Table

```sql
CREATE TABLE fee_structures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID REFERENCES classrooms(id),
  grade VARCHAR(50),
  fee_type VARCHAR(100) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  frequency VARCHAR(20) DEFAULT 'monthly',
  due_day INTEGER DEFAULT 5,
  academic_year VARCHAR(20) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Fee Payments Table

```sql
CREATE TABLE fee_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  fee_structure_id UUID NOT NULL REFERENCES fee_structures(id),
  amount DECIMAL(10, 2) NOT NULL,
  payment_date TIMESTAMP DEFAULT NOW(),
  due_date TIMESTAMP NOT NULL,
  status fee_status DEFAULT 'pending',
  payment_method VARCHAR(50),
  transaction_id VARCHAR(100),
  receipt_number VARCHAR(50),
  remarks TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Reporting & Analytics

### Fee Collection Report

```typescript
const result = await getFeesByClassroom(classroomId, {
  status: "paid",
});

if (result.success && result.data) {
  const totalCollected = result.data.reduce(
    (sum, payment) => sum + parseFloat(payment.amount),
    0,
  );

  console.log(`Total Collected: ₹${totalCollected}`);
}
```

### Defaulter List

```typescript
const allStudents = await getClassroomStudents(classroomId);

const defaulters = [];
for (const student of allStudents) {
  const status = await getStudentFeeStatus(student.id);
  if (status.success && status.data && status.data.overdueFees > 0) {
    defaulters.push({
      name: status.data.studentName,
      rollNumber: status.data.rollNumber,
      overdueAmount: status.data.overdueFees,
    });
  }
}

// Generate defaulter report
```

## Future Enhancements

1. **Online Payment Integration**: UPI, cards, net banking
2. **Automatic Receipt Generation**: PDF receipts via email
3. **Payment Plans**: Installment-based fee payment
4. **Late Fee Calculation**: Automatic late fee addition
5. **Fee Concession Management**: Scholarship and discount tracking
6. **Multi-Currency Support**: For international schools
7. **SMS Notifications**: Payment reminders and confirmations
8. **Fee Forecasting**: Predict collection patterns
9. **Export to Accounting Software**: Tally, QuickBooks integration

## Troubleshooting

### Common Issues

**Issue**: Fee receipts not generated

- **Solution**: Verify fee structure exists and is active for the academic year

**Issue**: Incorrect fee amounts

- **Solution**: Check fee structure amount and ensure no partial payments exist

**Issue**: Overdue fees not showing

- **Solution**: System compares due date with current date. Ensure dates are correct.

## Related Documentation

- [Student Features Guide](./STUDENT_FEATURES_GUIDE.md)
- [Admin Dashboard Guide](./SETUP_COMPLETE.md)
- [Notification System Guide](./NOTIFICATION_SYSTEM.md)

## Support

For issues or questions about the Fee Management System:

1. Check this documentation
2. Review server action code in `/actions/fees.ts`
3. Check database schema in `/database/schema.ts`
4. Contact the development team

---

Last updated: 2024-11-09
