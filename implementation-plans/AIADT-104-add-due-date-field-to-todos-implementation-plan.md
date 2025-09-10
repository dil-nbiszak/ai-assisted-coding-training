# AIADT-104 — Add Due Date field to todos (Implementation Plan)

## Objective

Add an optional `dueDate` to todos so users can set and view deadlines. Show the due date in the list and allow editing/removal. Keep legacy behavior for todos without a due date. No backend/API work.

## Non-goals

- Notifications, calendar sync, auto-sorting, or backend persistence.
- Complex timezone normalization beyond formatting in the user’s locale.

## Architecture / Design Overview

- Extend domain type `Todo` with `dueDate?: string` (ISO 8601 date-only `YYYY-MM-DD`).
- Use `@mui/x-date-pickers` DatePicker in the modal to create/edit the date.
- Wrap the app with `LocalizationProvider` using `AdapterDateFns`.
- Treat missing/malformed `dueDate` as `undefined`.
- Render due date in `TodoItem` formatted via date-fns `format(date, 'PP')` and show in error color if overdue.
- Persistence note: current app does not persist todos; compatibility clause about legacy storage is N/A now.

## Data / Schema Changes

- `src/types/Todo.ts`: add `dueDate?: string`.
- No DB/migration (client-only state). If storage is added later, store `dueDate` as `YYYY-MM-DD`.

## External Integrations / Dependencies

- Add packages: `@mui/x-date-pickers`, `date-fns`.
- Use `LocalizationProvider` + `AdapterDateFns`.

Install (choose your package manager):

```bash
# npm
npm i @mui/x-date-pickers date-fns

# or pnpm
pnpm add @mui/x-date-pickers date-fns
```

## Detailed Steps (file-by-file)

1. `src/types/Todo.ts`

- Add `dueDate?: string` to the interface.

2. `src/contexts/TodoContextType.ts`

- Types only: Methods signatures remain, but `editTodo` already accepts `Partial<Todo>` so no change needed.

3. `src/contexts/TodoContext.tsx`

- When creating a new todo in `addTodo`, accept an optional `dueDate?: string` parameter; update calls accordingly.
- Ensure `editTodo` merges `dueDate` updates.
- Validation rule: Only accept `dueDate` if it matches `/^\d{4}-\d{2}-\d{2}$/` and `!isNaN(new Date(value).getTime())`; otherwise set `undefined`.

4. `src/components/TodoModal/TodoModal.tsx`

- Import DatePicker and related components from `@mui/x-date-pickers`.
- Local state: add `dueDate: Date | null`.
- Initialize on open:
  - In create mode: `null`.
  - In edit mode: parse `initialValues?.dueDate` if present (e.g., `new Date(initialValues.dueDate)` when valid), else `null`.
- On submit:
  - Convert `dueDate` (Date | null) to ISO date-only string with date-fns: `format(dueDate, 'yyyy-MM-dd')` or `undefined` if null/invalid.
  - Pass to `addTodo(title, description, dueDateStr)` or merge into `editTodo(id, { ..., dueDate: dueDateStr })`.
- Add a clear action: either use a clearable DatePicker or a small “Clear” button that sets `dueDate` to `null`.
- Validation: Title required (already). Do not block on invalid date; treat invalid as undefined.
- Update `TodoModalProps.initialValues` type to optionally include `dueDate?: string`.

5. `src/components/TodoList/TodoItem.tsx`

- Import `format` from `date-fns` and `Typography` color helpers.
- Compute a `displayDueDate` when `todo.dueDate` present: `format(new Date(todo.dueDate), 'PP')` if valid.
- Determine overdue: `new Date(todo.dueDate) < startOfDay(new Date())`.
- Render a secondary line below description showing the due date, styled with error color when overdue.

6. `src/App.tsx`

- Wrap the app children with `LocalizationProvider` using `AdapterDateFns`.
- Example (conceptual):
  - `import { LocalizationProvider } from '@mui/x-date-pickers';`
  - `import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';`
  - `<LocalizationProvider dateAdapter={AdapterDateFns}> ...existing providers... </LocalizationProvider>`

7. Tests (`src/__tests__`)

- Update `TodoModal.test.tsx` to cover:
  - Rendering DatePicker input.
  - Creating a todo with a date set and without.
  - Editing to set/change/clear the date.
  - Ensure mocks for `useTodo` capture `dueDate` in arguments.
- Update `TodoItem.test.tsx`:
  - Render todo with `dueDate` and verify formatted text is present.
  - Render overdue date and verify color class or test id indicating error color (can verify presence of text plus add a test id for styling assertion if needed).
- Context tests:
  - If `addTodo` signature is extended, adjust helper component in tests or mock hook usage accordingly.

## Feature Flags / Config

- None required.

## Telemetry / Monitoring

- None required.

## Risks / Edge Cases / Rollback

- Time zones: Using date-only `YYYY-MM-DD` avoids most TZ issues; formatting uses local TZ.
- Malformed dates: Treat as `undefined`.
- Overdue definition uses local system date at start of day; acceptable per scope.
- Rollback: Revert changes and remove dependencies; todos without `dueDate` remain unaffected.

## Acceptance Criteria Mapping

- Optional date on create: DatePicker in create mode; `dueDate` may be omitted.
- Existing todos without date unaffected: Default `undefined` and UI hides date line.
- Edit shows current date and allows change/removal: Initialize from `initialValues.dueDate`; include clear action.
- Due date shows in list: `TodoItem` renders formatted date.
- Validation prevents clearly invalid dates: Invalid inputs become `undefined` before save.
- Persistence after refresh (if any): N/A currently (no storage); future storage must serialize as `YYYY-MM-DD` and accept legacy without field.
- Tests updated: Add/modify unit tests as listed above.

## Step-by-step Task List (for an AI agent)

1. Install dependencies: `@mui/x-date-pickers` and `date-fns`.
2. Edit `src/types/Todo.ts` to add `dueDate?: string`.
3. Update `src/contexts/TodoContext.tsx`:
   - Extend `addTodo` to accept optional `dueDate`.
   - Sanitize/validate `dueDate` on create/edit.
4. Update `src/components/TodoModal/TodoModal.tsx`:
   - Add DatePicker field with clear option, state, and conversion to `YYYY-MM-DD` on submit.
   - Include `dueDate` in `initialValues` support.
5. Update `src/components/TodoList/TodoItem.tsx` to display formatted date and overdue color.
6. Update `src/App.tsx` to wrap with `LocalizationProvider` (AdapterDateFns).
7. Update tests in `src/__tests__` for modal, item, and (if needed) context.
8. Run tests: `npm test` (or `pnpm test`) and fix any failures.

---

Notes:

- Prefer ISO date-only `YYYY-MM-DD` for storage and logic simplicity.
- Keep UI tolerant: absence or malformed date → hidden/ignored, not an error state.
