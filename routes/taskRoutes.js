// =============================================================
// routes/taskRoutes.js
// Task CRUD routes — all protected by JWT middleware
// =============================================================

import { Router }       from 'express';
import authenticate     from '../middleware/authMiddleware.js';
import {
  getAllTasks,
  getTasksByStatus,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
} from '../controllers/taskController.js';

const router = Router();

// Apply the JWT authentication middleware to every route in this file
router.use(authenticate);

// ── Filter route must come BEFORE /:id to avoid "filter" being
//    treated as a numeric ID parameter
router.get('/filter/status', getTasksByStatus);  // GET  /api/tasks/filter/status?status=pending

router.get('/',     getAllTasks);   // GET    /api/tasks
router.get('/:id',  getTaskById);  // GET    /api/tasks/:id
router.post('/',    createTask);   // POST   /api/tasks
router.put('/:id',  updateTask);   // PUT    /api/tasks/:id
router.delete('/:id', deleteTask); // DELETE /api/tasks/:id

export default router;
