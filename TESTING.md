# Testing Guide

## Quick Start

**Frontend Tests:**
```bash
npm test              # Run tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

**Backend Tests:**
```bash
cd backend
npm test              # Run tests
npm run test:watch    # Watch mode
```

## What's Tested
- Frontend: Event reminders, API calls, event logic (6 tests)
- Backend: Reminder endpoints (GET/POST/DELETE) (8 tests)

## CI/CD
Tests auto-run on every push/PR to main/develop branches via GitHub Actions.

