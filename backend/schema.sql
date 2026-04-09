-- ATUnity Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  course VARCHAR(255),
  year VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  time VARCHAR(50),
  location VARCHAR(255),
  category VARCHAR(100),
  organizer VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Event attendees table
CREATE TABLE IF NOT EXISTS event_attendees (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

-- Sample events so the app isn't empty
INSERT INTO events (title, description, date, time, location, category, organizer) VALUES
  ('Welcome Week Kickoff', 'Join us for the start of welcome week!', NOW() + INTERVAL '2 days', '10:00', 'Main Hall', 'social', 'Student Union'),
  ('Python Workshop', 'Intro to Python for beginners.', NOW() + INTERVAL '3 days', '14:00', 'Computer Lab A', 'academic', 'CS Society'),
  ('5-a-side Football', 'Casual football, all welcome.', NOW() + INTERVAL '4 days', '17:00', 'Sports Hall', 'sports', 'Sports Society'),
  ('Careers Fair 2025', 'Meet top employers from across Ireland.', NOW() + INTERVAL '7 days', '11:00', 'Exhibition Center', 'careers', 'Careers Office'),
  ('Study Skills Seminar', 'Tips for exam preparation.', NOW() + INTERVAL '5 days', '13:00', 'Library Room 201', 'academic', 'Learning Support'),
  ('End of Year Party', 'Celebrate the end of semester!', NOW() + INTERVAL '10 days', '20:00', 'Student Bar', 'social', 'Student Union');
