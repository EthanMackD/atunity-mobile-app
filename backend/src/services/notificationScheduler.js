const pool = require('../config/database');
const nodemailer = require('nodemailer');

// Configure email transporter (using environment variables)
const emailTransporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

/**
 * Check and send reminders for upcoming events
 * This function should be called periodically (e.g., every 5 minutes via cron job)
 */
async function checkAndSendReminders() {
  try {
    console.log('Checking for reminders to send...');

    // Get all active reminders where notification hasn't been sent yet
    const remindersQuery = `
      SELECT 
        er.id as reminder_id,
        er.event_id,
        er.user_id,
        er.reminder_minutes_before,
        er.notification_sent,
        e.title,
        e.date,
        e.time,
        e.location,
        u.email,
        u.name
      FROM event_reminders er
      JOIN events e ON er.event_id = e.id
      JOIN users u ON er.user_id = u.id
      WHERE er.reminder_enabled = TRUE
        AND er.notification_sent = FALSE
        AND e.date >= CURRENT_DATE
    `;

    const result = await pool.query(remindersQuery);
    const reminders = result.rows;

    console.log(`Found ${reminders.length} active reminders to process`);

    for (const reminder of reminders) {
      // Calculate the event datetime
      // Handle both date object and string formats
      let dateStr = reminder.date;
      if (dateStr instanceof Date) {
        dateStr = dateStr.toISOString().split('T')[0]; // Convert to YYYY-MM-DD
      }
      
      const eventDateTime = new Date(`${dateStr}T${reminder.time}`);
      const now = new Date();
      const minutesUntilEvent = Math.floor((eventDateTime - now) / (1000 * 60));

      // Skip past events
      if (minutesUntilEvent < 0) {
        console.log(`[SKIPPED] Event: ${reminder.title}, Event is in the past (${Math.abs(minutesUntilEvent)} minutes ago)`);
        continue;
      }

      console.log(
        `[PENDING] Event: ${reminder.title}, Minutes until: ${minutesUntilEvent}, Reminder threshold: ${reminder.reminder_minutes_before}`
      );

      // Check if it's time to send the reminder
      // Send if we're within the reminder window (e.g., between 65 and 55 minutes before)
      const tolerance = 60; // n -minute tolerance window
      if (
        minutesUntilEvent <= reminder.reminder_minutes_before &&
        minutesUntilEvent > reminder.reminder_minutes_before - tolerance
      ) {
        await sendReminder(reminder);

        // Mark notification as sent
        await markNotificationSent(reminder.reminder_id);
      }
    }
  } catch (error) {
    console.error('Error in checkAndSendReminders:', error);
  }
}

/**
 * Send reminder notification via email
 * In a production app, this could also send push notifications via Firebase Cloud Messaging
 */
async function sendReminder(reminder) {
  try {
    const emailSubject = `Reminder: ${reminder.title} is coming up!`;
    const emailBody = `
      <h2>Event Reminder</h2>
      <p>Hi ${reminder.name},</p>
      <p>This is a reminder that the following event is coming up:</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3>${reminder.title}</h3>
        <p><strong>Date:</strong> ${reminder.date}</p>
        <p><strong>Time:</strong> ${reminder.time}</p>
        <p><strong>Location:</strong> ${reminder.location}</p>
      </div>
      <p>Don't miss it!</p>
      <p>Best regards,<br/>The ATUnity Team</p>
    `;

    // TODO: In production, uncomment this and add email credentials to .env
    // await emailTransporter.sendMail({
    //   from: process.env.EMAIL_USER,
    //   to: reminder.email,
    //   subject: emailSubject,
    //   html: emailBody
    // });

    // For development: just log the reminder
    console.log(`[REMINDER SENT] Email to ${reminder.email}: ${emailSubject}`);

    return true;
  } catch (error) {
    console.error(`Error sending reminder for event ${reminder.event_id}:`, error);
    return false;
  }
}

/**
 * Mark a notification as sent in the database
 */
async function markNotificationSent(reminderId) {
  try {
    await pool.query(
      'UPDATE event_reminders SET notification_sent = TRUE WHERE id = $1',
      [reminderId]
    );
    console.log(`Marked reminder ${reminderId} as sent`);
  } catch (error) {
    console.error(`Error marking reminder as sent:`, error);
  }
}

/**
 * Reset notifications for past events
 * Useful for testing - resets notification_sent flag for events that have passed
 */
async function resetPastReminders() {
  try {
    await pool.query(
      `UPDATE event_reminders 
       SET notification_sent = FALSE
       WHERE event_id IN (
         SELECT id FROM events WHERE date < CURRENT_DATE
       )`
    );
    console.log('Reset notifications for past events');
  } catch (error) {
    console.error('Error resetting past reminders:', error);
  }
}

module.exports = {
  checkAndSendReminders,
  sendReminder,
  markNotificationSent,
  resetPastReminders
};
