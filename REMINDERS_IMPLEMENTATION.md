# Event Reminders Feature - Implementation & Testing Guide

## Overview
This document describes the Event Reminders feature implementation for the ATUnity mobile app. Users can enable/disable reminders for events they're interested in, and will receive notifications before the event starts.

## Feature Architecture

### Database Schema
- **event_reminders** table tracks reminder preferences per user per event
  - `reminder_enabled`: Boolean flag to enable/disable reminders
  - `reminder_minutes_before`: Minutes before event to send reminder (default: 60)
  - `notification_sent`: Tracks whether notification was already sent
  - Unique constraint on (event_id, user_id)

### Backend Components
1. **API Endpoints** (in `/api/events/:id/reminders`)
   - `GET` - Get reminder status for current user
   - `POST` - Enable/disable reminder with configurable minutes
   - `DELETE` - Disable reminder

2. **Notification Scheduler** (`backend/src/services/notificationScheduler.js`)
   - Runs every 5 minutes as a background job
   - Checks for upcoming events with active reminders
   - Sends email notifications (can be extended with push notifications)
   - Marks notifications as sent to prevent duplicates

### Frontend Components
1. **EventDetailsScreen** 
   - Toggleable reminder switch in reminder card
   - Displays reminder status and minutes before event
   - Real-time toggle without page refresh

2. **API Client** (`src/services/api.js`)
   - `getReminderStatus()` - Fetch current reminder setting
   - `toggleReminder()` - Enable/disable reminder
   - `disableReminder()` - Explicitly disable reminder

## User Stories Covered

### ✅ User can enable reminders for an event
- User navigates to Event Details screen
- Reminder toggle switch is visible
- User taps toggle to enable
- System saves preference to database
- Confirmation message shown

### ✅ Notification is delivered at expected time
- Scheduler runs every 5 minutes
- Checks for events within reminder window (default ±5 minutes of 60 minutes before)
- Email notification sent with event details
- Notification marked as sent to prevent duplicates
- Notifications only sent once per event

### ✅ User can disable reminders and notifications stop
- User toggles reminder switch off
- System updates database immediately
- Confirmation message shown
- Scheduler respects disabled state and doesn't send further notifications

## Manual Testing Steps

### Setup Phase
1. **Reset Database**
   ```sql
   -- Run the updated schema.sql to create event_reminders table
   psql -U postgres -d atunity < database/schema.sql
   ```

2. **Start Backend**
   ```bash
   cd backend
   npm install  # if nodemailer not installed
   node server.js
   ```

3. **Start Mobile App**
   ```bash
   npm start
   # Scan QR code with Expo Go app
   ```

### Test Case 1: Enable Reminder for Future Event

**Setup:**
- Create a test event scheduled for 1 hour in the future
- User is logged in on the mobile app

**Steps:**
1. Navigate to Events List
2. Tap on the upcoming event
3. Verify "Event Reminder" card is visible
4. Toggle reminder switch ON
5. Verify success message appears

**Expected Results:**
- ✅ Reminder card shows "Get notified 60 minutes before"
- ✅ Switch is in ON position
- ✅ Entry created in event_reminders table with reminder_enabled=TRUE

**Verify in Database:**
```sql
SELECT * FROM event_reminders WHERE event_id = (SELECT id FROM events WHERE title = 'Your Test Event');
```

---

### Test Case 2: Notification Delivery

**Setup:**
- Complete Test Case 1
- Log backend console output
- Create a test event scheduled exactly 60 minutes from now

**Steps:**
1. Wait for notification scheduler to run (max 5 minutes)
2. Check backend console for reminder notification logs
3. Check email inbox (if configured with SMTP)

**Expected Results:**
- ✅ Backend logs show "[REMINDER SENT]" message
- ✅ Console shows minutes_until_event is within tolerance window
- ✅ notification_sent flag is set to TRUE in database
- ✅ (Optional) Email received with event details

**Verify in Database:**
```sql
SELECT id, reminder_enabled, notification_sent FROM event_reminders 
WHERE event_id = (SELECT id FROM events WHERE title = 'Your Test Event');
```
Should show: `notification_sent = true`

---

### Test Case 3: Disable Reminder

**Setup:**
- Complete Test Case 1 (reminder enabled)

**Steps:**
1. Navigate back to the same event
2. Verify reminder toggle is ON
3. Toggle reminder switch OFF
4. Verify success message
5. Wait for next scheduler cycle

**Expected Results:**
- ✅ Reminder card shows "Enable to receive a reminder"
- ✅ Switch is in OFF position
- ✅ Database shows reminder_enabled=FALSE
- ✅ No further notifications sent for this event

