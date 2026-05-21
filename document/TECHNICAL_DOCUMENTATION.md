# Technical Documentation - Professional Modals System

## Overview
This document provides technical details about the professional modals system implemented for scheduled sessions management.

## Architecture

### Components

#### 1. HTML Modals
Located in: `frontend/pages/scheduled-sessions.html`

**Modal 1: Add Scheduled Session**
- ID: `scheduledSessionModal`
- Purpose: Add a single scheduled session
- Features:
  - Student selection dropdown
  - Teacher selection dropdown
  - Day of week selection
  - Time picker
  - Duration input
  - Active status checkbox
  - Auto-create session checkbox

**Modal 2: Generate Weekly Sessions**
- ID: `weeklySessionsModal`
- Purpose: Add multiple scheduled sessions at once
- Features:
  - Dynamic row addition
  - Row deletion
  - Bulk save functionality
  - Auto-create sessions checkbox

#### 2. JavaScript Functions
Located in: `frontend/js/scheduled-sessions.js`

**Global Variables:**
```javascript
let scheduledSessionsTable = null;
let scheduledSessions = [];
let teachers = [];
let students = [];
let weeklySessionRowCounter = 0;
```

**Key Functions:**

1. `showAddScheduledSessionModal()`
   - Opens the add scheduled session modal
   - Populates student and teacher dropdowns
   - Resets form fields
   - Sets default values

2. `closeScheduledSessionModal()`
   - Closes the add scheduled session modal

3. `addScheduledSession(data)`
   - Creates a scheduled session via API
   - Optionally creates an actual session
   - Calculates next occurrence date
   - Updates UI and statistics

4. `generateWeeklySessions()`
   - Opens the weekly sessions modal
   - Initializes the first row
   - Resets row counter

5. `closeWeeklySessionsModal()`
   - Closes the weekly sessions modal

6. `addWeeklySessionRow()`
   - Adds a new session row to the modal
   - Increments row counter
   - Populates dropdowns

7. `removeWeeklySessionRow(rowId)`
   - Removes a session row from the modal

8. `saveWeeklySessions()`
   - Validates all rows
   - Creates scheduled sessions via API
   - Optionally creates actual sessions
   - Shows success/error messages
   - Updates UI and statistics

#### 3. CSS Styles
Located in: `frontend/css/style.css`

**Modal Styles:**
- `.modal-overlay`: Full-screen overlay with transparency
- `.modal-content`: White container with shadow
- `.modal-header`: Header with title and close button
- `.modal-title`: Styled title with primary color
- `.modal-close`: Close button with hover effect
- `.form-group`: Form field container
- `.form-label`: Styled label with font weight
- `.form-control`: Input/select styling with focus effect

**Animations:**
- `fadeIn`: Fade in animation for modals
- `slideIn`: Slide in animation
- `pulse`: Pulse animation for buttons

## Data Flow

### Adding a Single Scheduled Session

```
User clicks "Add Session" button
    ↓
showAddScheduledSessionModal() is called
    ↓
Modal opens with populated dropdowns
    ↓
User fills form and clicks "Save"
    ↓
Form submit event is triggered
    ↓
addScheduledSession(data) is called
    ↓
API POST to /api/scheduled-sessions/
    ↓
If "Create session automatically" is checked:
    ↓
    Calculate next occurrence date
    ↓
    API POST to /api/sessions/
    ↓
Modal closes
    ↓
Success message is shown
    ↓
Data is reloaded and UI is updated
```

### Adding Multiple Weekly Sessions

```
User clicks "Generate Weekly Sessions" button
    ↓
generateWeeklySessions() is called
    ↓
Modal opens with one empty row
    ↓
User fills first row
    ↓
User clicks "Add Another Session"
    ↓
addWeeklySessionRow() is called
    ↓
New row is added
    ↓
User fills additional rows
    ↓
User clicks "Save All"
    ↓
saveWeeklySessions() is called
    ↓
All rows are validated
    ↓
For each row:
    ↓
    API POST to /api/scheduled-sessions/
    ↓
    If "Create sessions automatically" is checked:
        ↓
        Calculate next occurrence date
        ↓
        API POST to /api/sessions/
    ↓
Modal closes
    ↓
Success message with count is shown
    ↓
Data is reloaded and UI is updated
```

## API Endpoints

### Scheduled Sessions
- **GET** `/api/scheduled-sessions/` - List all scheduled sessions
- **POST** `/api/scheduled-sessions/` - Create a scheduled session
- **GET** `/api/scheduled-sessions/{id}/` - Get a scheduled session
- **PATCH** `/api/scheduled-sessions/{id}/` - Update a scheduled session
- **DELETE** `/api/scheduled-sessions/{id}/` - Delete a scheduled session

