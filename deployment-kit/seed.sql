INSERT INTO users (email, password_hash, name, course, year, role, subjects, availability, experience, description) VALUES
('student1@atu.ie', '$2b$10$abcdefghijklmnopqrstuv', 'John Murphy', 'Software Development', 3, 'student', NULL, NULL, NULL, NULL),
('tutor1@atu.ie', '$2b$10$abcdefghijklmnopqrstuv', 'Sarah Kelly', 'Software Development', 4, 'tutor', 'Java, SQL, Web Development', 'Mon-Wed 4pm to 7pm', 'Peer tutor for 1 year and strong in programming modules', 'Friendly tutor who can help with coding, assignments, and study planning.'),
('tutor2@atu.ie', '$2b$10$abcdefghijklmnopqrstuv', 'David OBrien', 'Computer Science', 4, 'tutor', 'Python, Databases, Algorithms', 'Tue-Thu 5pm to 8pm', 'Experience helping students prepare for exams and coursework', 'Happy to support students with programming, problem solving, and revision.');

INSERT INTO events (title, description, date, time, location, category, organizer) VALUES
('Orientation Day', 'Welcome all first-year students to ATU. Meet your course coordinators, get your timetable, and make new friends!', '2026-09-01', '09:00', 'Main Hall', 'academic', 'Student Services'),
('Tech Society Meetup', 'Weekly coding session with pizza! Bring your laptop and work on projects together. All skill levels welcome.', '2026-03-15', '18:00', 'Computer Lab A', 'social', 'Tech Society'),
('Basketball Game: ATU vs GMIT', 'Come support our team in the inter-college basketball championship!', '2026-03-20', '19:30', 'Sports Hall', 'sports', 'Sports Department'),
('Career Fair 2026', 'Meet employers from tech, finance, engineering, and more. Bring your CV and dress professionally!', '2026-04-05', '10:00', 'Exhibition Center', 'careers', 'Careers Office'),
('Study Skills Workshop', 'Learn effective study techniques, time management, and exam preparation strategies.', '2026-03-25', '14:00', 'Library Room 201', 'academic', 'Learning Support'),
('Open Mic Night', 'Showcase your talent! Singing, comedy, poetry - all welcome. Sign up at the door.', '2026-03-18', '20:00', 'Student Bar', 'social', 'Students Union');