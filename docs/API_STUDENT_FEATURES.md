# Student Features API Documentation

## Overview
This document provides detailed API documentation for the House System, Medical Incidents, and Disciplinary Actions features.

---

## Authentication

All endpoints require authentication using Better Auth. Include the authentication token in requests:

```typescript
Headers:
  Authorization: Bearer <token>
  Cookie: better-auth.session_token=<session-token>
```

---

## Medical Incidents API

### Endpoints

#### POST /api/students/medical-incidents
Create a new medical incident record.

**Authorization**: Admin, Teacher

**Request Body**:
```typescript
{
  studentId: string;           // Required: Student ID
  incidentDate: string;        // Required: ISO 8601 date string
  incidentType: string;        // Required: "Injury" | "Illness" | "Allergy" | "Medication" | "Other"
  severity: string;            // Required: "minor" | "moderate" | "major" | "critical"
  description: string;         // Required: Detailed description
  treatment: string;           // Required: Treatment provided
  followUpRequired: boolean;   // Required: true/false
  followUpNotes?: string;      // Optional: Follow-up notes
  parentNotified: boolean;     // Required: true/false
}
```

**Success Response** (201 Created):
```typescript
{
  success: true,
  incident: {
    id: string,
    studentId: string,
    incidentDate: string,
    incidentType: string,
    severity: string,
    description: string,
    treatment: string,
    followUpRequired: boolean,
    followUpNotes: string | null,
    parentNotified: boolean,
    reportedBy: string,
    createdAt: string,
    updatedAt: string
  }
}
```

**Error Responses**:
- `400 Bad Request`: Missing or invalid fields
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Insufficient permissions
- `500 Internal Server Error`: Server error

**Example Request**:
```typescript
const response = await fetch('/api/students/medical-incidents', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    studentId: '123',
    incidentDate: '2025-11-07T10:30:00Z',
    incidentType: 'Injury',
    severity: 'moderate',
    description: 'Student fell during PE class and sprained ankle',
    treatment: 'Applied ice pack, elevated foot, provided crutches',
    followUpRequired: true,
    followUpNotes: 'Check ankle mobility in 3 days',
    parentNotified: true
  })
});
```

---

#### GET /api/students/medical-incidents
Retrieve medical incidents for a student.

**Authorization**: Admin, Teacher

**Query Parameters**:
- `studentId` (required): The student's ID

**Success Response** (200 OK):
```typescript
{
  incidents: [
    {
      id: string,
      studentId: string,
      incidentDate: string,
      incidentType: string,
      severity: string,
      description: string,
      treatment: string,
      followUpRequired: boolean,
      followUpNotes: string | null,
      parentNotified: boolean,
      reportedBy: string,
      reporter: {
        id: string,
        name: string,
        email: string
      },
      createdAt: string,
      updatedAt: string
    }
  ]
}
```

**Error Responses**:
- `400 Bad Request`: Missing studentId parameter
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Insufficient permissions
- `500 Internal Server Error`: Server error

**Example Request**:
```typescript
const response = await fetch('/api/students/medical-incidents?studentId=123');
const data = await response.json();
console.log(data.incidents);
```

---

## Disciplinary Actions API

### Endpoints

#### POST /api/students/disciplinary-actions
Create a new disciplinary action record.

**Authorization**: Admin, Teacher

**Request Body**:
```typescript
{
  studentId: string;              // Required: Student ID
  incidentDate: string;           // Required: ISO 8601 date string
  actionType: string;             // Required: "Warning" | "Detention" | "Suspension" | "Expulsion" | "Probation" | "Other"
  severity: string;               // Required: "Minor" | "Moderate" | "Major" | "Severe"
  description: string;            // Required: Incident description
  actionTaken: string;            // Required: Action taken
  witnesses?: string;             // Optional: Witness names
  resolution?: string;            // Optional: How resolved
  parentMeetingRequired: boolean; // Required: true/false
  parentMeetingDate?: string;     // Optional: ISO 8601 date string
}
```

**Success Response** (201 Created):
```typescript
{
  success: true,
  action: {
    id: string,
    studentId: string,
    incidentDate: string,
    incidentType: string,
    severity: string,
    description: string,
    actionTaken: string,
    witnesses: string | null,
    resolution: string | null,
    parentMeetingRequired: boolean,
    parentMeetingDate: string | null,
    reportedBy: string,
    createdAt: string,
    updatedAt: string
  }
}
```

**Error Responses**:
- `400 Bad Request`: Missing or invalid fields
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Insufficient permissions
- `500 Internal Server Error`: Server error

**Example Request**:
```typescript
const response = await fetch('/api/students/disciplinary-actions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    studentId: '123',
    incidentDate: '2025-11-07T14:00:00Z',
    actionType: 'Warning',
    severity: 'Minor',
    description: 'Student was talking during class repeatedly',
    actionTaken: 'Verbal warning and seat change',
    witnesses: 'Mr. Smith, Ms. Johnson',
    resolution: 'Student apologized and agreed to follow classroom rules',
    parentMeetingRequired: false
  })
});
```

---

#### GET /api/students/disciplinary-actions
Retrieve disciplinary actions for a student.

**Authorization**: Admin, Teacher

**Query Parameters**:
- `studentId` (required): The student's ID

**Success Response** (200 OK):
```typescript
{
  actions: [
    {
      id: string,
      studentId: string,
      incidentDate: string,
      incidentType: string,
      severity: string,
      description: string,
      actionTaken: string,
      witnesses: string | null,
      resolution: string | null,
      parentMeetingRequired: boolean,
      parentMeetingDate: string | null,
      reportedBy: string,
      reporter: {
        id: string,
        name: string,
        email: string
      },
      createdAt: string,
      updatedAt: string
    }
  ]
}
```