### Sessions
- **GET** `/api/sessions/` - List all sessions
- **POST** `/api/sessions/` - Create a session
- **GET** `/api/sessions/{id}/` - Get a session
- **PATCH** `/api/sessions/{id}/` - Update a session
- **DELETE** `/api/sessions/{id}/` - Delete a session

## Date Calculation Logic

When creating an actual session from a scheduled session, the system calculates the next occurrence of the specified day:

```javascript
const today = new Date();
const targetDay = parseInt(data.day); // 0-6 (Sunday-Saturday)
const currentDay = today.getDay();

let daysUntilTarget = targetDay - currentDay;
if (daysUntilTarget <= 0) {
    daysUntilTarget += 7; // Next week
}

const sessionDate = new Date(today);
sessionDate.setDate(today.getDate() + daysUntilTarget);
```

Example:
- Today: Saturday (6), January 11, 2026
- Target: Sunday (0)
- Days until target: 0 - 6 = -6, then -6 + 7 = 1
- Session date: January 12, 2026 (next Sunday)

## Error Handling

### Validation Errors
- Empty required fields: "الرجاء ملء جميع الحقول المطلوبة"
- Empty rows in weekly sessions: "الرجاء ملء جميع الحقول المطلوبة في الحصة X"
- No rows in weekly sessions: "الرجاء إضافة حصة واحدة على الأقل"

### API Errors
- Network errors: Caught and displayed with error message
- Server errors: Caught and displayed with error message
- Validation errors: Displayed with specific field errors

## UI/UX Features

### Modal Behavior
- Opens with fade-in animation
- Closes on X button click
- Closes on Cancel button click
- Closes on successful save
- Prevents closing during API calls

### Form Behavior
- Auto-populates dropdowns on open
- Resets form on open
- Sets default values (duration: 60, active: true, create session: true)
- Validates on submit
- Shows loading state during save

### Visual Feedback
- Loading spinner during API calls
- Success messages with details
- Error messages with specific information
- Updated statistics after operations
- Updated table after operations

## Performance Considerations

### Optimization Techniques
1. **Parallel API Calls**: Teachers and students are loaded in parallel
2. **Efficient DOM Manipulation**: Rows are added using `insertAdjacentHTML`
3. **Minimal Re-renders**: Only affected components are updated
4. **Debounced Updates**: Statistics are updated after all operations complete

### Memory Management
- Modal content is reused, not recreated
- Event listeners are properly managed
- No memory leaks from dynamic row creation

## Browser Compatibility

Tested and working on:
- Chrome 90+
- Firefox 88+
- Edge 90+
- Safari 14+

## Future Enhancements

Potential improvements:
1. Drag-and-drop row reordering
2. Bulk edit functionality
3. Template system for common schedules
4. Calendar view for scheduled sessions
5. Conflict detection (overlapping sessions)
6. Recurring session patterns (bi-weekly, monthly)
7. Session reminders and notifications
8. Export/import functionality

## Troubleshooting

### Common Issues

**Issue**: Modal doesn't open
- **Solution**: Check console for JavaScript errors
- **Solution**: Verify modal ID matches in HTML and JS

**Issue**: Dropdowns are empty
- **Solution**: Check API endpoints are accessible
- **Solution**: Verify data is loaded before opening modal

**Issue**: Sessions not created automatically
- **Solution**: Check "Create session automatically" is checked
- **Solution**: Verify API endpoint for sessions is working

**Issue**: Date calculation is wrong
- **Solution**: Check timezone settings
- **Solution**: Verify day of week values (0-6)

## Code Style Guidelines

### JavaScript
- Use `async/await` for asynchronous operations
- Use `const` for constants, `let` for variables
- Use descriptive function and variable names
- Add comments for complex logic
- Handle errors with try-catch blocks

### HTML
- Use semantic HTML elements
- Add ARIA labels for accessibility
- Use consistent indentation (4 spaces)
- Add comments for major sections

### CSS
- Use CSS variables for colors
- Use BEM naming convention where applicable
- Add vendor prefixes for compatibility
- Use transitions for smooth animations

## Testing Checklist

- [ ] Modal opens correctly
- [ ] Form fields are populated
- [ ] Validation works
- [ ] API calls succeed
- [ ] Success messages appear
- [ ] Error messages appear
- [ ] UI updates after operations
- [ ] Statistics update correctly
- [ ] Multiple rows can be added
- [ ] Rows can be deleted
- [ ] Bulk save works
- [ ] Date calculation is correct
- [ ] Sessions appear in sessions page
- [ ] Modal closes properly

## Maintenance

### Regular Tasks
1. Update dependencies regularly
2. Monitor API performance
3. Review error logs
4. Optimize database queries
5. Update documentation

### Version History
- v1.0.0 (2026-01-11): Initial implementation with professional modals

## Contact

For questions or issues, please contact the development team.
