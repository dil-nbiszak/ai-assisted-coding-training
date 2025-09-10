import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { useTodo } from '../../hooks/useTodo';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
// Todo type is used in the context, no need to import it directly here

interface TodoModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  initialValues?: {
    id: string;
    title: string;
    description: string;
    completed: boolean;
    dueDate?: string;
  };
}

export const TodoModal: React.FC<TodoModalProps> = ({
  isOpen,
  onClose,
  mode = 'create',
  initialValues,
}) => {
  const { addTodo, editTodo } = useTodo();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [completed, setCompleted] = useState(false);
  const [titleError, setTitleError] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);

  // Reset form or load values when modal opens
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && initialValues) {
        setTitle(initialValues.title);
        setDescription(initialValues.description);
        setCompleted(initialValues.completed);
      } else {
        setTitle('');
        setDescription('');
        setCompleted(false);
      }
      if (mode === 'edit' && initialValues?.dueDate) {
        const parsed = new Date(initialValues.dueDate);
        setDueDate(isNaN(parsed.getTime()) ? null : parsed);
      } else {
        setDueDate(null);
      }
      setTitleError('');
    }
  }, [isOpen, mode, initialValues]);

  const validateForm = () => {
    if (!title.trim()) {
      setTitleError('Title is required');
      return false;
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const dueDateStr = dueDate ? format(dueDate, 'yyyy-MM-dd') : undefined;
    if (mode === 'create') {
      if (dueDateStr === undefined) {
        addTodo(title.trim(), description.trim());
      } else {
        addTodo(title.trim(), description.trim(), dueDateStr);
      }
    } else if (mode === 'edit' && initialValues) {
      const updates: { title: string; description: string; completed: boolean; dueDate?: string } =
        {
          title: title.trim(),
          description: description.trim(),
          completed,
        };
      if (dueDateStr !== undefined) {
        updates.dueDate = dueDateStr;
      }
      editTodo(initialValues.id, updates);
    }
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="todo-dialog-title"
    >
      <DialogTitle id="todo-dialog-title">
        {mode === 'create' ? 'Create Todo' : 'Edit Todo'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Title"
              value={title}
              onChange={e => {
                setTitle(e.target.value);
                if (e.target.value.trim()) setTitleError('');
              }}
              fullWidth
              required
              error={!!titleError}
              helperText={titleError}
              autoFocus
              inputProps={
                { 'data-testid': 'title-input' } as React.InputHTMLAttributes<HTMLInputElement>
              }
            />
            <TextField
              label="Description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              fullWidth
              multiline
              rows={4}
              inputProps={
                {
                  'data-testid': 'description-input',
                } as React.InputHTMLAttributes<HTMLInputElement>
              }
            />
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Due date (optional)"
                value={dueDate}
                onChange={setDueDate}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    inputProps: {
                      'data-testid': 'due-date-input',
                    } as React.InputHTMLAttributes<HTMLInputElement>,
                  },
                }}
                views={['year', 'month', 'day']}
                format="yyyy-MM-dd"
                disablePast={false}
              />
            </LocalizationProvider>
            {mode === 'edit' && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={completed}
                    onChange={e => setCompleted(e.target.checked)}
                    inputProps={
                      {
                        'data-testid': 'completed-checkbox',
                      } as React.InputHTMLAttributes<HTMLInputElement>
                    }
                  />
                }
                label="Mark as completed"
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" color="primary" data-testid="submit-button">
            {mode === 'create' ? 'Create' : 'Save'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
