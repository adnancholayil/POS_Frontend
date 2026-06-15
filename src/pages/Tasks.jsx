import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import {
  FiCheckSquare, FiPlus, FiClock, FiUser,
  FiArrowRight, FiCheckCircle, FiPlay, FiTrash2
} from 'react-icons/fi';
import { taskApi, staffApi } from '../api/services';
import { Modal, ConfirmDialog } from '../components/ui/Modal';
import { Input, Select, Textarea } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../hooks/useToast';
import { TASK_STATUS, TASK_PRIORITY, TASK_PRIORITY_COLORS } from '../utils/constants';

export const Tasks = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deleteTask, setDeleteTask] = useState(null);

  // Form
  const { register: registerAdd, handleSubmit: handleSubmitAdd, reset: resetAdd, formState: { errors: errorsAdd } } = useForm();

  // Queries
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => taskApi.getAll().then(res => res.data),
  });

  const { data: staff = [] } = useQuery({
    queryKey: ['staff'],
    queryFn: () => staffApi.getAll().then(res => res.data),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) => taskApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      addToast('Task created successfully', 'success');
      setIsAddOpen(false);
      resetAdd();
    },
    onError: () => addToast('Failed to create task', 'error'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => taskApi.updateStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      addToast('Task status updated', 'success');
    },
    onError: () => addToast('Failed to update task', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => taskApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      addToast('Task deleted successfully', 'success');
      setDeleteTask(null);
    },
    onError: () => addToast('Failed to delete task', 'error'),
  });

  const handleCreate = (data) => {
    createMutation.mutate(data);
  };

  // Group tasks by status
  const columnsData = {
    [TASK_STATUS.PENDING]:     tasks.filter(t => t.status === TASK_STATUS.PENDING),
    [TASK_STATUS.IN_PROGRESS]: tasks.filter(t => t.status === TASK_STATUS.IN_PROGRESS),
    [TASK_STATUS.COMPLETED]:   tasks.filter(t => t.status === TASK_STATUS.COMPLETED),
  };

  const columnLabels = {
    [TASK_STATUS.PENDING]:     'Backlog / To Do',
    [TASK_STATUS.IN_PROGRESS]: 'In Progress',
    [TASK_STATUS.COMPLETED]:   'Completed',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Tasks Manager</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Assign responsibilities, organize daily checklists, and trace execution status.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="primary" className="rounded-xl px-4 py-2 flex items-center gap-2 shadow-sm" onClick={() => setIsAddOpen(true)}>
            <FiPlus /> Create Task
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(c => <div key={c} className="h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        /* Kanban Columns Grid */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(columnsData).map(([status, colTasks]) => (
            <div key={status} className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800 rounded-2xl p-4 flex flex-col h-[70vh]">
              {/* Column header */}
              <div className="flex items-center justify-between mb-4 border-b border-slate-200 dark:border-slate-800 pb-2">
                <h3 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">{columnLabels[status]}</h3>
                <span className="text-xs font-extrabold px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full">{colTasks.length}</span>
              </div>

              {/* Task list wrapper */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {colTasks.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic text-center py-10">No tasks in this column</p>
                ) : (
                  colTasks.map(task => {
                    const assignedStaff = staff.find(s => s.id === task.assignedTo);
                    return (
                      <motion.div
                        key={task.id}
                        layoutId={task.id}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm space-y-3 relative group"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug">{task.title}</p>
                          <button
                            onClick={() => setDeleteTask(task)}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 text-red-500 transition-opacity"
                            title="Delete Task"
                          >
                            <FiTrash2 className="text-xs" />
                          </button>
                        </div>

                        {task.description && (
                          <p className="text-[11px] text-slate-400 truncate-2 leading-relaxed">{task.description}</p>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-2 border-slate-100 dark:border-slate-800">
                          {/* Assignee / Dates */}
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold">
                            <FiUser /> {assignedStaff ? assignedStaff.name : 'Unassigned'}
                          </div>

                          <Badge variant="custom" className={`${TASK_PRIORITY_COLORS[task.priority] || ''} text-[9px] uppercase font-bold`}>
                            {task.priority}
                          </Badge>
                        </div>

                        {/* Transitions buttons */}
                        <div className="flex justify-end gap-1.5 border-t pt-2 border-slate-100 dark:border-slate-800/40">
                          {task.status === TASK_STATUS.PENDING && (
                            <button
                              onClick={() => statusMutation.mutate({ id: task.id, status: TASK_STATUS.IN_PROGRESS })}
                              className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
                            >
                              Start <FiPlay className="text-[9px]" />
                            </button>
                          )}
                          {task.status === TASK_STATUS.IN_PROGRESS && (
                            <button
                              onClick={() => statusMutation.mutate({ id: task.id, status: TASK_STATUS.COMPLETED })}
                              className="text-[10px] font-bold text-green-600 dark:text-green-400 hover:underline flex items-center gap-0.5"
                            >
                              Complete <FiCheckCircle className="text-[9px]" />
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Task Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Create Shop Task" size="md">
        <form onSubmit={handleSubmitAdd(handleCreate)} className="p-6 space-y-4">
          <Input
            label="Task Summary / Title"
            placeholder="e.g. Replenish Type-C cables inventory"
            error={errorsAdd.title?.message}
            required
            {...registerAdd('title', { required: 'Title is required' })}
          />

          <Textarea
            label="Detailed Task Description"
            placeholder="Log specific requirements, checklist items, or repair details..."
            {...registerAdd('description')}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Assigned Employee"
              options={staff.map(s => ({ value: s.id, label: s.name }))}
              placeholder="-- Choose Staff --"
              error={errorsAdd.assignedTo?.message}
              required
              {...registerAdd('assignedTo', { required: 'Please assign to staff' })}
            />
            <Select
              label="Priority level"
              options={Object.entries(TASK_PRIORITY).map(([k, v]) => ({ value: v, label: k }))}
              error={errorsAdd.priority?.message}
              required
              {...registerAdd('priority', { required: 'Priority is required' })}
            />
            <Input
              label="Due Date"
              type="date"
              error={errorsAdd.dueDate?.message}
              required
              {...registerAdd('dueDate', { required: 'Due date is required' })}
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" className="rounded-xl px-5" onClick={() => setIsAddOpen(false)} type="button">Cancel</Button>
            <Button type="submit" variant="primary" className="rounded-xl px-5" loading={createMutation.isPending}>Create Task</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTask}
        onClose={() => setDeleteTask(null)}
        onConfirm={() => deleteMutation.mutate(deleteTask.id)}
        title="Delete Task"
        message={`Are you sure you want to delete "${deleteTask?.title}"?`}
        loading={deleteMutation.isPending}
      />
    </div>
  );
};
export default Tasks;
