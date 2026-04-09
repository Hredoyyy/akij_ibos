<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

Online Assessment Platform – Full Stack (Real Backend + Clerk Auth)

1. Core Stack (Mandatory)

This project MUST use:

Next.js (App Router)
TypeScript
Tailwind CSS
ShadCN UI
Clerk (Authentication & User Management)
Prisma ORM
PostgreSQL (Neon / Supabase / Local)
Zustand (Client State)
React Hook Form + Zod
Axios + React Query

No mock APIs.
All data must be persisted in the database.

2. Authentication (Clerk Integration)
   Requirements
   Use Clerk for authentication
   Use Clerk middleware to protect routes
   Implement role-based access control
   Roles

User roles:

EMPLOYER
CANDIDATE

Store role in:

Clerk public metadata
OR
Local User table linked to Clerk userId
Route Protection

Protected route groups:

(employer) → only EMPLOYER
(candidate) → only CANDIDATE

Unauthorized access must redirect properly.

3. Database Schema (Prisma)

Must include:

User
User

- id (UUID)
- clerkId (string, unique)
- role (EMPLOYER | CANDIDATE)
- createdAt
  Exam
  Exam
- id
- title
- totalCandidates
- totalSlots
- questionType
- startTime
- endTime
- duration
- employerId (relation)
- createdAt
  Question
  Question
- id
- examId
- title
- type (CHECKBOX | RADIO | TEXT)
  Option
  Option
- id
- questionId
- text
- isCorrect
  ExamAttempt
  ExamAttempt
- id
- candidateId
- examId
- startedAt
- submittedAt
- score
- violations
  Answer
  Answer
- id
- attemptId
- questionId
- selectedOptionIds (array)
- textAnswer

Use proper foreign key relationships.

4. Backend Implementation Rules

Use:

Next.js Route Handlers (app/api/...)
OR dedicated API layer inside /app/api

Rules:

No business logic inside route files
Extract logic into /services
Validate all inputs using Zod
Use proper error handling
Use transactions where necessary 5. Employer Panel (Fully Functional)
Login

Handled by Clerk.

Dashboard

Fetch exams created by employer from DB.

Display:

Exam name
Candidates count
Question sets
Slots
View candidates button

Must use:

React Query
Proper loading & error states
Create Online Test (Multi-Step)

Step 1 → Save draft in Zustand
Step 2 → Add questions dynamically

On final submit:

Persist exam
Persist questions
Persist options
Use Prisma transaction

No temporary memory storage.

6. Candidate Panel
   Dashboard

Fetch available exams where:

current time is within exam window
slots not exceeded
Exam Flow

When candidate clicks Start:

Create ExamAttempt
Store start time in DB
Start timer based on DB time
Persist answers progressively 7. Timer Rules (Critical)

Timer must:

Be derived from:
duration - (currentTime - startedAt)
Work after page refresh
Work after tab switch
Auto-submit on timeout

Timer logic must live in:

useExamTimer() 8. Behavioral Tracking

Detect:

Tab switch (visibilitychange)
Fullscreen exit
Window blur

On violation:

Increment violation count in DB
Show warning
Auto-submit after threshold (e.g., 3 violations)

Must persist violations server-side.

9. State Management Strategy

Use Zustand ONLY for:

UI state
Draft form state
Temporary navigation state

Never store persistent data only in Zustand.

All exam data must come from backend.

10. Offline Handling Strategy

If internet disconnects during exam:

Store answers in localStorage
On reconnect:
Sync unsaved answers
Recalculate timer from DB
If exam time expired while offline:
Immediately auto-submit

Timer must never rely on client-only state.

11. Performance & Optimization
    Use React Query caching
    Avoid prop drilling
    Memoize question components
    Paginate large question sets
    Use dynamic imports if necessary
    Avoid unnecessary re-renders
12. Clean Architecture Rules
    Components → Presentation only
    Services → Business logic
    Hooks → Reusable logic
    API routes → Thin controllers
    Types → Centralized
    No duplication
    Strong TypeScript usage
    No any
13. Deployment Requirements

Deploy:

Frontend → Vercel
Database → Neon / Supabase
Clerk configured with production keys

Ensure:

Env variables secured
Production build passes
Database migrations applied 14. README Must Include
Setup instructions
Environment variables
Database migration steps
Clerk setup guide
Architecture explanation
Answers to additional questions:
MCP usage idea
AI tools used
Offline handling strategy 15. Code Quality Expectations

This project must demonstrate:

Real full-stack understanding
Secure authentication
Proper data modeling
Clean folder structure
Real-world architecture
Edge case handling
Production-ready code

No shortcuts.
No mock data.
No temporary hacks.

<!-- END:nextjs-agent-rules -->
