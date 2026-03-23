require('dotenv').config({ path: './backend/.env' });
const pool = require('./backend/src/config/database');

async function setupDatabase() {
  try {
    console.log('Setting up database with environment:', {
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      user: process.env.DB_USER
    });
    
    console.log('Creating event_reminders table...');
    
    // Create event_reminders table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS event_reminders (
        id SERIAL PRIMARY KEY,
        event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        reminder_enabled BOOLEAN DEFAULT TRUE,
        reminder_minutes_before INTEGER DEFAULT 60,
        notification_sent BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(event_id, user_id)
      );
    `;
    
    await pool.query(createTableQuery);
    console.log('✅ event_reminders table created successfully');
    
    // Create indexes
    const indexQueries = [
      'CREATE INDEX IF NOT EXISTS idx_event_reminders_enabled ON event_reminders(reminder_enabled, notification_sent);',
      'CREATE INDEX IF NOT EXISTS idx_event_reminders_event_user ON event_reminders(event_id, user_id);'
    ];
    
    for (const query of indexQueries) {
      await pool.query(query);
    }
    console.log('✅ Indexes created successfully');
    
    // Verify table exists
    const verifyQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'event_reminders'
      );
    `;
    
    const result = await pool.query(verifyQuery);
    if (result.rows[0].exists) {
      console.log('✅ Verification: event_reminders table exists!');
    }
    
    console.log('✅ Database setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    process.exit(1);
  }
}

setupDatabase();
