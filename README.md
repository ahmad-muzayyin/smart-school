# AttendanceHub

A production-ready, multi-tenant Attendance Management System.

## Architecture
- **Frontend**: React Native (Expo), TypeScript, Zustand, Axios.
- **Backend**: Node.js, Express, TypeScript, Prisma, MySQL.

## Prerequisites
- Node.js (LTS)
- MySQL Database running locally or remotely.

## Setup Instructions

### 1. Backend Setup

1. Navigate to the backend directory:
   ```powershell
   cd backend
   ```

2. Install dependencies (if not already done):
   ```powershell
   npm install
   ```

3. Configure Environment Variables:
   - Copy `.env.example` to `.env`.
   - Update `DATABASE_URL` with your MySQL credentials.
     Example: `mysql://root:password@localhost:3306/attendance_hub`
   - Update `JWT_SECRET`.

4. Run Database Migrations:
   ```powershell
   npm run migrate
   ```
   *Note: This will create the database schema.*

5. Seed Initial Data (Owner Account):
   ```powershell
   npx ts-node src/scripts/seed.ts
   ```
   **Default Owner Credentials:**
   - Email: `owner@platform.com`
   - Password: `admin123`

6. Start the Server:
   ```powershell
   npm run dev
   ```
   Server runs on `http://localhost:3000`.

### 2. Frontend Setup

1. Open a new terminal.
2. Navigate to the frontend directory:
   ```powershell
   cd frontend
   ```

3. Install dependencies:
   ```powershell
   npm install
   ```

4. Start the App:
   ```powershell
   npx expo start
   ```
   - Press `a` for Android Emulator.
   - Press `i` for iOS Simulator.
   - Scan QR code with Expo Go.

## Features
- **Platform Owner**: Create Schools (Tenants).
- **School Admin**: Create Teachers, Students, Classes, Schedules.
- **Teacher**: View Schedule, Take Attendance.
- **Student**: View Schedule.

## Notes
- **Multi-Tenancy**: Data is strictly isolated by `tenant_id`.
- **API URL**: Configured in `src/api/client.ts`. Default is `http://10.0.2.2:3000/api` for Android Emulator access to localhost. Update if testing on physical device (use your PC IP).
