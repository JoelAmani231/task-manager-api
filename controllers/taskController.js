// =============================================================
// controllers/taskController.js
// CRUD operations for tasks — all routes are user-scoped
// =============================================================

import pool from '../config/database.js';

// Valid enum values (mirrors the DB schema)
const VALID_STATUSES   = ['pending', 'in_progress', 'completed'];
const VALID_PRIORITIES = ['low', 'medium', 'high'];

// ─── GET /api/tasks ───────────────────────────────────────────

/**
 * Retrieve all tasks belonging to the authenticated user.
 * Supports optional sorting via ?sortBy=due_date&order=asc
 */
export const getAllTasks = async (req, res) => {
  try {
    const userId = req.user.id;

    // Safe column whitelist to prevent SQL injection via query params
    const allowedSortColumns = ['created_at', 'updated_at', 'due_date', 'priority', 'status', 'title'];
    const sortBy  = allowedSortColumns.includes(req.query.sortBy) ? req.query.sortBy : 'created_at';
    const order   = req.query.order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const [tasks] = await pool.execute(
      `SELECT id, user_id, title, description, status, priority, due_date, created_at, updated_at
         FROM tasks
        WHERE user_id = ?
        ORDER BY ${sortBy} ${order}`,
      [userId]
    );

    return res.status(200).json({
      message: 'Tasks retrieved successfully',
      count:   tasks.length,
      tasks,
    });
  } catch (error) {
    console.error('[getAllTasks] Error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// ─── GET /api/tasks/filter/status ────────────────────────────

/**
 * Filter the authenticated user's tasks by status.
 * Query param: ?status=pending | in_progress | completed
 */
export const getTasksByStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    if (!status) {
      return res.status(400).json({
        message: 'Query parameter "status" is required.',
        validValues: VALID_STATUSES,
      });
    }

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Valid values: ${VALID_STATUSES.join(', ')}`,
      });
    }

    const [tasks] = await pool.execute(
      `SELECT id, user_id, title, description, status, priority, due_date, created_at, updated_at
         FROM tasks
        WHERE user_id = ? AND status = ?
        ORDER BY created_at DESC`,
      [userId, status]
    );

    return res.status(200).json({
      message: `Tasks with status "${status}" retrieved successfully`,
      count:   tasks.length,
      tasks,
    });
  } catch (error) {
    console.error('[getTasksByStatus] Error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// ─── GET /api/tasks/:id ───────────────────────────────────────

/**
 * Retrieve a single task by ID.
 * Ensures the task belongs to the authenticated user.
 */
export const getTaskById = async (req, res) => {
  try {
    const userId = req.user.id;
    const taskId = parseInt(req.params.id, 10);

    if (isNaN(taskId)) {
      return res.status(400).json({ message: 'Task ID must be a valid integer.' });
    }

    const [rows] = await pool.execute(
      `SELECT id, user_id, title, description, status, priority, due_date, created_at, updated_at
         FROM tasks
        WHERE id = ? AND user_id = ?`,
      [taskId, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    return res.status(200).json({
      message: 'Task retrieved successfully',
      task:    rows[0],
    });
  } catch (error) {
    console.error('[getTaskById] Error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// ─── POST /api/tasks ──────────────────────────────────────────

/**
 * Create a new task for the authenticated user.
 */
export const createTask = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description, status, priority, due_date } = req.body;

    // ── Validate required fields ──────────────────────────────
    if (!title || title.trim().length === 0) {
      return res.status(400).json({ message: 'Title is required.' });
    }

    if (title.trim().length > 255) {
      return res.status(400).json({ message: 'Title must not exceed 255 characters.' });
    }

    // ── Validate optional enum fields ─────────────────────────
    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Valid values: ${VALID_STATUSES.join(', ')}`,
      });
    }

    if (priority && !VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({
        message: `Invalid priority. Valid values: ${VALID_PRIORITIES.join(', ')}`,
      });
    }

    // ── Validate due_date format (YYYY-MM-DD) ─────────────────
    if (due_date && !/^\d{4}-\d{2}-\d{2}$/.test(due_date)) {
      return res.status(400).json({ message: 'due_date must be in YYYY-MM-DD format.' });
    }

    // ── Insert task ───────────────────────────────────────────
    const [result] = await pool.execute(
      `INSERT INTO tasks (user_id, title, description, status, priority, due_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        userId,
        title.trim(),
        description?.trim() || null,
        status   || 'pending',
        priority || 'medium',
        due_date || null,
      ]
    );

    // ── Fetch the newly created task to return complete data ──
    const [newTask] = await pool.execute(
      'SELECT * FROM tasks WHERE id = ?',
      [result.insertId]
    );

    return res.status(201).json({
      message: 'Task created successfully',
      task:    newTask[0],
    });
  } catch (error) {
    console.error('[createTask] Error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// ─── PUT /api/tasks/:id ───────────────────────────────────────

/**
 * Update an existing task.
 * Only updates fields that are actually provided in the request body.
 */
export const updateTask = async (req, res) => {
  try {
    const userId = req.user.id;
    const taskId = parseInt(req.params.id, 10);

    if (isNaN(taskId)) {
      return res.status(400).json({ message: 'Task ID must be a valid integer.' });
    }

    // ── Verify task ownership ─────────────────────────────────
    const [existing] = await pool.execute(
      'SELECT id FROM tasks WHERE id = ? AND user_id = ?',
      [taskId, userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    // ── Build dynamic UPDATE query ────────────────────────────
    const { title, description, status, priority, due_date } = req.body;
    const fields  = [];
    const values  = [];

    if (title !== undefined) {
      if (title.trim().length === 0)   return res.status(400).json({ message: 'Title cannot be empty.' });
      if (title.trim().length > 255)   return res.status(400).json({ message: 'Title must not exceed 255 characters.' });
      fields.push('title = ?');
      values.push(title.trim());
    }

    if (description !== undefined) {
      fields.push('description = ?');
      values.push(description?.trim() || null);
    }

    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({
          message: `Invalid status. Valid values: ${VALID_STATUSES.join(', ')}`,
        });
      }
      fields.push('status = ?');
      values.push(status);
    }

    if (priority !== undefined) {
      if (!VALID_PRIORITIES.includes(priority)) {
        return res.status(400).json({
          message: `Invalid priority. Valid values: ${VALID_PRIORITIES.join(', ')}`,
        });
      }
      fields.push('priority = ?');
      values.push(priority);
    }

    if (due_date !== undefined) {
      if (due_date !== null && !/^\d{4}-\d{2}-\d{2}$/.test(due_date)) {
        return res.status(400).json({ message: 'due_date must be in YYYY-MM-DD format.' });
      }
      fields.push('due_date = ?');
      values.push(due_date || null);
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: 'No valid fields provided for update.' });
    }

    values.push(taskId, userId);

    await pool.execute(
      `UPDATE tasks SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
      values
    );

    // ── Return the updated task ───────────────────────────────
    const [updatedTask] = await pool.execute('SELECT * FROM tasks WHERE id = ?', [taskId]);

    return res.status(200).json({
      message: 'Task updated successfully',
      task:    updatedTask[0],
    });
  } catch (error) {
    console.error('[updateTask] Error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// ─── DELETE /api/tasks/:id ────────────────────────────────────

/**
 * Delete a task by ID.
 * Confirms ownership before deleting.
 */
export const deleteTask = async (req, res) => {
  try {
    const userId = req.user.id;
    const taskId = parseInt(req.params.id, 10);

    if (isNaN(taskId)) {
      return res.status(400).json({ message: 'Task ID must be a valid integer.' });
    }

    const [result] = await pool.execute(
      'DELETE FROM tasks WHERE id = ? AND user_id = ?',
      [taskId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    return res.status(200).json({ message: 'Task deleted successfully.' });
  } catch (error) {
    console.error('[deleteTask] Error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};
