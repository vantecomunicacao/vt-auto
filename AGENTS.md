<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:ui-conventions -->

## UI & Form Conventions

### Unsaved Changes Warning

Every admin page that has an editable form **must** use the `useUnsavedChanges` hook (`hooks/useUnsavedChanges.ts`).

Pattern to follow (see `app/admin/(protected)/settings/SettingsContent.tsx` as reference):

1. Keep a "saved" mirror of each form state: `const [savedX, setSavedX] = useState(initialX)`
2. After data loads, set both the form state and the saved mirror to the loaded values
3. Call the hook: `const { isDirty: xDirty } = useUnsavedChanges(x, savedX)`
4. After a successful save, update the saved mirror: `setSavedX(x)`
5. Show the warning banner when `isDirty` is true:
   ```tsx
   {isDirty && (
     <div className="flex items-center gap-2.5 mb-4 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm">
       <AlertCircle size={15} className="shrink-0" />
       <span className="font-medium">Você tem alterações não salvas.</span>
     </div>
   )}
   ```
6. The hook automatically blocks browser refresh/tab-close via `beforeunload` when dirty.
<!-- END:ui-conventions -->
