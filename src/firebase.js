import { initializeApp } from 'firebase/app'
import { getAuth, onAuthStateChanged, signOut, createUserWithEmailAndPassword as firebaseCreateUser, signInWithEmailAndPassword as firebaseSignIn } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const hasFirebaseConfig = Object.values(firebaseConfig).every(
  (value) => typeof value === 'string' && value.trim() !== ''
)

let app = null
let auth = null
let db = null

if (hasFirebaseConfig) {
  try {
    app = initializeApp(firebaseConfig)
    auth = getAuth(app)
    db = getFirestore(app)
  } catch (error) {
    console.warn('Firebase initialization failed. Falling back to demo mode.', error)
  }
}

export const isFirebaseConfigured = Boolean(auth && db)
export const firebaseAuth = auth
export const firebaseDb = db

const USERS_STORAGE_KEY = 'task-manager-users'
const SESSION_STORAGE_KEY = 'task-manager-session'
const TASKS_STORAGE_PREFIX = 'task-manager-tasks-'

function readUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

function writeUsers(users) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
}

function readSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY) || 'null')
  } catch {
    return null
  }
}

function writeSession(user) {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user))
}

function clearSession() {
  localStorage.removeItem(SESSION_STORAGE_KEY)
}

function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function getStoredTasks(userId) {
  if (!userId) return []

  try {
    return JSON.parse(localStorage.getItem(`${TASKS_STORAGE_PREFIX}${userId}`) || '[]')
  } catch {
    return []
  }
}

export function saveStoredTasks(userId, tasks) {
  if (!userId) return
  localStorage.setItem(`${TASKS_STORAGE_PREFIX}${userId}`, JSON.stringify(tasks))
}

export async function createTaskInStore(userId, text, status = 'backlog') {
  const trimmedText = text.trim()
  if (!trimmedText) throw new Error('Task text cannot be empty')

  const task = {
    id: makeId(),
    text: trimmedText,
    completed: status === 'done',
    status,
    order: Date.now(),
    createdAt: new Date().toISOString(),
  }

  const tasks = getStoredTasks(userId)
  tasks.unshift(task)
  saveStoredTasks(userId, tasks)
  return task
}

export async function deleteTaskFromStore(userId, taskId) {
  const tasks = getStoredTasks(userId).filter((task) => task.id !== taskId)
  saveStoredTasks(userId, tasks)
}

export async function updateTaskInStore(userId, taskId, changes) {
  const tasks = getStoredTasks(userId).map((task) =>
    task.id === taskId ? { ...task, ...changes } : task
  )
  saveStoredTasks(userId, tasks)
}

export async function signInWithEmailAndPassword(email, password) {
  if (!isFirebaseConfigured) {
    const users = readUsers()
    const normalizedEmail = email.trim().toLowerCase()
    const user = users[normalizedEmail]

    if (!user || user.password !== password) {
      throw new Error('Invalid email or password')
    }

    const sessionUser = { uid: user.uid, email: user.email }
    writeSession(sessionUser)
    return sessionUser
  }

  return firebaseSignIn(firebaseAuth, email, password)
}

export async function createUserWithEmailAndPassword(email, password) {
  if (!isFirebaseConfigured) {
    const users = readUsers()
    const normalizedEmail = email.trim().toLowerCase()

    if (users[normalizedEmail]) {
      throw new Error('An account with this email already exists')
    }

    const user = {
      uid: makeId(),
      email: normalizedEmail,
      password,
    }

    users[normalizedEmail] = user
    writeUsers(users)

    const sessionUser = { uid: user.uid, email: user.email }
    writeSession(sessionUser)
    return sessionUser
  }

  return firebaseCreateUser(firebaseAuth, email, password)
}

export async function signOutUser() {
  if (!isFirebaseConfigured) {
    clearSession()
    return
  }

  return signOut(firebaseAuth)
}

export function onAuthStateChangedUser(callback) {
  if (!isFirebaseConfigured) {
    callback(readSession())
    return () => {}
  }

  return onAuthStateChanged(firebaseAuth, callback)
}

export default app
