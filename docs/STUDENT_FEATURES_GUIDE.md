# Student Management Features Guide

## Overview

This guide covers the enhanced student management features including the House System, Medical Incidents tracking, and Disciplinary Actions management.

---

## Table of Contents

1. [House System](#house-system)
2. [Medical Incidents](#medical-incidents)
3. [Disciplinary Actions](#disciplinary-actions)
4. [Access Points](#access-points)
5. [API Reference](#api-reference)

---

## House System

### Overview

Students are organized into four houses, each with a unique color identity:

| House          | Color  | Theme                |
| -------------- | ------ | -------------------- |
| **Amritamayi** | Red    | Leadership & Courage |
| **Anandamayi** | Blue   | Wisdom & Knowledge   |
| **Chinmayi**   | Green  | Growth & Harmony     |
| **Jothyrmayi** | Yellow | Energy & Creativity  |

### Features

- **Visual Indicators**: Color-coded badges throughout the UI
- **Theme Integration**: Dynamic color theming based on house assignment
- **Optional Assignment**: Students can be assigned to a house or left unassigned
- **Bulk Operations**: Can be assigned during student creation or updated later

### Usage

#### Assigning a House

1. Navigate to **Admin → Students**
2. Click **Edit** on a student or create a new student
3. Select a house from the dropdown menu
4. Save the changes

#### Viewing House Information

- **Table View**: House column displays color-coded badge
- **Grid View**: House shown on student card
- **Detail Page**: House displayed in Basic Info tab with themed badge

---

## Medical Incidents

### Overview

Track and manage medical incidents for students including injuries, illnesses, allergies, and medical conditions.

### Incident Types

- **Injury**: Physical injuries (cuts, sprains, fractures, etc.)
- **Illness**: Acute or chronic illnesses
- **Allergy**: Allergic reactions
- **Medication**: Medication-related incidents
- **Other**: Any other medical concerns

### Severity Levels

- 🟢 **Minor**: First aid, minor discomfort
- 🟡 **Moderate**: Requires monitoring, non-urgent
- 🟠 **Major**: Significant concern, may need medical attention
- 🔴 **Critical**: Emergency, immediate action required

### Features

- **Complete Record Keeping**: Date, type, description, treatment, and follow-up
- **Parent Notification Tracking**: Record whether parents were notified
- **Follow-up Management**: Mark incidents requiring follow-up with notes
- **Reporter Information**: Automatically captures who reported the incident
- **Audit Trail**: All incidents are logged in the system audit

### Adding a Medical Incident

#### From Student List (Table View)

1. Navigate to **Admin → Students**
2. Click the **Medical** button (HeartPulse icon) in the Actions column
3. Fill in the incident details:
   - **Incident Date**: When the incident occurred
   - **Incident Type**: Select from dropdown
   - **Severity**: Choose appropriate level
   - **Description**: Detailed description of what happened
   - **Treatment Provided**: What was done to address the incident
   - **Follow-up Required**: Check if follow-up is needed
   - **Follow-up Notes**: Additional notes for follow-up
   - **Parent Notified**: Check if parents were informed
4. Click **Add Incident**

#### From Student List (Grid View)

1. Navigate to **Admin → Students** and switch to grid view
2. Click the blue **HeartPulse** button on a student card
3. Follow steps 3-4 from table view

#### From Student Detail Page

1. Navigate to a student's detail page
2. Click the **Medical Incidents** tab
3. Click **Add Medical Incident**
4. Fill in the form and submit

### Viewing Medical Incidents

- **Detail Page**: View complete history in the Medical Incidents tab
- **Severity Badges**: Color-coded indicators for quick assessment
- **Follow-up Alerts**: Yellow alerts for incidents requiring follow-up
- **Reporter Info**: See who reported each incident and when

---

## Disciplinary Actions

### Overview

Track and manage behavioral incidents and disciplinary actions for students.

### Action Types

- **Warning**: Verbal or written warning
- **Detention**: After-school or lunchtime detention
- **Suspension**: In-school or out-of-school suspension
- **Expulsion**: Removal from school
- **Probation**: Behavioral probation period
- **Other**: Other disciplinary measures

### Severity Levels

- 🟢 **Minor**: Minor rule violation
- 🟡 **Moderate**: Repeated violations or moderate offense
- 🟠 **Major**: Serious offense requiring intervention
- 🔴 **Severe**: Critical offense, major consequences

### Features

- **Comprehensive Documentation**: Date, type, description, action taken
- **Witness Recording**: Track witnesses to incidents
- **Resolution Tracking**: Document how the issue was resolved
- **Parent Meeting Management**: Schedule and track parent meetings
- **Reporter Information**: Automatically captures who filed the report
- **Audit Trail**: All actions are logged in the system audit

### Adding a Disciplinary Action

#### From Student List (Table View)

1. Navigate to **Admin → Students**
2. Click the **Disciplinary** button (AlertTriangle icon) in the Actions column
3. Fill in the action details:
   - **Incident Date**: When the incident occurred
   - **Action Type**: Select from dropdown
   - **Severity**: Choose appropriate level
   - **Description**: Detailed description of the behavior
   - **Action Taken**: What disciplinary action was implemented
   - **Witnesses**: Names of witnesses (optional)
   - **Resolution**: How the issue was resolved
   - **Parent Meeting Required**: Check if meeting is needed
   - **Parent Meeting Date**: Schedule the meeting (if required)
4. Click **Add Action**

#### From Student List (Grid View)

1. Navigate to **Admin → Students** and switch to grid view
2. Click the orange **AlertTriangle** button on a student card
3. Follow steps 3-4 from table view

#### From Student Detail Page

1. Navigate to a student's detail page
2. Click the **Disciplinary** tab
3. Click **Add Disciplinary Action**
4. Fill in the form and submit

### Viewing Disciplinary Actions

- **Detail Page**: View complete history in the Disciplinary tab
- **Severity Badges**: Color-coded indicators for quick assessment
- **Meeting Alerts**: Yellow alerts for required parent meetings
- **Reporter Info**: See who filed the report and when

---

## Access Points

### Multiple Entry Points

All medical and disciplinary features are accessible from three different locations:

#### 1. Table View

- **Location**: Admin → Students (table view)
- **Access**: Actions column buttons
- **Use Case**: Quick access when browsing the student list

#### 2. Grid View

- **Location**: Admin → Students (grid view)
- **Access**: Buttons on each student card
- **Use Case**: Visual browsing with quick actions

#### 3. Detail Page

- **Location**: Admin → Students → [Student ID]
- **Access**: Dedicated tabs with full history
- **Use Case**: Comprehensive view and management of all records

### User Roles & Permissions

- **Admin**: Full access to create, view, edit, and delete all records
- **Teacher**: Can view and create incidents, limited editing
- **Student/Parent**: View-only access to own records (if enabled)

---

## API Reference

### Medical Incidents API

#### Create Medical Incident

```typescript
POST /api/students/medical-incidents

Headers:
  Authorization: Bearer <token>

Body:
{
  studentId: string,
  incidentDate: string,        // ISO date format
  incidentType: string,         // "Injury" | "Illness" | "Allergy" | "Medication" | "Other"
  severity: string,             // "minor" | "moderate" | "major" | "critical"
  description: string,
  treatment: string,
  followUpRequired: boolean,
  followUpNotes?: string,       // optional
  parentNotified: boolean
}

Response: 201 Created
{
  success: true,
  incident: { /* incident object */ }
}
```

#### Get Medical Incidents

```typescript
GET /api/students/medical-incidents?studentId=<id>

Headers:
  Authorization: Bearer <token>

Response: 200 OK
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

### Disciplinary Actions API

#### Create Disciplinary Action

```typescript
POST /api/students/disciplinary-actions

Headers:
  Authorization: Bearer <token>

Body:
{
  studentId: string,
  incidentDate: string,         // ISO date format
  actionType: string,            // "Warning" | "Detention" | "Suspension" | "Expulsion" | "Probation" | "Other"
  severity: string,              // "Minor" | "Moderate" | "Major" | "Severe"
  description: string,
  actionTaken: string,
  witnesses?: string,            // optional
  resolution?: string,           // optional
  parentMeetingRequired: boolean,
  parentMeetingDate?: string     // optional, ISO date format
}

Response: 201 Created
{
  success: true,
  action: { /* action object */ }
}
```

#### Get Disciplinary Actions

```typescript
GET /api/students/disciplinary-actions?studentId=<id>

Headers:
  Authorization: Bearer <token>

Response: 200 OK
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

### Student House API

#### Update Student House

```typescript
PUT /api/students/[id]

Headers:
  Authorization: Bearer <token>

Body:
{
  house?: string  // "Amritamayi" | "Anandamayi" | "Chinmayi" | "Jothyrmayi" | null
  // ... other student fields
}

Response: 200 OK
{
  success: true,
  student: { /* updated student object */ }
}
```

---

## Best Practices

### Medical Incidents

1. **Be Specific**: Provide detailed descriptions for accurate record-keeping
2. **Timely Reporting**: Report incidents as soon as possible
3. **Parent Communication**: Always notify parents of significant incidents
4. **Follow-up**: Schedule and document follow-up care when needed
5. **Privacy**: Maintain confidentiality of medical information

### Disciplinary Actions

1. **Document Everything**: Record all relevant details and context
2. **Fair Process**: Ensure consistent application of rules
3. **Parent Involvement**: Communicate with parents promptly
4. **Witnesses**: Document witness statements when available
5. **Resolution**: Always document how issues were resolved

### House System

1. **Balance**: Try to maintain balanced numbers across houses
2. **Community**: Use houses to build school community and spirit
3. **Activities**: Organize house-based activities and competitions
4. **Recognition**: Celebrate house achievements

---

## Troubleshooting

### Common Issues

**Issue**: Cannot add medical incident

- **Solution**: Ensure you have admin or teacher role
- **Check**: Verify student ID is valid
- **Verify**: All required fields are filled

**Issue**: House colors not displaying

- **Solution**: Clear browser cache and reload
- **Check**: Ensure house is assigned to student
- **Verify**: Theme is properly configured

**Issue**: Disciplinary actions not saving

- **Solution**: Check all required fields are completed
- **Check**: Verify date format is correct
- **Verify**: Ensure you have proper permissions

**Issue**: Cannot view incidents

- **Solution**: Check your user role and permissions
- **Check**: Verify student ID in URL is correct
- **Verify**: Ensure data exists in the system

---

## Support

For additional help or to report issues:

- **Technical Issues**: Contact system administrator
- **Feature Requests**: Submit via the feedback form
- **Training**: Request a training session for your team

---

**Last Updated**: November 7, 2025
**Version**: 1.0.0