**Error Responses**:
- `400 Bad Request`: Missing studentId parameter
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Insufficient permissions
- `500 Internal Server Error`: Server error

**Example Request**:
```typescript
const response = await fetch('/api/students/disciplinary-actions?studentId=123');
const data = await response.json();
console.log(data.actions);
```

---

## Student House API

### Update Student House

#### PUT /api/students/[id]
Update a student's information including house assignment.

**Authorization**: Admin

**Request Body**:
```typescript
{
  house?: string;  // Optional: "Amritamayi" | "Anandamayi" | "Chinmayi" | "Jothyrmayi" | null
  // ... other student fields (name, email, etc.)
}
```

**Success Response** (200 OK):
```typescript
{
  success: true,
  student: {
    id: string,
    name: string,
    email: string,
    house: string | null,
    // ... other student fields
  }
}
```

**Example Request**:
```typescript
const response = await fetch('/api/students/123', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    house: 'Amritamayi'
  })
});
```

---

## Data Models

### Medical Incident
```typescript
interface MedicalIncident {
  id: string;
  studentId: string;
  incidentDate: string;          // ISO 8601 date
  incidentType: 'Injury' | 'Illness' | 'Allergy' | 'Medication' | 'Other';
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  description: string;
  treatment: string;
  followUpRequired: boolean;
  followUpNotes: string | null;
  parentNotified: boolean;
  reportedBy: string;            // User ID
  createdAt: string;             // ISO 8601 timestamp
  updatedAt: string;             // ISO 8601 timestamp
}
```

### Disciplinary Action
```typescript
interface DisciplinaryAction {
  id: string;
  studentId: string;
  incidentDate: string;          // ISO 8601 date
  incidentType: 'Warning' | 'Detention' | 'Suspension' | 'Expulsion' | 'Probation' | 'Other';
  severity: 'Minor' | 'Moderate' | 'Major' | 'Severe';
  description: string;
  actionTaken: string;
  witnesses: string | null;
  resolution: string | null;
  parentMeetingRequired: boolean;
  parentMeetingDate: string | null;  // ISO 8601 date
  reportedBy: string;                // User ID
  createdAt: string;                 // ISO 8601 timestamp
  updatedAt: string;                 // ISO 8601 timestamp
}
```

### House
```typescript
type House = 'Amritamayi' | 'Anandamayi' | 'Chinmayi' | 'Jothyrmayi';
```

---

## Rate Limiting

Currently, no rate limiting is implemented. However, please be mindful of:
- Avoid excessive concurrent requests
- Implement client-side debouncing for user inputs
- Cache responses when appropriate

---

## Audit Logging

All create operations are automatically logged in the audit system:

### Medical Incidents
- **Resource**: `medical_incident`
- **Actions**: `create`
- **Details**: Student ID, incident type, severity

### Disciplinary Actions
- **Resource**: `disciplinary_action`
- **Actions**: `create`
- **Details**: Student ID, action type, severity

---

## Error Handling

All API endpoints follow a consistent error response format:

```typescript
{
  error: string;           // Error message
  details?: any;          // Additional error details (optional)
}
```

### Common Error Codes
- `400`: Bad Request - Invalid input data
- `401`: Unauthorized - Not authenticated
- `403`: Forbidden - Insufficient permissions
- `404`: Not Found - Resource doesn't exist
- `500`: Internal Server Error - Server-side error

---

## Client-Side Usage Examples

### Using React Query (Recommended)

#### Create Medical Incident
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

const useCreateMedicalIncident = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: MedicalIncidentInput) => {
      const response = await fetch('/api/students/medical-incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create incident');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-incidents'] });
    },
  });
};
```

#### Fetch Medical Incidents
```typescript
import { useQuery } from '@tanstack/react-query';

const useMedicalIncidents = (studentId: string) => {
  return useQuery({
    queryKey: ['medical-incidents', studentId],
    queryFn: async () => {
      const response = await fetch(
        `/api/students/medical-incidents?studentId=${studentId}`
      );
      if (!response.ok) throw new Error('Failed to fetch incidents');
      return response.json();
    },
  });
};
```

### Using Fetch API

#### Create Disciplinary Action
```typescript
async function createDisciplinaryAction(data: DisciplinaryActionInput) {
  try {
    const response = await fetch('/api/students/disciplinary-actions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create action');
    }

    const result = await response.json();
    return result.action;
  } catch (error) {
    console.error('Error creating disciplinary action:', error);
    throw error;
  }
}
```

---

## Testing

### Example Test Cases

#### Medical Incident Creation
```typescript
describe('POST /api/students/medical-incidents', () => {
  it('should create a medical incident', async () => {
    const incident = {
      studentId: '123',
      incidentDate: '2025-11-07T10:00:00Z',
      incidentType: 'Injury',
      severity: 'minor',
      description: 'Test incident',
      treatment: 'Test treatment',
      followUpRequired: false,
      parentNotified: true,
    };

    const response = await fetch('/api/students/medical-incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(incident),
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.incident.studentId).toBe('123');
  });
});
```

---

## Changelog

### Version 1.0.0 (November 7, 2025)
- Initial release
- Medical Incidents API
- Disciplinary Actions API
- House System integration
- Audit logging support

---

**Last Updated**: November 7, 2025
**API Version**: 1.0.0
