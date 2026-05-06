import { useState } from "react";
import { cn } from "./utils/cn";

// ─── Data ─────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: "overview",   label: "Overview",        icon: "🏠" },
  { id: "setup",      label: "Setup Guide",     icon: "⚙️" },
  { id: "schema",     label: "DB Schema",       icon: "🗄️" },
  { id: "auth",       label: "Auth Endpoints",  icon: "🔑" },
  { id: "tasks",      label: "Task Endpoints",  icon: "📋" },
  { id: "source",     label: "Source Files",    icon: "📁" },
  { id: "security",   label: "Security",        icon: "🔒" },
];

const METHOD_COLORS: Record<string, string> = {
  GET:    "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40",
  POST:   "bg-blue-500/20   text-blue-300   border border-blue-500/40",
  PUT:    "bg-amber-500/20  text-amber-300  border border-amber-500/40",
  DELETE: "bg-rose-500/20   text-rose-300   border border-rose-500/40",
};

const STATUS_COLORS: Record<number, string> = {
  200: "text-emerald-400",
  201: "text-blue-400",
  400: "text-amber-400",
  401: "text-rose-400",
  404: "text-orange-400",
  409: "text-purple-400",
  500: "text-red-500",
};

// ─── Sub-components ───────────────────────────────────────────

function Badge({ method }: { method: string }) {
  return (
    <span className={cn("px-2.5 py-0.5 rounded text-xs font-bold font-mono tracking-wider", METHOD_COLORS[method] ?? "bg-slate-700 text-slate-300")}>
      {method}
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button onClick={copy}
      className="text-xs px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-all font-mono flex items-center gap-1.5 select-none">
      {copied ? "✓ Copied" : "⎘ Copy"}
    </button>
  );
}

function CodeBlock({ code, language = "json", label }: { code: string; language?: string; label?: string }) {
  return (
    <div className="rounded-xl overflow-hidden border border-slate-700/60 bg-slate-900/80 shadow-xl">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800/70 border-b border-slate-700/60">
        <span className="text-xs text-slate-400 font-mono">{label ?? language}</span>
        <CopyButton text={code} />
      </div>
      <pre className="p-4 text-sm font-mono text-slate-200 overflow-x-auto leading-relaxed whitespace-pre">
        <SyntaxHighlight code={code} language={language} />
      </pre>
    </div>
  );
}

/** Very lightweight syntax highlighting — no deps needed */
function SyntaxHighlight({ code, language }: { code: string; language: string }) {
  if (language === "json") {
    const highlighted = code
      .replace(/("(?:[^"\\]|\\.)*")\s*:/g, '<span class="text-sky-300">$1</span>:')
      .replace(/:\s*("(?:[^"\\]|\\.)*")/g, ': <span class="text-emerald-300">$1</span>')
      .replace(/:\s*(true|false|null)/g, ': <span class="text-amber-300">$1</span>')
      .replace(/:\s*(-?\d+\.?\d*)/g, ': <span class="text-purple-300">$1</span>');
    return <span dangerouslySetInnerHTML={{ __html: highlighted }} />;
  }
  if (language === "bash") {
    const lines = code.split("\n").map((line, i) => {
      const isComment = line.trim().startsWith("#");
      const isCommand = line.trim().startsWith("$") || line.trim().startsWith("npm") || line.trim().startsWith("node") || line.trim().startsWith("cp") || line.trim().startsWith("cd") || line.trim().startsWith("git");
      return (
        <span key={i} className={cn("block", isComment ? "text-slate-500" : isCommand ? "text-emerald-300" : "text-slate-200")}>
          {line}
        </span>
      );
    });
    return <>{lines}</>;
  }
  if (language === "sql") {
    const keywords = ["CREATE", "TABLE", "IF", "NOT", "EXISTS", "INT", "VARCHAR", "TEXT", "TIMESTAMP", "DATE", "ENUM", "DEFAULT", "PRIMARY", "KEY", "AUTO_INCREMENT", "UNIQUE", "FOREIGN", "REFERENCES", "ON", "DELETE", "CASCADE", "ENGINE", "CHARSET", "COLLATE", "NULL"];
    let result = code;
    keywords.forEach(kw => {
      result = result.replace(new RegExp(`\\b${kw}\\b`, "g"), `<span class="text-amber-300">${kw}</span>`);
    });
    result = result.replace(/--[^\n]*/g, '<span class="text-slate-500">$&</span>');
    result = result.replace(/'[^']*'/g, '<span class="text-emerald-300">$&</span>');
    return <span dangerouslySetInnerHTML={{ __html: result }} />;
  }
  // javascript / default
  if (language === "javascript") {
    const keywords = ["import", "export", "from", "const", "let", "var", "async", "await", "return", "if", "else", "try", "catch", "new", "default"];
    let result = code;
    keywords.forEach(kw => {
      result = result.replace(new RegExp(`\\b${kw}\\b`, "g"), `<span class="text-purple-300">${kw}</span>`);
    });
    result = result.replace(/\/\/.*/g, '<span class="text-slate-500">$&</span>');
    result = result.replace(/'[^']*'/g, '<span class="text-emerald-300">$&</span>');
    return <span dangerouslySetInnerHTML={{ __html: result }} />;
  }
  return <span>{code}</span>;
}

