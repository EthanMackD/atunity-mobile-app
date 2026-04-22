# Deployment Kit

This folder contains the files needed to run the project on another machine.

## Files
- `.env.example` - example backend environment variables
- `database_setup.sql` - SQL setup for required database tables
- `backend-start.txt` - backend startup steps
- `frontend-start.txt` - frontend startup steps
- `deployment-checklist.txt` - testing checklist after setup

## Backend setup
1. Open terminal in backend folder
2. Run `npm install`
3. Create `.env` using `.env.example`
4. Make sure PostgreSQL is running
5. Run the SQL in `database_setup.sql`
6. Start backend - npm run dev

## Frontend setup
1. Open terminal in frontend folder
2. Run `npm install`
3. Start the frontend - npx expo start
