# Task Manager App

A modern web application for managing tasks with user authentication and real-time synchronization using React and Firebase.

## Features

- 🔐 **User Authentication** - Secure login and registration with Firebase Auth
- ✅ **Task Management** - Create, read, update, and delete tasks
- 📊 **Task Statistics** - View active, completed, and total task counts
- 🔄 **Real-time Sync** - Tasks update instantly across devices
- 🎨 **Modern UI** - Clean, responsive interface with gradient design
- 🔒 **Private Tasks** - Each user's tasks are private and secure

## Project Structure

```
task-manager-app/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── TaskManager.jsx
│   │   ├── TaskForm.jsx
│   │   ├── TaskList.jsx
│   │   ├── TaskManager.css
│   │   └── TaskList.css
│   ├── App.jsx
│   ├── App.css
│   ├── main.jsx
│   └── firebase.js
├── .env.example
├── .gitignore
├── package.json
├── vite.config.js
└── README.md
```

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase account

## Getting Started

### 1. Clone or Create the Repository

```bash
cd task-manager-app
git init
git add .
git commit -m "Initial commit"
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable **Authentication** (Email/Password)
4. Create a **Firestore Database** (start in test mode)
5. Get your Firebase config credentials

### 4. Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your Firebase credentials in `.env.local`:
   ```
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
   VITE_FIREBASE_PROJECT_ID=your_project_id_here
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
   VITE_FIREBASE_APP_ID=your_app_id_here
   ```

### 5. Run the Development Server

```bash
npm run dev
```

The app will open automatically at `http://localhost:3000`

## Building for Production

```bash
npm run build
```

This creates an optimized build in the `dist/` folder.

## Firestore Database Structure

### Collection: `tasks`

Each task document contains:
```json
{
  "userId": "user_id_from_auth",
  "text": "Task description",
  "completed": false,
  "createdAt": "timestamp"
}
```

## Tech Stack

- **Frontend**: React 18
- **Build Tool**: Vite
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Styling**: CSS3

## Deployment Options

### Option 1: Firebase Hosting (Recommended)

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

### Option 2: Netlify

```bash
npm run build
# Deploy the dist/ folder to Netlify
```

### Option 3: Vercel

```bash
npm run build
# Deploy the dist/ folder to Vercel
```

## Usage

1. **Register** - Create a new account with email and password
2. **Login** - Sign in with your credentials
3. **Add Task** - Type a task and click "Add Task"
4. **Manage Tasks** - Check off completed tasks or delete them
5. **Filter** - View all, active, or completed tasks
6. **Logout** - Sign out when done

## Troubleshooting

### Tasks not loading?
- Check that Firestore is initialized in Firebase Console
- Verify `.env.local` has correct Firebase credentials
- Check browser console for error messages

### Authentication not working?
- Ensure "Email/Password" is enabled in Firebase Auth
- Check that user credentials are correct

### CORS errors?
- Firebase handles CORS automatically; check network tab for actual errors
- Ensure your Firebase project allows requests from localhost

## Next Steps

- Add task editing functionality
- Implement task due dates and priorities
- Add dark mode toggle
- Create task categories/tags
- Add push notifications
- Implement task sharing between users

## License

MIT

## Support

For issues or questions, check the [Firebase Documentation](https://firebase.google.com/docs) or [React Documentation](https://react.dev).
