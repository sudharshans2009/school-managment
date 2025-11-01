# Calendar Management System - Implementation Summary

## Overview

Comprehensive calendar management system that allows admins to control working days, holidays, half-days, and custom timetables. This system replaces hardcoded schedules with flexible, date-specific configurations.

## Database Schema

### New Table: `calendar_days`

```typescript
{
  id: uuid (primary key)
  date: string (YYYY-MM-DD, unique)
  dayType: 'working' | 'holiday'
  dayDuration: 'full' | 'half'
  holidayFor: 'all' | 'students' | 'teachers' | 'office' | null
  holidayName: string | null
  customTimetable: number | null (1-6 for Mon-Sat timetable)
  notes: text | null
  createdBy: uuid (references users)
  createdAt: timestamp
  updatedAt: timestamp
}
```

### New Enums

- `dayTypeEnum`: 'working', 'holiday'
- `dayDurationEnum`: 'full', 'half'
- `holidayForEnum`: 'all', 'students', 'teachers', 'office'

## Default Behavior

**Without custom configuration:**

- Monday - Saturday: Full working day for all (students, teachers, office staff)
- Sunday: Holiday for all

**Custom configurations override defaults**

## API Endpoints

### `/api/calendar` (GET, POST, DELETE)

- **GET**: Fetch calendar days
  - Query params: `startDate`, `endDate`, `date`
  - Returns: Array of calendar days or single day
- **POST**: Create/update calendar day configuration
  - Requires: admin role
  - Body: `{ date, dayType, dayDuration, holidayFor?, holidayName?, customTimetable?, notes? }`
- **DELETE**: Reset day to default (remove custom config)
  - Query param: `date`

### `/api/calendar/check` (GET)

- Check if a specific date is a working day
- Query params: `date`, `userType` (optional)
- Returns: Full day configuration + working status for user type

## Calendar Page Features

### Admin Calendar Page (`/admin/calendar`)

1. **Monthly Calendar View**
   - Visual grid showing all days of the month
   - Color-coded badges for different day types
   - Today highlighted with primary border
   - Custom configurations marked with edit icon

2. **Day Configuration Dialog**
   - Day Type: Working or Holiday
   - Day Duration: Full or Half (for working days)
   - Holiday For: All, Students, Teachers, or Office (for holidays)
   - Holiday Name: Custom name for the holiday
   - Custom Timetable: Choose which day's timetable to follow
   - Notes: Additional remarks

3. **Visual Indicators**
   - 🌞 Holiday (all)
   - 👥 Holiday (students)
   - 💼 Holiday (teachers)
   - 🏢 Holiday (office)
   - ⏰ Half Day
   - Working Day badge
   - Custom timetable badge (e.g., "Mon TT")

4. **Navigation**
   - Previous/Next month buttons
   - Today button to jump to current month

## Helper Functions (`lib/calendar-utils.ts`)

### `getDayConfiguration(date: Date)`

Returns complete configuration for a date:

```typescript
{
  date: string;
  isWorkingDay: boolean;
  isHoliday: boolean;
  isHalfDay: boolean;
  holidayFor: string | null;
  holidayName: string | null;
  timetableDayOfWeek: number; // Which day's timetable to use
  actualDayOfWeek: number; // Actual day of week
  notes: string | null;
}
```

### `isWorkingDayFor(date: Date, userType: string)`

Checks if specific user type (students/teachers/office) should work on a date

### `getTimetableDay(date: Date)`

Returns the day of week (0-6) whose timetable should be followed

## Integration Points

### 1. Smartboard Display

- Uses `getTimetableDay()` to fetch correct timetable
- Automatically shows custom timetable if configured
- Example: Saturday can show Monday's timetable

### 2. Attendance System

- Calendar settings determine which days need attendance
- Holiday configurations prevent unnecessary attendance marking
- Half-days automatically adjust expectations

### 3. Teacher Portal

- Respects calendar settings for class schedules
- Shows appropriate timetable based on configuration

### 4. Student Portal

- Displays correct timetable regardless of actual day
- Shows holiday information

## Use Cases

### 1. Special Timetable Days

**Scenario:** Saturday follows Monday's timetable

```
Admin sets:
- Date: 2025-11-02 (Saturday)
- Day Type: Working
- Day Duration: Full
- Custom Timetable: Monday (1)
```

Result: Saturday will display Monday's complete schedule

### 2. Half Day

**Scenario:** Last working day before holidays

```
Admin sets:
- Date: 2025-12-20
- Day Type: Working
- Day Duration: Half
```

Result: Shortened school day

### 3. Teacher Training Day

**Scenario:** Students have holiday, teachers work

```
Admin sets:
- Date: 2025-11-15
- Day Type: Holiday
- Holiday For: Students
- Holiday Name: "Teacher Training Day"
```

Result: Students don't come, teachers attend

### 4. Office Closure

**Scenario:** School working, office closed

```
Admin sets:
- Date: 2025-11-25
- Day Type: Holiday
- Holiday For: Office
- Holiday Name: "Administrative Review Day"
```

Result: Classes run, office staff off

### 5. Saturday as Monday

**Scenario:** Make up for a missed Monday

```
Admin sets:
- Date: 2025-11-30 (Saturday)
- Day Type: Working
- Day Duration: Full
- Custom Timetable: Monday (1)
- Notes: "Makeup for 2025-11-04 holiday"
```

## Admin Dashboard Integration

- New quick action: "Calendar & Holidays"
- Icon: Calendar
- Description: "Manage working days and timetables"
- Link: `/admin/calendar`

## Migration Required

Run migration to create the new `calendar_days` table:

```bash
bun run db:generate  # Generate migration
bun run db:push      # Apply to database
```

## Benefits

1. **Flexibility**: No more hardcoded schedules
2. **User-Specific**: Different rules for students/teachers/office
3. **Timetable Reuse**: Any day can follow any other day's schedule
4. **Transparent**: All stakeholders see the same calendar
5. **Audit Trail**: Track who made changes and when
6. **Future-Proof**: Easy to add new day types or configurations

## Testing Checklist

- [ ] Create a holiday for all
- [ ] Create a holiday for students only
- [ ] Set a half-day
- [ ] Configure Saturday with Monday's timetable
- [ ] Verify smartboard shows correct timetable
- [ ] Check attendance page respects calendar
- [ ] Test month navigation
- [ ] Verify edit/delete functionality
- [ ] Confirm default behavior (Mon-Sat working, Sun holiday)

## Next Steps

1. Push database migration
2. Test calendar page functionality
3. Verify smartboard integration
4. Train admin users on calendar management
5. Consider adding bulk operations (e.g., mark entire week as holiday)
6. Add calendar export/import functionality
7. Integrate with notification system for upcoming holidays
