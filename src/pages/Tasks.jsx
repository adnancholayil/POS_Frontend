import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiCheckSquare, FiPlus, FiUser,
  FiCheckCircle, FiPlay, FiTrash2, FiCalendar, FiFlag, FiAlertCircle
} from 'react-icons/fi';
import { taskApi, staffApi } from '../api/services';
import { Modal, ConfirmDialog } from '../components/ui/Modal';
import { Input, Textarea } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../hooks/useToast';
import { TASK_STATUS, TASK_PRIORITY, TASK_PRIORITY_COLORS } from '../utils/constants';

const COLUMN_CONFIG = [
  { key: TASK_STATUS.PENDING,     label: 'To Do',       color: 'bg-slate-400', dot: 'bg-slate-400' },
  { key: TASK_STATUS.IN_PROGRESS, label: 'In Progress', color: 'bg-blue-500',  dot: 'bg-blue-500'  },
  { key: TASK_STATUS.COMPLETED,   label: 'Completed',   color: 'bg-green-500', dot: 'bg-green-500' },
];

export const Tasks = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deleteTask, setDeleteTask] = useState(null);

  const [draggingTaskId, setDraggingTaskId] = useState(null);
  const [activeDropCol, setActiveDropCol] = useState(null);

  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('text/plain', taskId);
    setDraggingTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    // Save current query tasks order to localStorage
    const currentTasks = queryClient.getQueryData(['tasks']) || [];
    const orderIds = currentTasks.map(t => t.id);
    localStorage.setItem('tasks_order', JSON.stringify(orderIds));

    setDraggingTaskId(null);
    setActiveDropCol(null);
  };

  const handleDragOver = (e, columnKey) => {
    e.preventDefault();
    if (activeDropCol !== columnKey) {
      setActiveDropCol(columnKey);
    }

    // If dragging over a column that has no tasks, auto-move the task to this column in the cache
    if (draggingTaskId) {
      queryClient.setQueryData(['tasks'], (old) => {
        if (!old) return [];
        const draggedTask = old.find(t => t.id === draggingTaskId);
        if (draggedTask && draggedTask.status !== columnKey) {
          const columnTasks = old.filter(t => t.status === columnKey);
          if (columnTasks.length === 0) {
            return old.map(t => t.id === draggingTaskId ? { ...t, status: columnKey } : t);
          }
        }
        return old;
      });
    }
  };

  const handleDragOverCard = (e, targetTask) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggingTaskId || draggingTaskId === targetTask.id) return;

    queryClient.setQueryData(['tasks'], (old) => {
      if (!old) return [];

      const list = [...old];
      const draggedIdx = list.findIndex(t => t.id === draggingTaskId);
      const targetIdx = list.findIndex(t => t.id === targetTask.id);

      if (draggedIdx === -1 || targetIdx === -1) return old;

      const draggedTask = { ...list[draggedIdx] };

      // Update status if they are in different columns
      if (draggedTask.status !== targetTask.status) {
        draggedTask.status = targetTask.status;
      }

      // Reorder
      list.splice(draggedIdx, 1);
      list.splice(targetIdx, 0, draggedTask);

      return list;
    });
  };

  const handleDragLeave = (e, columnKey) => {
    e.preventDefault();
    if (activeDropCol === columnKey) {
      setActiveDropCol(null);
    }
  };

  const handleDrop = (e, columnKey) => {
    e.preventDefault();
    setActiveDropCol(null);
    const taskId = e.dataTransfer.getData('text/plain') || draggingTaskId;
    if (!taskId) return;

    const task = tasks.find(t => t.id === taskId);
    if (task && task.status !== columnKey) {
      statusMutation.mutate({ id: taskId, status: columnKey });
    } else {
      // Just save the new sorting order
      const currentTasks = queryClient.getQueryData(['tasks']) || [];
      const orderIds = currentTasks.map(t => t.id);
      localStorage.setItem('tasks_order', JSON.stringify(orderIds));
    }
  };

  const {
    register: reg,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
  } = useForm({
    defaultValues: { title: '', description: '', assignedTo: '', priority: 'normal', dueDate: '' }
  });

  // ── Queries ──────────────────────────────────────────────────
  const { data: tasks = [], isLoading, error: tasksError } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => taskApi.getAll().then(r => r.data),
    retry: 1,
  });

  const sortedTasks = React.useMemo(() => {
    const savedOrder = localStorage.getItem('tasks_order');
    if (!savedOrder) return tasks;
    try {
      const orderIds = JSON.parse(savedOrder);
      const taskMap = new Map(tasks.map((t) => [t.id, t]));

      const sorted = [];
      orderIds.forEach((id) => {
        if (taskMap.has(id)) {
          sorted.push(taskMap.get(id));
          taskMap.delete(id);
        }
      });
      taskMap.forEach((task) => sorted.push(task));
      return sorted;
    } catch (e) {
      return tasks;
    }
  }, [tasks]);

  const { data: staff = [], isLoading: staffLoading } = useQuery({
    queryKey: ['staff'],
    queryFn: () => staffApi.getAll().then(r => r.data),
    retry: 1,
  });

  // ── Mutations ────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (data) => taskApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      addToast('Task created successfully!', 'success');
      setIsAddOpen(false);
      reset();
    },
    onError: (err) => {
      // axiosInstance normalizes error: err IS already the response body { message, errors }
      const msg = err?.message || 'Failed to create task';
      const details = err?.errors;
      if (Array.isArray(details) && details.length > 0) {
        addToast(`${msg}: ${details.map(d => d.message).join(', ')}`, 'error');
      } else {
        addToast(msg, 'error');
      }
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => taskApi.updateStatus(id, { status }),
    onMutate: async ({ id, status }) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['tasks'] });

      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData(['tasks']);

      // Optimistically update to the new value
      queryClient.setQueryData(['tasks'], (old) => {
        if (!old) return [];
        return old.map((t) => (t.id === id ? { ...t, status } : t));
      });

      // Return a context object with the snapshotted value
      return { previousTasks };
    },
    onError: (err, newTodo, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks);
      }
      addToast(err?.message || 'Failed to update status', 'error');
    },
    onSuccess: () => {
      addToast('Task status updated', 'success');
    },
    onSettled: () => {
      // Always refetch after success or error to ensure server sync
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => taskApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      addToast('Task deleted', 'success');
      setDeleteTask(null);
    },
    onError: () => addToast('Failed to delete task', 'error'),
  });

  const onSubmit = (data) => {
    createMutation.mutate(data);
  };

  // ── Group tasks by status ─────────────────────────────────────
  const grouped = COLUMN_CONFIG.reduce((acc, col) => {
    acc[col.key] = sortedTasks.filter(t => t.status === col.key);
    return acc;
  }, {});

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <FiCheckSquare className="text-blue-500" /> Tasks Manager
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Assign, track and complete shop tasks across your team.
          </p>
        </div>
        <Button
          variant="primary"
          className="rounded-xl px-4 py-2 flex items-center gap-2 shadow-sm"
          onClick={() => setIsAddOpen(true)}
        >
          <FiPlus /> Create Task
        </Button>
      </div>

      {/* ─── Error banner ─── */}
      {tasksError && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
          <FiAlertCircle /> Failed to load tasks: {tasksError?.response?.data?.message || tasksError.message}
        </div>
      )}

      {/* ─── Kanban ─── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {COLUMN_CONFIG.map(col => {
            const colTasks = grouped[col.key] || [];
            return (
              <div
                key={col.key}
                onDragOver={(e) => handleDragOver(e, col.key)}
                onDragLeave={(e) => handleDragLeave(e, col.key)}
                onDrop={(e) => handleDrop(e, col.key)}
                className={`bg-slate-50 dark:bg-slate-900/40 border rounded-2xl p-4 flex flex-col h-[72vh] transition-all duration-300 ${
                  activeDropCol === col.key
                    ? 'border-blue-500/50 bg-blue-500/5 dark:bg-blue-500/10 ring-2 ring-blue-500/20'
                    : 'border-slate-200/60 dark:border-slate-800'
                }`}
              >
                {/* Column header */}
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                    <h3 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      {col.label}
                    </h3>
                  </div>
                  <span className="text-xs font-extrabold px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full">
                    {colTasks.length}
                  </span>
                </div>

                {/* Task cards */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {colTasks.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic text-center py-10">No tasks here</p>
                  ) : (
                    <AnimatePresence>
                      {colTasks.map(task => (
                        <motion.div
                          key={task.id}
                          layout
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task.id)}
                          onDragEnd={handleDragEnd}
                          onDragOver={(e) => handleDragOverCard(e, task)}
                          className={`bg-white dark:bg-slate-900 border p-4 rounded-xl shadow-sm space-y-3 relative group transition-all duration-200 cursor-grab active:cursor-grabbing ${
                            draggingTaskId === task.id
                              ? 'opacity-40 border-dashed border-blue-500/70 scale-95 shadow-none'
                              : 'border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          {/* Title + delete */}
                          <div className={`flex justify-between items-start gap-2 ${draggingTaskId ? 'pointer-events-none' : ''}`}>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug flex-1">
                              {task.title}
                            </p>
                            <button
                              onClick={() => setDeleteTask(task)}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 hover:text-red-600 transition-all flex-shrink-0"
                              title="Delete task"
                            >
                              <FiTrash2 className="text-sm" />
                            </button>
                          </div>

                          {task.description && (
                            <p className={`text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed line-clamp-2 ${draggingTaskId ? 'pointer-events-none' : ''}`}>
                              {task.description}
                            </p>
                          )}

                          {/* Meta row */}
                          <div className={`flex flex-wrap items-center justify-between gap-2 border-t pt-2 border-slate-100 dark:border-slate-800 ${draggingTaskId ? 'pointer-events-none' : ''}`}>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                              <FiUser className="flex-shrink-0" />
                              {/* Use assignedToName from normalized task (set from backend populate) */}
                              {task.assignedToName || staff.find(s => s.id === task.assignedTo)?.name || 'Unassigned'}
                            </div>

                            {task.dueDate && (
                              <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                                <FiCalendar className="flex-shrink-0" />
                                {new Date(task.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                              </div>
                            )}

                            <Badge
                              variant="custom"
                              className={`${TASK_PRIORITY_COLORS[task.priority] || 'bg-slate-100 text-slate-600'} text-[9px] uppercase font-bold flex items-center gap-0.5`}
                            >
                              <FiFlag className="text-[8px]" /> {task.priority}
                            </Badge>
                          </div>

                          {/* Action buttons */}
                          <div className={`flex justify-end gap-2 border-t pt-2 border-slate-100 dark:border-slate-800/40 ${draggingTaskId ? 'pointer-events-none' : ''}`}>
                            {task.status === TASK_STATUS.PENDING && (
                              <button
                                onClick={() => statusMutation.mutate({ id: task.id, status: TASK_STATUS.IN_PROGRESS })}
                                disabled={statusMutation.isPending}
                                className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 disabled:opacity-50"
                              >
                                <FiPlay className="text-[9px]" /> Start
                              </button>
                            )}
                            {task.status === TASK_STATUS.IN_PROGRESS && (
                              <button
                                onClick={() => statusMutation.mutate({ id: task.id, status: TASK_STATUS.COMPLETED })}
                                disabled={statusMutation.isPending}
                                className="text-[10px] font-bold text-green-600 dark:text-green-400 hover:underline flex items-center gap-1 disabled:opacity-50"
                              >
                                <FiCheckCircle className="text-[9px]" /> Complete
                              </button>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Create Task Modal ─── */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => { setIsAddOpen(false); reset(); }}
        title="Create New Task"
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Title */}
          <Input
            label="Task Title"
            placeholder="e.g. Replenish Type-C cable stock"
            error={errors.title?.message}
            required
            {...reg('title', { required: 'Task title is required' })}
          />

          {/* Description */}
          <Textarea
            label="Description (optional)"
            placeholder="Describe what needs to be done..."
            rows={2}
            {...reg('description')}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Assigned To */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                Assign To <span className="text-red-500">*</span>
              </label>
              <select
                className={`w-full bg-white dark:bg-slate-800 border rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-100 outline-none transition-all cursor-pointer focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 ${errors.assignedTo ? 'border-red-400' : 'border-slate-200 dark:border-slate-700'}`}
                {...reg('assignedTo', { required: 'Please select a staff member', validate: v => v !== '' || 'Please select a staff member' })}
              >
                <option value="">
                  {staffLoading ? 'Loading staff...' : staff.length === 0 ? 'No staff available' : '-- Select Staff --'}
                </option>
                {staff.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.role})
                  </option>
                ))}
              </select>
              {errors.assignedTo && <p className="text-xs text-red-500 font-medium">{errors.assignedTo.message}</p>}
            </div>

            {/* Priority */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                Priority <span className="text-red-500">*</span>
              </label>
              <select
                className={`w-full bg-white dark:bg-slate-800 border rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-100 outline-none transition-all cursor-pointer focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 ${errors.priority ? 'border-red-400' : 'border-slate-200 dark:border-slate-700'}`}
                {...reg('priority', { required: 'Priority is required' })}
              >
                {Object.entries(TASK_PRIORITY).map(([k, v]) => (
                  <option key={v} value={v}>{k.charAt(0) + k.slice(1).toLowerCase()}</option>
                ))}
              </select>
              {errors.priority && <p className="text-xs text-red-500 font-medium">{errors.priority.message}</p>}
            </div>

            {/* Due Date */}
            <Input
              label="Due Date"
              type="date"
              min={today}
              error={errors.dueDate?.message}
              required
              {...reg('dueDate', { required: 'Due date is required' })}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="secondary"
              className="rounded-xl px-5"
              type="button"
              onClick={() => { setIsAddOpen(false); reset(); }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="rounded-xl px-5"
              loading={createMutation.isPending}
              disabled={staffLoading || staff.length === 0}
            >
              {staff.length === 0 ? 'No Staff Available' : 'Create Task'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ─── Delete Confirm ─── */}
      <ConfirmDialog
        isOpen={!!deleteTask}
        onClose={() => setDeleteTask(null)}
        onConfirm={() => deleteMutation.mutate(deleteTask.id)}
        title="Delete Task"
        message={`Delete "${deleteTask?.title}"? This cannot be undone.`}
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

export default Tasks;
