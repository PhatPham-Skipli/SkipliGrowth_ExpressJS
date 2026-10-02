# ⚙️ Mini Trello - Backend Server API

A robust, type-safe, real-time backend API service powering the Mini Trello application. Built with **Node.js**, **Express 5**, **TypeScript**, **Socket.IO Server**, **Firebase Firestore Admin**, **Octokit**, and **Swagger UI**.

![Express.js](https://img.shields.io/badge/Express.js-5.0-000000?style=for-the-badge&logo=express)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Socket.IO](https://img.shields.io/badge/Socket.io-4.8-black?style=for-the-badge&logo=socket.io)
![Firebase](https://img.shields.io/badge/Firebase_Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Swagger](https://img.shields.io/badge/Swagger_UI-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)

---

## ✨ Core Features & Architecture

### 🏛️ Layered Architecture Pattern
- **Routes Layer (`src/routes/`)**: Express controllers handling HTTP requests, query parsing, and request validation via `jet-validators` and `parseReq`.
- **Service Layer (`src/services/`)**: Encapsulates 100% of business logic (`BoardService`, `TaskService`, `CardService`, `SocketService`, `AuthService`, `RepositoryService`, `MailService`).
- **Repository Layer (`src/repos/`)**: Data access layer isolating Firebase Firestore database queries.
- **Model Layer (`src/models/`)**: Strongly-typed domain models with custom **Firestore Data Converters** converting raw documents into type-safe JavaScript Date objects and entities.

### 🔐 Authentication & Authorization
- **Passwordless OTP Email Auth**: Generates 6-digit verification codes sent via HTML email templates using `Nodemailer` + `Handlebars`.
- **JWT & HTTP-Only Cookies**: Issues signed JSON Web Tokens stored in secure `httpOnly`, `sameSite: lax` cookies.
- **GitHub OAuth Integration**: Exchanges GitHub OAuth authorization codes for user access tokens via Octokit.
- **Role & Access Control**: Verifies board membership and ownership before allowing board/card/task mutations.

### 📡 Multi-Room Socket.IO Server Engine
- **Targeted Broadcasts**: Manages real-time rooms (`board:${boardId}` and `user:${userId}`) to broadcast mutations immediately after database writes.
- **Cookie Handshake Fallback**: Parses socket handshake headers to extract `accessToken` cookies when `auth.token` is omitted.
- **CORS Credentials Configuration**: Configured for secure cross-origin WebSocket connections (`withCredentials: true`).

### 📦 GitHub Repository & Task Attachment Engine
- **GitHub Integration**: Interfaces with GitHub REST API via Octokit to fetch user repositories, branches, pull requests, commits, and issues.
- **Task Attachments**: Links specific GitHub items directly to cards and tasks.

---

## 🛠️ Tech Stack

- **Runtime & Framework**: [Node.js](https://nodejs.org/), [Express.js 5](https://expressjs.com/)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/) (Strict Mode)
- **Database**: [Firebase Firestore Admin SDK](https://firebase.google.com/docs/firestore)
- **Real-Time Communication**: [Socket.IO Server v4](https://socket.io/)
- **Request Validation**: `jet-validators` & `parseReq`
- **Mailing System**: [Nodemailer](https://nodemailer.com/) + `nodemailer-express-handlebars`
- **GitHub SDK**: `@octokit/oauth-methods` & `octokit`
- **API Documentation**: [Swagger UI Express](https://swagger.io/) (OpenAPI 3.0 Spec)

---

## 📁 Project Structure

```text
server/
├── config/                     # Environment configuration files (.env.development, .env.production)
├── src/                        # Main Source Directory
│   ├── common/                 # Global Types, Constants, Utilities, and Middleware
│   │   ├── constants/          # HTTP Status Codes & Error Messages
│   │   ├── middleware/         # JWT Verification & CORS Middleware
│   │   └── types/              # Socket Events, Responses, and DTO Types
│   ├── models/                 # Domain Models & Firestore Data Converters
│   ├── repos/                  # Firebase Firestore Database Repositories
│   ├── routes/                 # Express Router Controllers & Route Handlers
│   ├── services/               # Core Business Logic & Socket Emmiters
│   ├── views/                  # Handlebars Email Templates
│   ├── main.ts                 # Server Entry Point
│   └── server.ts               # Express & Socket.IO App Initialization
├── swagger.yaml                # OpenAPI 3.0 API Specification
└── tsconfig.prod.json          # Production TypeScript Configuration
```

---

## ⚙️ Environment Variables Setup

Create a configuration file at `config/.env.development` or `config/.env.production`:

```env
# Environment & Server Setup
NODE_ENV=development
PORT=3001
HOST=localhost

# Security & JWT
JWT_SECRET=your_super_secret_jwt_key_here
COOKIE_SECRET=your_super_secret_cookie_key_here

# Firebase Admin Credentials
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_key\n-----END PRIVATE KEY-----"

# GitHub OAuth Credentials
GITHUB_CLIENT_ID=your_github_oauth_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_client_secret
GITHUB_REDIRECT_URI=http://localhost:3000/login/github

# SMTP Email Configuration (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

---

## 🚦 Getting Started

### Prerequisites
- **Node.js**: `>= 18.0.0`
- **Package Manager**: `bun` (recommended), `npm`, or `pnpm`

### Installation

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Start the development server:
   ```bash
   bun dev
   ```

4. Server will be running at `http://localhost:3001`.
5. Access Swagger API Documentation at `http://localhost:3001/swagger`.

### Building for Production

To compile TypeScript and build the production bundle:

```bash
bun run build
```

To run the production server:

```bash
bun start
```

---

## 🔗 API Endpoint Reference Summary

### 🔐 Auth & Account (`/api/auth`)
- `POST /api/auth/signup` - Send OTP verification code to email.
- `POST /api/auth/signin` - Verify OTP code and issue JWT `accessToken` cookie.
- `GET /api/auth/me` - Fetch authenticated user profile.
- `POST /api/auth/logout` - Clear `accessToken` cookie.
- `GET /api/auth/github/init` - Initialize GitHub OAuth redirect.
- `POST /api/auth/github` - Exchange GitHub OAuth code for user profile.

### 📋 Boards (`/api/boards`)
- `GET /api/boards` - List all boards accessible to user.
- `POST /api/boards` - Create a new board.
- `GET /api/boards/:boardId` - Get detailed board data.
- `PATCH /api/boards/:boardId` - Update board title or description.
- `DELETE /api/boards/:boardId` - Delete board & cascade delete columns/tasks.
- `POST /api/boards/:boardId/invitations` - Invite a user to board by email.
- `POST /api/boards/invite/:inviteId/accept` - Accept a board invitation.
- `DELETE /api/boards/:boardId/members/leave` - Leave a board.
- `POST /api/boards/:boardId/members/:memberId/kick` - Kick a member from board.

### 📊 Cards / Columns (`/api/boards/:boardId/cards`)
- `GET /api/boards/:boardId/cards` - Get all cards for a board.
- `POST /api/boards/:boardId/cards` - Create a column.
- `PATCH /api/boards/:boardId/cards/:cardId` - Update column title.
- `DELETE /api/boards/:boardId/cards/:cardId` - Delete column & cascade delete tasks.
- `PATCH /api/boards/:boardId/cards/reorder` - Reorder column positions.

### 📝 Tasks (`/api/boards/:boardId/cards/:cardId/tasks`)
- `GET /api/boards/:boardId/cards/:cardId/tasks` - Get tasks for a column.
- `POST /api/boards/:boardId/cards/:cardId/tasks` - Create a task.
- `PATCH /api/boards/:boardId/cards/:cardId/tasks/:taskId` - Update task details.
- `DELETE /api/boards/:boardId/cards/:cardId/tasks/:taskId` - Delete task.
- `PATCH /api/boards/:boardId/cards/:cardId/tasks/reorder` - Reorder tasks (same or cross-column).
- `POST /api/boards/:boardId/cards/:cardId/tasks/:taskId/assign` - Assign user to task.
- `DELETE /api/boards/:boardId/cards/:cardId/tasks/:taskId/assign/:memberId` - Unassign user from task.
- `POST /api/boards/:boardId/cards/:cardId/tasks/:taskId/github-attach` - Attach GitHub PR/Commit/Issue.
- `DELETE /api/boards/:boardId/cards/:cardId/tasks/:taskId/github-attachments/:attachmentId` - Remove attachment.

---

## 📄 License

This project is licensed under the MIT License.