function EndpointCard({
  method, path, description, requestBody, responseBody, responseCode = 200, params,
}: {
  method: string; path: string; description: string;
  requestBody?: string; responseBody?: string; responseCode?: number;
  params?: { name: string; required: boolean; description: string; values?: string }[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 overflow-hidden shadow-lg hover:border-slate-600/80 transition-colors">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-slate-700/20 transition-colors">
        <Badge method={method} />
        <code className="text-slate-100 font-mono text-sm flex-1">{path}</code>
        <span className="text-slate-400 text-sm hidden sm:block">{description}</span>
        <span className="text-slate-500 text-sm ml-auto">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="px-5 pb-5 pt-1 border-t border-slate-700/40 space-y-4">
          <p className="text-slate-300 text-sm">{description}</p>

          {params && params.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Parameters</p>
              <div className="overflow-x-auto rounded-lg border border-slate-700/60">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-800/60 text-left text-slate-400 text-xs">
                      <th className="px-4 py-2 font-medium">Name</th>
                      <th className="px-4 py-2 font-medium">Required</th>
                      <th className="px-4 py-2 font-medium">Description</th>
                      <th className="px-4 py-2 font-medium">Values</th>
                    </tr>
                  </thead>
                  <tbody>
                    {params.map(p => (
                      <tr key={p.name} className="border-t border-slate-700/40">
                        <td className="px-4 py-2 font-mono text-sky-300">{p.name}</td>
                        <td className="px-4 py-2">
                          <span className={cn("text-xs px-2 py-0.5 rounded font-medium", p.required ? "bg-rose-500/20 text-rose-300" : "bg-slate-700 text-slate-400")}>
                            {p.required ? "required" : "optional"}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-slate-300">{p.description}</td>
                        <td className="px-4 py-2 text-slate-400 font-mono text-xs">{p.values ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {requestBody && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Request Body</p>
              <CodeBlock code={requestBody} language="json" label="JSON" />
            </div>
          )}

          {responseBody && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Response{" "}
                <span className={cn("text-base font-bold", STATUS_COLORS[responseCode] ?? "text-slate-300")}>
                  {responseCode}
                </span>
              </p>
              <CodeBlock code={responseBody} language="json" label="JSON" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ id, title, icon, children }: { id: string; title: string; icon: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <h2 className="text-2xl font-bold text-white">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function SourceFileTab({ filename, code, language }: { filename: string; code: string; language: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 overflow-hidden shadow-lg">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-slate-700/20 transition-colors">
        <span className="text-base">📄</span>
        <code className="text-sky-300 font-mono text-sm flex-1">{filename}</code>
        <span className="text-xs text-slate-500 font-mono">{language}</span>
        <span className="text-slate-500 text-sm ml-2">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="border-t border-slate-700/40">
          <CodeBlock code={code} language={language} label={filename} />
        </div>
      )}
    </div>
  );
}

// ─── Source code strings ──────────────────────────────────────

const SOURCE_FILES = [
  {
    filename: "server.js",
    language: "javascript",
    code: `import express   from 'express';
import cors      from 'cors';
import dotenv    from 'dotenv';
import { testConnection, initializeDatabase } from './config/database.js';
import authRoutes from './routes/authRoutes.js';
import taskRoutes from './routes/taskRoutes.js';

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 3000;

// Global Middleware
app.use(cors({
  origin:  process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'OK', message: 'Task Manager API is running' });
});

// Route groups
app.use('/api/auth',  authRoutes);
app.use('/api/tasks', taskRoutes);

// 404 Handler
app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

// Global Error Handler
app.use((err, _req, res, _next) => {
  console.error('[GlobalError]', err);
  res.status(500).json({ message: 'An unexpected error occurred.' });
});

const start = async () => {
  await testConnection();
  await initializeDatabase();
  app.listen(PORT, () => {
    console.log('🚀 Server running on http://localhost:' + PORT);
  });
};

start();`,
  },
  {
    filename: "config/database.js",
    language: "javascript",
    code: `import mysql  from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

// Create a connection pool (reuses connections efficiently)
const pool = mysql.createPool({
  host:            process.env.DB_HOST     || 'localhost',
  port:            parseInt(process.env.DB_PORT || '3306', 10),
  user:            process.env.DB_USER     || 'root',
  password:        process.env.DB_PASSWORD || '',
  database:        process.env.DB_NAME     || 'task_manager',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  timezone:           '+00:00',
});

export const testConnection = async () => {
  const connection = await pool.getConnection();
  console.log('✅ MySQL connected successfully');
  connection.release();
};

export const initializeDatabase = async () => {
  // Create users table
  await pool.execute(\`
    CREATE TABLE IF NOT EXISTS users (
      id         INT           NOT NULL AUTO_INCREMENT,
      username   VARCHAR(255)  NOT NULL,
      email      VARCHAR(255)  NOT NULL,
      password   VARCHAR(255)  NOT NULL,
      created_at TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_username (username),
      UNIQUE KEY uq_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  \`);

  // Create tasks table with FK to users
  await pool.execute(\`
    CREATE TABLE IF NOT EXISTS tasks (
      id          INT                                       NOT NULL AUTO_INCREMENT,
      user_id     INT                                       NOT NULL,
      title       VARCHAR(255)                              NOT NULL,
      description TEXT,
      status      ENUM('pending','in_progress','completed')  DEFAULT 'pending',
      priority    ENUM('low','medium','high')                DEFAULT 'medium',
      due_date    DATE,
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      CONSTRAINT fk_tasks_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  \`);
};

export default pool;`,
  },
  {
    filename: "middleware/authMiddleware.js",
    language: "javascript",
    code: `import jwt from 'jsonwebtoken';

// Verifies JWT from Authorization: Bearer <token> header
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'Access denied. No token provided.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, username, email, iat, exp }
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired.' });
    }
    return res.status(401).json({ message: 'Invalid token.' });
  }
};

export default authenticate;`,
  },
  {
    filename: "controllers/authController.js",
    language: "javascript",
    code: `import bcrypt from 'bcryptjs';
import jwt    from 'jsonwebtoken';
import pool   from '../config/database.js';

const isValidEmail    = (e) => /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(e);
const isStrongPassword = (p) => /^(?=.*[A-Za-z])(?=.*\\d).{8,}$/.test(p);

// POST /api/auth/register
export const register = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password)
    return res.status(400).json({ message: 'All fields required.' });

  if (!isValidEmail(email))
    return res.status(400).json({ message: 'Invalid email.' });

  if (!isStrongPassword(password))
    return res.status(400).json({ message: 'Weak password.' });

  const [existing] = await pool.execute(
    'SELECT id FROM users WHERE email = ? OR username = ?',
    [email.toLowerCase(), username.trim()]
  );
  if (existing.length > 0)
    return res.status(409).json({ message: 'User already exists.' });

  const hashed = await bcrypt.hash(password, 10);
  const [result] = await pool.execute(
    'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
    [username.trim(), email.toLowerCase(), hashed]
  );

  return res.status(201).json({
    message: 'User registered successfully',
    user: { id: result.insertId, username, email },
  });
};

// POST /api/auth/login
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: 'Email and password required.' });

  const [rows] = await pool.execute(
    'SELECT id, username, email, password FROM users WHERE email = ?',
    [email.toLowerCase()]
  );
  if (rows.length === 0)
    return res.status(401).json({ message: 'Invalid credentials.' });

  const match = await bcrypt.compare(password, rows[0].password);
  if (!match)
    return res.status(401).json({ message: 'Invalid credentials.' });

  const token = jwt.sign(
    { id: rows[0].id, username: rows[0].username, email: rows[0].email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  return res.status(200).json({
    message: 'Login successful',
    token,
    user: { id: rows[0].id, username: rows[0].username, email: rows[0].email },
  });
};`,
  },
  {
    filename: "controllers/taskController.js",
    language: "javascript",
    code: `import pool from '../config/database.js';

const VALID_STATUSES   = ['pending', 'in_progress', 'completed'];
const VALID_PRIORITIES = ['low', 'medium', 'high'];

// GET /api/tasks
export const getAllTasks = async (req, res) => {
  const userId = req.user.id;
  const allowedSort = ['created_at','updated_at','due_date','priority','status','title'];
  const sortBy = allowedSort.includes(req.query.sortBy) ? req.query.sortBy : 'created_at';
  const order  = req.query.order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const [tasks] = await pool.execute(
    \`SELECT * FROM tasks WHERE user_id = ? ORDER BY \${sortBy} \${order}\`,
    [userId]
  );
  return res.status(200).json({ message: 'Tasks retrieved successfully', count: tasks.length, tasks });
};

// GET /api/tasks/filter/status?status=pending
export const getTasksByStatus = async (req, res) => {
  const { status } = req.query;
  if (!VALID_STATUSES.includes(status))
    return res.status(400).json({ message: 'Invalid status.' });

  const [tasks] = await pool.execute(
    'SELECT * FROM tasks WHERE user_id = ? AND status = ? ORDER BY created_at DESC',
    [req.user.id, status]
  );
  return res.status(200).json({ message: \`Tasks with status "\${status}" retrieved\`, count: tasks.length, tasks });
};

// GET /api/tasks/:id
export const getTaskById = async (req, res) => {
  const [rows] = await pool.execute(
    'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id]
  );
  if (!rows.length) return res.status(404).json({ message: 'Task not found.' });
  return res.status(200).json({ message: 'Task retrieved successfully', task: rows[0] });
};

// POST /api/tasks
export const createTask = async (req, res) => {
  const { title, description, status, priority, due_date } = req.body;
  if (!title) return res.status(400).json({ message: 'Title required.' });

  const [result] = await pool.execute(
    'INSERT INTO tasks (user_id,title,description,status,priority,due_date) VALUES (?,?,?,?,?,?)',
    [req.user.id, title.trim(), description || null, status || 'pending', priority || 'medium', due_date || null]
  );
  const [newTask] = await pool.execute('SELECT * FROM tasks WHERE id = ?', [result.insertId]);
  return res.status(201).json({ message: 'Task created successfully', task: newTask[0] });
};

// PUT /api/tasks/:id
export const updateTask = async (req, res) => {
  const { title, description, status, priority, due_date } = req.body;
  const fields = [], values = [];

  if (title       !== undefined) { fields.push('title = ?');       values.push(title.trim()); }
  if (description !== undefined) { fields.push('description = ?'); values.push(description); }
  if (status      !== undefined) { fields.push('status = ?');      values.push(status); }
  if (priority    !== undefined) { fields.push('priority = ?');    values.push(priority); }
  if (due_date    !== undefined) { fields.push('due_date = ?');    values.push(due_date); }

  if (!fields.length) return res.status(400).json({ message: 'No fields to update.' });

  values.push(req.params.id, req.user.id);
  await pool.execute(\`UPDATE tasks SET \${fields.join(', ')} WHERE id = ? AND user_id = ?\`, values);

  const [updated] = await pool.execute('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
  return res.status(200).json({ message: 'Task updated successfully', task: updated[0] });
};

// DELETE /api/tasks/:id
export const deleteTask = async (req, res) => {
  const [result] = await pool.execute(
    'DELETE FROM tasks WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id]
  );
  if (!result.affectedRows) return res.status(404).json({ message: 'Task not found.' });
  return res.status(200).json({ message: 'Task deleted successfully.' });
};`,
  },
  {
    filename: "routes/taskRoutes.js",
    language: "javascript",
    code: `import { Router }   from 'express';
import authenticate  from '../middleware/authMiddleware.js';
import {
  getAllTasks, getTasksByStatus, getTaskById,
  createTask, updateTask, deleteTask,
} from '../controllers/taskController.js';

const router = Router();

// Protect all task routes
router.use(authenticate);

// Filter route MUST come before /:id
router.get('/filter/status', getTasksByStatus);

router.get('/',       getAllTasks);
router.get('/:id',    getTaskById);
router.post('/',      createTask);
router.put('/:id',    updateTask);
router.delete('/:id', deleteTask);

export default router;`,
  },
  {
    filename: ".env.example",
    language: "bash",
    code: `PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=task_manager

JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d

CORS_ORIGIN=*`,
  },
];

// ─── Main App ─────────────────────────────────────────────────

export default function App() {
  const [activeSection, setActiveSection] = useState("overview");

  const scrollTo = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">

      {/* ── TOP HEADER ─────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-lg shadow-lg shadow-blue-500/20">
              📋
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-none">Task Manager API</h1>
              <p className="text-xs text-slate-400 leading-none mt-0.5">Node.js · Express · MySQL · JWT</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:flex items-center gap-1.5 text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-full font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              v1.0.0 Production Ready
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-8 py-8">

        {/* ── SIDEBAR ──────────────────────────────────────── */}
        <aside className="hidden lg:block w-56 shrink-0">
          <nav className="sticky top-24 space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-3">Navigation</p>
            {NAV_ITEMS.map(item => (
              <button key={item.id} onClick={() => scrollTo(item.id)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all text-left",
                  activeSection === item.id
                    ? "bg-blue-600/20 text-blue-300 font-medium border border-blue-500/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                )}>
                <span>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* ── MAIN CONTENT ─────────────────────────────────── */}
        <main className="flex-1 min-w-0 space-y-16">

          {/* OVERVIEW */}
          <Section id="overview" title="Task Manager API" icon="🏠">
            <div className="rounded-2xl bg-gradient-to-br from-blue-900/30 via-indigo-900/20 to-slate-900 border border-blue-500/20 p-6 sm:p-8 shadow-2xl">
              <p className="text-slate-300 text-base leading-relaxed mb-6">
                A <strong className="text-white">production-ready RESTful API</strong> for managing tasks with full
                user authentication, CRUD operations, status filtering, and priority levels. Built with a modern
                Node.js stack and structured for real-world deployment.
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { icon: "⚡", label: "Express.js", desc: "Fast, minimal web framework" },
                  { icon: "🗄️", label: "MySQL 8",    desc: "Relational database with mysql2" },
                  { icon: "🔐", label: "JWT Auth",   desc: "Stateless token authentication" },
                  { icon: "🔒", label: "bcryptjs",   desc: "Secure password hashing (10 rounds)" },
                  { icon: "🌍", label: "CORS",       desc: "Configurable cross-origin support" },
                  { icon: "📦", label: "dotenv",     desc: "Environment variable management" },
                ].map(t => (
                  <div key={t.label} className="flex items-start gap-3 bg-slate-800/40 rounded-xl px-4 py-3 border border-slate-700/40">
                    <span className="text-xl mt-0.5">{t.icon}</span>
                    <div>
                      <p className="text-white font-semibold text-sm">{t.label}</p>
                      <p className="text-slate-400 text-xs">{t.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick endpoint map */}
            <div className="rounded-xl border border-slate-700/60 bg-slate-800/30 overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-700/60 bg-slate-800/50">
                <p className="text-sm font-semibold text-slate-300">📡 Endpoint Overview</p>
              </div>
              <div className="divide-y divide-slate-700/30">
                {[
                  { method: "POST",   path: "/api/auth/register",          desc: "Register new user" },
                  { method: "POST",   path: "/api/auth/login",              desc: "Login + get JWT" },
                  { method: "GET",    path: "/api/tasks",                   desc: "Get all tasks (auth required)" },
                  { method: "GET",    path: "/api/tasks/:id",               desc: "Get task by ID" },
                  { method: "GET",    path: "/api/tasks/filter/status",     desc: "Filter by status" },
                  { method: "POST",   path: "/api/tasks",                   desc: "Create new task" },
                  { method: "PUT",    path: "/api/tasks/:id",               desc: "Update task" },
                  { method: "DELETE", path: "/api/tasks/:id",               desc: "Delete task" },
                  { method: "GET",    path: "/health",                      desc: "Health check" },
                ].map((e, i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-800/30 transition-colors">
                    <Badge method={e.method} />
                    <code className="text-slate-200 font-mono text-sm flex-1 min-w-0 truncate">{e.path}</code>
                    <span className="text-slate-500 text-sm hidden sm:block">{e.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          {/* SETUP */}
          <Section id="setup" title="Setup Guide" icon="⚙️">
            <div className="space-y-5">
              {[
                {
                  step: "1",
                  title: "Clone & Install Dependencies",
                  code: `cd task-manager-api
npm install`,
                  lang: "bash",
                },
                {
                  step: "2",
                  title: "Create Environment File",
                  code: `cp .env.example .env
# Then edit .env with your MySQL credentials and JWT secret`,
                  lang: "bash",
                },
                {
                  step: "3",
                  title: "Create MySQL Database",
                  code: `-- Run in your MySQL client
CREATE DATABASE IF NOT EXISTS task_manager
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Tables are auto-created on first server start`,
                  lang: "sql",
                },
                {
                  step: "4",
                  title: "Start the Server",
                  code: `# Production
npm start

# Development (auto-restart)
npm run dev

# Server starts at http://localhost:3000`,
                  lang: "bash",
                },
              ].map(s => (
                <div key={s.step} className="flex gap-4">
                  <div className="w-8 h-8 shrink-0 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold text-white mt-1">
                    {s.step}
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="font-semibold text-slate-200">{s.title}</p>
                    <CodeBlock code={s.code} language={s.lang} />
                  </div>
                </div>
              ))}
            </div>

            {/* .env reference */}
            <div className="mt-4">
              <p className="text-sm font-semibold text-slate-300 mb-3">📄 .env Reference</p>
              <CodeBlock
                label=".env"
                language="bash"
                code={`PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=task_manager

JWT_SECRET=your_super_secret_key_change_this
JWT_EXPIRES_IN=7d

CORS_ORIGIN=*`}
              />
            </div>
          </Section>

          {/* SCHEMA */}
          <Section id="schema" title="Database Schema" icon="🗄️">
            <div className="grid md:grid-cols-2 gap-5">
              {/* Users */}
              <div className="rounded-xl border border-slate-700/60 bg-slate-800/30 overflow-hidden">
                <div className="px-5 py-3 bg-blue-600/10 border-b border-blue-500/20 flex items-center gap-2">
                  <span>👤</span>
                  <p className="font-semibold text-blue-300 font-mono">users</p>
                </div>
                <div className="divide-y divide-slate-700/30">
                  {[
                    { col: "id",         type: "INT",          note: "PRIMARY KEY · AUTO_INCREMENT" },
                    { col: "username",   type: "VARCHAR(255)", note: "UNIQUE · NOT NULL" },
                    { col: "email",      type: "VARCHAR(255)", note: "UNIQUE · NOT NULL" },
                    { col: "password",   type: "VARCHAR(255)", note: "bcrypt hashed" },
                    { col: "created_at", type: "TIMESTAMP",    note: "DEFAULT CURRENT_TIMESTAMP" },
                  ].map(r => (
                    <div key={r.col} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                      <code className="text-sky-300 font-mono w-28 shrink-0">{r.col}</code>
                      <code className="text-purple-300 font-mono text-xs w-28 shrink-0">{r.type}</code>
                      <span className="text-slate-500 text-xs">{r.note}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tasks */}
              <div className="rounded-xl border border-slate-700/60 bg-slate-800/30 overflow-hidden">
                <div className="px-5 py-3 bg-emerald-600/10 border-b border-emerald-500/20 flex items-center gap-2">
                  <span>✅</span>
                  <p className="font-semibold text-emerald-300 font-mono">tasks</p>
                </div>
                <div className="divide-y divide-slate-700/30">
                  {[
                    { col: "id",          type: "INT",          note: "PRIMARY KEY · AUTO_INCREMENT" },
                    { col: "user_id",     type: "INT",          note: "FK → users.id (CASCADE)" },
                    { col: "title",       type: "VARCHAR(255)", note: "NOT NULL" },
                    { col: "description", type: "TEXT",         note: "nullable" },
                    { col: "status",      type: "ENUM",         note: "pending | in_progress | completed" },
                    { col: "priority",    type: "ENUM",         note: "low | medium | high" },
                    { col: "due_date",    type: "DATE",         note: "nullable · YYYY-MM-DD" },
                    { col: "created_at",  type: "TIMESTAMP",    note: "DEFAULT CURRENT_TIMESTAMP" },
                    { col: "updated_at",  type: "TIMESTAMP",    note: "ON UPDATE CURRENT_TIMESTAMP" },
                  ].map(r => (
                    <div key={r.col} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                      <code className="text-sky-300 font-mono w-28 shrink-0">{r.col}</code>
                      <code className="text-purple-300 font-mono text-xs w-24 shrink-0">{r.type}</code>
                      <span className="text-slate-500 text-xs">{r.note}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <CodeBlock
              label="SQL — Auto-created on startup"
              language="sql"
              code={`CREATE TABLE IF NOT EXISTS users (
  id         INT           NOT NULL AUTO_INCREMENT,
  username   VARCHAR(255)  NOT NULL,
  email      VARCHAR(255)  NOT NULL,
  password   VARCHAR(255)  NOT NULL,
  created_at TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_username (username),
  UNIQUE KEY uq_email    (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tasks (
  id          INT                                       NOT NULL AUTO_INCREMENT,
  user_id     INT                                       NOT NULL,
  title       VARCHAR(255)                              NOT NULL,
  description TEXT,
  status      ENUM('pending','in_progress','completed')  DEFAULT 'pending',
  priority    ENUM('low','medium','high')                DEFAULT 'medium',
  due_date    DATE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_tasks_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`}
            />
          </Section>

          {/* AUTH ENDPOINTS */}
          <Section id="auth" title="Auth Endpoints" icon="🔑">
            <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 px-4 py-3 text-sm text-amber-300 flex items-start gap-2">
              <span className="mt-0.5">💡</span>
              <span>These endpoints are <strong>public</strong> — no JWT token required. Copy the token from the login response to use protected task endpoints.</span>
            </div>
            <div className="space-y-4">
              <EndpointCard
                method="POST"
                path="/api/auth/register"
                description="Create a new user account. Password is hashed with bcryptjs (10 salt rounds)."
                params={[
                  { name: "username", required: true,  description: "Unique display name", values: "min 3 chars" },
                  { name: "email",    required: true,  description: "Valid email address" },
                  { name: "password", required: true,  description: "Secure password", values: "≥8 chars, 1 letter + 1 number" },
                ]}
                requestBody={`{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securePass123"
}`}
                responseBody={`{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com"
  }
}`}
                responseCode={201}
              />
              <EndpointCard
                method="POST"
                path="/api/auth/login"
                description="Authenticate with email and password. Returns a signed JWT token valid for 7 days."
                params={[
                  { name: "email",    required: true, description: "Registered email address" },
                  { name: "password", required: true, description: "Account password" },
                ]}
                requestBody={`{
  "email": "john@example.com",
  "password": "securePass123"
}`}
                responseBody={`{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com"
  }
}`}
                responseCode={200}
              />
            </div>
          </Section>

          {/* TASK ENDPOINTS */}
          <Section id="tasks" title="Task Endpoints" icon="📋">
            <div className="rounded-xl bg-blue-500/5 border border-blue-500/20 px-4 py-3 text-sm text-blue-300 flex items-start gap-2">
              <span className="mt-0.5">🔐</span>
              <span>All task endpoints require the header: <code className="bg-slate-800 px-2 py-0.5 rounded font-mono text-blue-200">Authorization: Bearer &lt;token&gt;</code></span>
            </div>
            <div className="space-y-4">
              <EndpointCard
                method="GET"
                path="/api/tasks"
                description="Get all tasks for the authenticated user. Supports sorting via query parameters."
                params={[
                  { name: "sortBy", required: false, description: "Column to sort by", values: "created_at | updated_at | due_date | priority | status | title" },
                  { name: "order",  required: false, description: "Sort direction", values: "asc | desc (default: desc)" },
                ]}
                responseBody={`{
  "message": "Tasks retrieved successfully",
  "count": 2,
  "tasks": [
    {
      "id": 1,
      "user_id": 1,
      "title": "Complete project documentation",
      "description": "Write comprehensive API docs",
      "status": "pending",
      "priority": "high",
      "due_date": "2026-05-15",
      "created_at": "2026-05-05T10:30:00.000Z",
      "updated_at": "2026-05-05T10:30:00.000Z"
    }
  ]
}`}
                responseCode={200}
              />
              <EndpointCard
                method="GET"
                path="/api/tasks/filter/status"
                description="Filter tasks by their current status. Returns only tasks matching the given status."
                params={[
                  { name: "status", required: true, description: "Task status to filter by", values: "pending | in_progress | completed" },
                ]}
                responseBody={`{
  "message": "Tasks with status \\"pending\\" retrieved successfully",
  "count": 1,
  "tasks": [
    {
      "id": 1,
      "title": "Complete project documentation",
      "status": "pending",
      "priority": "high"
    }
  ]
}`}
                responseCode={200}
              />
              <EndpointCard
                method="GET"
                path="/api/tasks/:id"
                description="Retrieve a single task by its ID. Returns 404 if the task doesn't exist or belongs to another user."
                params={[
                  { name: ":id", required: true, description: "Task ID (integer)" },
                ]}
                responseBody={`{
  "message": "Task retrieved successfully",
  "task": {
    "id": 1,
    "user_id": 1,
    "title": "Complete project documentation",
    "description": "Write comprehensive API docs",
    "status": "pending",
    "priority": "high",
    "due_date": "2026-05-15",
    "created_at": "2026-05-05T10:30:00.000Z",
    "updated_at": "2026-05-05T10:30:00.000Z"
  }
}`}
                responseCode={200}
              />
              <EndpointCard
                method="POST"
                path="/api/tasks"
                description="Create a new task. Only title is required. Defaults: status=pending, priority=medium."
                params={[
                  { name: "title",       required: true,  description: "Task title",              values: "max 255 chars" },
                  { name: "description", required: false, description: "Detailed description" },
                  { name: "status",      required: false, description: "Initial status",           values: "pending | in_progress | completed" },
                  { name: "priority",    required: false, description: "Task priority",            values: "low | medium | high" },
                  { name: "due_date",    required: false, description: "Deadline",                 values: "YYYY-MM-DD" },
                ]}
                requestBody={`{
  "title": "Complete project documentation",
  "description": "Write comprehensive API documentation",
  "priority": "high",
  "due_date": "2026-05-15"
}`}
                responseBody={`{
  "message": "Task created successfully",
  "task": {
    "id": 1,
    "user_id": 1,
    "title": "Complete project documentation",
    "description": "Write comprehensive API documentation",
    "status": "pending",
    "priority": "high",
    "due_date": "2026-05-15",
    "created_at": "2026-05-05T10:30:00.000Z",
    "updated_at": "2026-05-05T10:30:00.000Z"
  }
}`}
                responseCode={201}
              />
              <EndpointCard
                method="PUT"
                path="/api/tasks/:id"
                description="Update an existing task. Send only the fields you want to change — all fields are optional."
                params={[
                  { name: ":id",        required: true,  description: "Task ID" },
                  { name: "title",       required: false, description: "New title" },
                  { name: "description", required: false, description: "New description" },
                  { name: "status",      required: false, description: "New status",   values: "pending | in_progress | completed" },
                  { name: "priority",    required: false, description: "New priority", values: "low | medium | high" },
                  { name: "due_date",    required: false, description: "New deadline", values: "YYYY-MM-DD" },
                ]}
                requestBody={`{
  "status": "in_progress",
  "priority": "high"
}`}
                responseBody={`{
  "message": "Task updated successfully",
  "task": {
    "id": 1,
    "user_id": 1,
    "title": "Complete project documentation",
    "status": "in_progress",
    "priority": "high",
    "updated_at": "2026-05-05T12:00:00.000Z"
  }
}`}
                responseCode={200}
              />
              <EndpointCard
                method="DELETE"
                path="/api/tasks/:id"
                description="Permanently delete a task. Confirms ownership before deletion. Returns 404 if not found."
                params={[
                  { name: ":id", required: true, description: "Task ID (integer)" },
                ]}
                responseBody={`{
  "message": "Task deleted successfully."
}`}
                responseCode={200}
              />
            </div>
          </Section>

          {/* SOURCE FILES */}
          <Section id="source" title="Source Files" icon="📁">
            <div className="rounded-xl bg-slate-800/30 border border-slate-700/60 px-4 py-3 text-sm text-slate-300 flex items-start gap-2">
              <span>📌</span>
              <span>Click any file to expand and view the complete, production-ready source code with comments.</span>
            </div>
            <div className="space-y-3">
              {SOURCE_FILES.map(f => (
                <SourceFileTab key={f.filename} filename={f.filename} code={f.code} language={f.language} />
              ))}
            </div>
          </Section>

          {/* SECURITY */}
          <Section id="security" title="Security" icon="🔒">
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  icon: "🔑",
                  title: "JWT Authentication",
                  desc: "All task routes are protected by Bearer token authentication. Tokens carry the user's ID, username, and email as payload and are signed with HS256.",
                  code: `// Verify token
const decoded = jwt.verify(token, process.env.JWT_SECRET);
// decoded = { id, username, email, iat, exp }`,
                },
                {
                  icon: "🔒",
                  title: "Password Hashing",
                  desc: "Passwords are never stored in plain text. bcryptjs hashes with 10 salt rounds, making brute-force attacks computationally impractical.",
                  code: `// Hash on register
const hashed = await bcrypt.hash(password, 10);

// Verify on login
const match = await bcrypt.compare(password, hash);`,
                },
                {
                  icon: "🛡️",
                  title: "SQL Injection Prevention",
                  desc: "All database queries use parameterised statements via mysql2. User input is never interpolated directly into SQL strings.",
                  code: `// Safe — parameterised query
await pool.execute(
  'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
  [taskId, userId]
);`,
                },
                {
                  icon: "🎯",
                  title: "User Data Scoping",
                  desc: "Every task query filters by user_id from the JWT payload. Users can never read, update, or delete another user's tasks — even if they know the task ID.",
                  code: `// All queries include user_id from token
WHERE id = ? AND user_id = ?
// user_id = req.user.id (from JWT)`,
                },
                {
                  icon: "✅",
                  title: "Input Validation",
                  desc: "All endpoints validate required fields, email format, password strength, enum values, and date formats before touching the database.",
                  code: `// Email format
/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)

// Password strength
/^(?=.*[A-Za-z])(?=.*\\d).{8,}$/.test(pw)`,
                },
                {
                  icon: "🌍",
                  title: "Environment Variables",
                  desc: "All sensitive configuration (DB credentials, JWT secret) live in .env — never hardcoded. The .gitignore excludes .env from version control.",
                  code: `# .env (never committed)
DB_PASSWORD=secret
JWT_SECRET=your_super_secret_key`,
                },
              ].map(card => (
                <div key={card.title} className="rounded-xl border border-slate-700/60 bg-slate-800/30 p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{card.icon}</span>
                    <h3 className="font-semibold text-white">{card.title}</h3>
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed">{card.desc}</p>
                  <CodeBlock code={card.code} language="javascript" />
                </div>
              ))}
            </div>

            {/* HTTP Status codes */}
            <div className="rounded-xl border border-slate-700/60 bg-slate-800/30 overflow-hidden mt-2">
              <div className="px-5 py-3 border-b border-slate-700/60 bg-slate-800/50">
                <p className="text-sm font-semibold text-slate-300">📊 HTTP Status Codes</p>
              </div>
              <div className="divide-y divide-slate-700/30">
                {[
                  { code: 200, text: "OK",                    desc: "Successful read or update" },
                  { code: 201, text: "Created",               desc: "Resource created successfully" },
                  { code: 400, text: "Bad Request",           desc: "Validation failed or missing fields" },
                  { code: 401, text: "Unauthorized",          desc: "Missing, invalid, or expired JWT" },
                  { code: 404, text: "Not Found",             desc: "Resource doesn't exist or no access" },
                  { code: 409, text: "Conflict",              desc: "Duplicate email or username" },
                  { code: 500, text: "Internal Server Error", desc: "Unexpected server-side error" },
                ].map(s => (
                  <div key={s.code} className="flex items-center gap-4 px-5 py-3 text-sm">
                    <code className={cn("font-mono font-bold text-base w-12", STATUS_COLORS[s.code])}>{s.code}</code>
                    <span className="text-slate-300 font-medium w-40">{s.text}</span>
                    <span className="text-slate-500">{s.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          {/* FOOTER */}
          <footer className="pt-8 pb-4 border-t border-slate-800 text-center text-slate-500 text-sm space-y-1">
            <p className="text-base font-semibold text-slate-300">📋 Task Manager API</p>
            <p>Production-ready · Node.js · Express · MySQL · JWT · bcryptjs</p>
            <p className="text-xs text-slate-600 mt-2">MIT License · v1.0.0</p>
          </footer>

        </main>
      </div>
    </div>
  );
}
