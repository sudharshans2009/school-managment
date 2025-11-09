# Security & Compliance Features

This document describes the security and compliance features implemented in the School Management System.

## Table of Contents

- [Role-Based Permissions](#role-based-permissions)
- [Audit Logging](#audit-logging)
- [Data Encryption](#data-encryption)
- [GDPR Compliance](#gdpr-compliance)
- [Backup and Restore](#backup-and-restore)

---

## Role-Based Permissions

### Overview

The system implements a comprehensive role-based permission system with four primary roles:

- **Admin**: Full system access
- **Teacher**: Classroom and student management
- **Student**: View own data and submit work
- **Parent**: View children's data
- **Smartboard**: Display classroom information

### Permission Categories

#### Student Permissions

- `view_own_data` - View their own profile and data
- `submit_homework` - Submit homework assignments
- `view_own_attendance` - View their attendance records
- `view_own_grades` - View their grades and report cards
- `register_for_events` - Register for school events
- `view_announcements` - View school announcements

#### Teacher Permissions

- `manage_homework` - Create, update, and grade homework
- `mark_attendance` - Mark student attendance
- `view_student_data` - View student information
- `grade_assignments` - Grade student submissions
- `create_announcements` - Create classroom announcements
- `manage_classroom` - Manage classroom settings
- `view_reports` - View student reports

#### Admin Permissions

- `manage_users` - Create, update, delete users
- `manage_classrooms` - Manage classroom settings
- `manage_subjects` - Manage subjects
- `manage_fees` - Manage fee structures and payments
- `view_all_data` - Access all system data
- `manage_admissions` - Handle admission applications
- `manage_system_settings` - Configure system settings
- `view_audit_logs` - View audit logs
- `export_data` - Export system data
- `manage_backups` - Create and manage backups

#### Smartboard Permissions

- `view_classroom_dashboard` - View classroom dashboard
- `view_timetable` - View class timetable
- `view_classroom_announcements` - View announcements

### Implementation

The permission system is implemented in `/lib/permissions.ts` and provides:

- `hasPermission(role, permission)` - Check if a role has a permission
- `canAccessResource(role, resource, action)` - Check resource-level access
- `DEFAULT_ROLE_PERMISSIONS` - Default permissions for each role

Authorization middleware in `/lib/auth/middleware.ts` provides:

- `requireAuth(request)` - Require authentication
- `requireRole(request, roles)` - Require specific role
- `requirePermission(request, permission)` - Require specific permission
- `requireResourceAccess(request, resource, action)` - Require resource access

### Usage Example

```typescript
import { requireAdmin, requirePermission } from "@/lib/auth/middleware";

export async function POST(request: NextRequest) {
  // Require admin role
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  const { user } = authResult;

  // Or require specific permission
  const authResult = await requirePermission(request, "manage_homework");
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  // Continue with authorized logic...
}
```

---

## Audit Logging

### Overview

All significant actions in the system are logged for security and compliance purposes.

### Logged Actions

- User login/logout
- Create, read, update, delete operations on resources
- Permission changes
- Export data requests
- Backup operations
- Access denials

### Audit Log Fields

- `userId` - ID of the user who performed the action
- `userEmail` - Email of the user (preserved even if user deleted)
- `userRole` - Role of the user at the time of action
- `action` - Action performed (create, update, delete, view, etc.)
- `resource` - Type of resource affected
- `resourceId` - ID of the specific resource
- `description` - Human-readable description
- `metadata` - JSON with additional context
- `ipAddress` - IP address of the request
- `userAgent` - User agent of the request
- `timestamp` - When the action occurred

### API Endpoints

#### View Audit Logs (Admin Only)

```
GET /api/security/audit-logs?userId=<id>&action=<action>&resource=<resource>&startDate=<date>&endDate=<date>&search=<query>
```

Query Parameters:

- `userId` - Filter by user ID
- `action` - Filter by action type
- `resource` - Filter by resource type
- `startDate` - Filter by start date (ISO format)
- `endDate` - Filter by end date (ISO format)
- `search` - Search in description and email
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 50, max: 100)

### Usage Example

```typescript
import { auditResourceAccess } from "@/lib/audit";

// Log resource access
await auditResourceAccess(
  user.id,
  user.email,
  user.role,
  "create",
  "homework",
  homeworkId,
  "Created homework assignment",
  { title: "Math Assignment", dueDate: "2024-06-15" },
  request,
);
```

---

## Data Encryption

### Overview

Sensitive data is encrypted to protect user privacy and comply with security standards.

### Encrypted Data

- **Passwords**: Hashed using bcrypt (already implemented in Better Auth)
- **Personal Identifiable Information (PII)**: Should be encrypted at rest
- **Session tokens**: Securely managed by Better Auth
- **API keys**: Stored encrypted in environment variables

### Implementation Notes

- Passwords are automatically hashed by Better Auth before storage
- Database connections use SSL/TLS encryption
- Environment variables should never be committed to source control
- Sensitive fields in database can be encrypted using field-level encryption

### Best Practices

1. Never store plain text passwords
2. Use environment variables for secrets
3. Enable SSL/TLS for database connections
4. Implement field-level encryption for highly sensitive data
5. Rotate encryption keys regularly
6. Use strong encryption algorithms (AES-256)

---

## GDPR Compliance

### Overview

The system implements GDPR (General Data Protection Regulation) compliance features to protect user privacy and data rights.

### Features Implemented

#### 1. Right to Data Portability

Users can request a complete export of their personal data.

**API Endpoint:**

```
POST /api/security/gdpr/export
{
  "requestType": "full_export",
  "dataCategories": ["profile", "academic", "attendance"]
}

GET /api/security/gdpr/export
```

**Exported Data Includes:**

- User profile information
- Student academic records (if applicable)
- Attendance records
- Homework submissions
- Fee payment history
- Communication history
- Event registrations
- Report cards

#### 2. Right to be Forgotten

Users can request deletion of their personal data.

**API Endpoints:**

```
POST /api/security/gdpr/deletion
{
  "requestReason": "No longer need the account",
  "anonymizeData": true
}

GET /api/security/gdpr/deletion

PUT /api/security/gdpr/deletion (Admin only)
{
  "requestId": "uuid",
  "status": "approved",
  "reviewNotes": "Request approved"
}
```

**Deletion Workflow:**

1. User submits deletion request
2. Request status: `pending`
3. Admin reviews and approves/rejects
4. Status changes to `approved` or `rejected`
5. System anonymizes or deletes data
6. Status changes to `completed`

#### 3. Consent Management

Track user consent for various types of data processing.

**API Endpoints:**

```
POST /api/security/gdpr/consent
{
  "consentType": "data_processing",
  "isGranted": true,
  "version": "1.0.0"
}

GET /api/security/gdpr/consent

PUT /api/security/gdpr/consent
{
  "consentType": "marketing",
  "isGranted": false
}
```

**Consent Types:**

- `data_processing` - Essential data processing
- `marketing` - Marketing communications
- `analytics` - Analytics and tracking
- `third_party_sharing` - Sharing with third parties
- `terms_of_service` - Terms of service acceptance
- `privacy_policy` - Privacy policy acceptance

### GDPR Compliance Checklist

- [x] Right to data portability (export)
- [x] Right to be forgotten (deletion)
- [x] Consent management
- [x] Audit logging
- [x] Data minimization (only collect necessary data)
- [x] Purpose limitation (data used only for stated purposes)
- [x] Storage limitation (data retention policies via backup expiry)
- [ ] Data breach notification (should be implemented by operations)
- [ ] Privacy by design (ongoing architectural consideration)

---

## Backup and Restore

### Overview

Regular backups ensure data can be recovered in case of system failure or data loss.

### Backup Types

- **Manual**: Initiated by administrator
- **Scheduled**: Automated backups (to be configured via cron/scheduler)
- **Full**: Complete database backup
- **Incremental**: Only changed data (future enhancement)

### API Endpoints

#### Create Backup (Admin Only)

```
POST /api/security/backup
{
  "backupType": "manual"
}
```

#### List Backups (Admin Only)

```
GET /api/security/backup
```

### Backup Details

- **Format**: JSON
- **Retention**: 90 days
- **Location**: Configured storage location
- **Encryption**: Should be encrypted at rest
- **Integrity**: Checksum verification (future enhancement)

### Backup Contents

- Users and authentication data
- Students and academic records
- Classrooms and subjects
- Homework and submissions
- Attendance records
- Fee structures and payments
- All other system data

### Restore Procedure

1. Administrator accesses backup system
2. Selects backup to restore
3. Downloads backup file
4. Uses database tools to restore data
5. Verifies data integrity
6. System back online

**Note:** Restore procedure should be documented and tested regularly.

### Best Practices

1. Test backups regularly
2. Store backups in multiple locations
3. Encrypt backups at rest
4. Monitor backup success/failure
5. Document restore procedures
6. Implement automated backup schedule
7. Keep backup retention policy (e.g., 90 days)

---

## Security Best Practices

### For Administrators

1. Regularly review audit logs for suspicious activity
2. Implement strong password policies
3. Enable two-factor authentication (future enhancement)
4. Keep backup schedule consistent
5. Review and approve GDPR requests promptly
6. Monitor system access patterns
7. Regularly update system and dependencies

### For Developers

1. Use authorization middleware for all protected routes
2. Log all sensitive operations
3. Never commit secrets to source control
4. Validate and sanitize all user input
5. Implement rate limiting (future enhancement)
6. Keep dependencies up to date
7. Follow secure coding practices

### For Users

1. Use strong, unique passwords
2. Don't share credentials
3. Report suspicious activity
4. Review consent settings regularly
5. Request data export to verify stored information
6. Log out when finished

---

## Access Control Summary

| Feature           | Student | Teacher | Parent   | Admin  | Smartboard |
| ----------------- | ------- | ------- | -------- | ------ | ---------- |
| View Own Data     | ✓       | ✓       | ✓        | ✓      | -          |
| Manage Homework   | -       | ✓       | -        | ✓      | -          |
| Mark Attendance   | -       | ✓       | -        | ✓      | -          |
| View Student Data | Own     | Class   | Children | All    | -          |
| Manage Users      | -       | -       | -        | ✓      | -          |
| View Audit Logs   | -       | -       | -        | ✓      | -          |
| Export Data       | Own     | -       | Children | All    | -          |
| Manage Backups    | -       | -       | -        | ✓      | -          |
| View Dashboard    | -       | -       | -        | ✓      | ✓          |
| GDPR Requests     | ✓       | ✓       | ✓        | Manage | -          |

---

## Future Enhancements

### Planned Security Features

- [ ] Two-factor authentication (2FA)
- [ ] Single Sign-On (SSO) integration
- [ ] Rate limiting and DDoS protection
- [ ] IP whitelisting for admin access
- [ ] Security headers (CSP, HSTS, etc.)
- [ ] Automated security scanning
- [ ] Penetration testing
- [ ] Field-level encryption for PII
- [ ] Automated backup scheduling
- [ ] Backup encryption
- [ ] Data anonymization utilities
- [ ] Enhanced password policies
- [ ] Session management improvements
- [ ] API key management
- [ ] Webhook security

### Compliance

- [ ] SOC 2 compliance
- [ ] ISO 27001 certification
- [ ] FERPA compliance (for US schools)
- [ ] COPPA compliance (for children's data)

---

## Support

For security concerns or questions:

1. Review this documentation
2. Check audit logs for unusual activity
3. Contact system administrator
4. Report security vulnerabilities responsibly

**Last Updated:** November 2024
**Version:** 1.0.0