**Verify in Database:**
```sql
SELECT reminder_enabled FROM event_reminders 
WHERE event_id = (SELECT id FROM events WHERE title = 'Your Test Event');
```
Should show: `reminder_enabled = false`

---

### Test Case 4: Verify Notification Sent Flag Prevents Duplicates

**Setup:**
- A past event (more than 1 hour ago) with notification_sent=TRUE

**Steps:**
1. Toggle reminder on for the past event
2. Manually reset notification_sent to FALSE
3. Wait for scheduler to run
4. Check that notification is NOT sent again

**Expected Results:**
- ✅ Scheduler checks but doesn't send because event is in past
- ✅ No duplicate notifications
- ✅ notification_sent remains FALSE (or gets reset)

---

## Testing the Notification Scheduler

### Manual Trigger for Development

Edit the scheduler tolerance in `notificationScheduler.js` for testing:

```javascript
// Current setting: 5 minute tolerance window
const tolerance = 5; // 5-minute tolerance window

// For testing, change to larger window:
const tolerance = 35; // 35+ minutes for wider testing window
```

Then create an event 2 hours in future, enable reminder, and wait 5 minutes for scheduler.

### Reset Past Reminders

To re-test notification delivery, use the reset function:

```javascript
// In backend console or via endpoint, call:
require('./src/services/notificationScheduler').resetPastReminders();
```

This resets `notification_sent=FALSE` for all past events.

---

## API Endpoint Testing (cURL/Postman)

### Get Reminder Status
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/events/1/reminders
```

Response:
```json
{
  "success": true,
  "reminderExists": true,
  "reminderEnabled": true,
  "reminderMinutesBefore": 60
}
```

### Enable Reminder
```bash
curl -X POST http://localhost:5000/api/events/1/reminders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reminderEnabled": true, "reminderMinutesBefore": 60}'
```

### Disable Reminder
```bash
curl -X DELETE http://localhost:5000/api/events/1/reminders \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Email Notification Setup (Optional)

To enable actual email notifications instead of console logs:

1. **Create `.env` file in backend/:**
```
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_specific_password
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
```

2. **Uncomment email sending code** in `notificationScheduler.js`:
```javascript
await emailTransporter.sendMail({
  from: process.env.EMAIL_USER,
  to: reminder.email,
  subject: emailSubject,
  html: emailBody
});
```

3. **For Gmail:**
   - Use [App Passwords](https://support.google.com/accounts/answer/185833) instead of regular password
   - Ensure "Less secure app access" is enabled if using regular password

---

## Verification Checklist

- [ ] Database schema updated with event_reminders table
- [ ] Backend API endpoints respond correctly
- [ ] Frontend reminder toggle works and saves to database
- [ ] Scheduler checks for reminders every 5 minutes
- [ ] Notification sent for events within time window
- [ ] notification_sent flag prevents duplicates
- [ ] Reminders don't send when reminder_enabled is FALSE
- [ ] User authentication required for reminder operations
- [ ] All test cases pass end-to-end

---

## Future Enhancements

1. **Push Notifications**
   - Integrate Expo Push Notifications
   - Install notification badges on app icon
   - Multiple reminders (15 min, 1 hour, 1 day before)

2. **User Preferences**
   - Customizable default reminder time
   - Quiet hours (don't send notifications between X-Y time)
   - Multiple reminder increments per event

3. **Reminder History**
   - View when reminders were sent
   - Resend reminder functionality
   - Notification preferences per event type

4. **Notification Center**
   - In-app notification history
   - Mark as read/unread
   - Swipe to delete

---

## Troubleshooting

### Reminders not showing in toggle
- Verify user is logged in
- Check that token is valid in AsyncStorage
- Verify API endpoint is returning data

### Notifications not sending
- Check scheduler logs: `[REMINDER SENT]`
- Verify event date/time is correct
- Ensure reminder_enabled = TRUE in database
- Check tolerance window calculation

### Duplicate notifications sent
- Verify notification_sent flag logic
- Check scheduler timing (should only run every 5 minutes)
- Reset using resetPastReminders() if needed

---

## Related Code Files
- Database: [schema.sql](../../database/schema.sql)
- Backend Routes: [events.js](../../backend/src/routes/events.js)
- Backend Controller: [eventsController.js](../../backend/src/controllers/eventsController.js)
- Scheduler Service: [notificationScheduler.js](../../backend/src/services/notificationScheduler.js)
- Frontend Screen: [EventDetailsScreen.js](../../src/screens/EventDetailsScreen.js)
- API Client: [api.js](../../src/services/api.js)
