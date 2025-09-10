import React, { useState } from 'react';
import type { Todo } from '../types/Todo';
import { v4 as uuidv4 } from 'uuid';
import { TodoContext } from './TodoContextType';

export const TodoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [todos, setTodos] = useState<Todo[]>([]);

  const isValidDateOnly = (value: string | undefined): value is string => {
    if (!value) return false;
    const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateOnlyRegex.test(value)) return false;
    const d = new Date(value);
    return !isNaN(d.getTime());
  };

  const addTodo = (title: string, description: string, dueDate?: string) => {
    const normalizedDueDate = isValidDateOnly(dueDate) ? dueDate : undefined;
    const newTodo: Todo = {
      id: uuidv4(),
      title,
      description,
      completed: false,
      createdAt: new Date(),
      dueDate: normalizedDueDate,
    };
    setTodos([...todos, newTodo]);
  };

  const editTodo = (id: string, updates: Partial<Todo>) => {
    const normalizedUpdates: Partial<Todo> = {
      ...updates,
      dueDate:
        updates.dueDate && isValidDateOnly(updates.dueDate)
          ? updates.dueDate
          : updates.dueDate
            ? undefined
            : updates.dueDate,
    };
    setTodos(todos.map(todo => (todo.id === id ? { ...todo, ...normalizedUpdates } : todo)));
  };

  const toggleTodoCompletion = (id: string) => {
    setTodos(todos.map(todo => (todo.id === id ? { ...todo, completed: !todo.completed } : todo)));
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  return (
    <TodoContext.Provider value={{ todos, addTodo, editTodo, toggleTodoCompletion, deleteTodo }}>
      {children}
    </TodoContext.Provider>
  );
};

// No re-exports to avoid react-refresh/only-export-components error
