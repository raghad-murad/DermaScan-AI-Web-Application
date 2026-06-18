# scripts/

One-time admin scripts. Not part of the Vite build — run directly with Node.

## seed-admin.cjs

Creates the first admin user: a Firebase Auth account plus a matching
`users/{uid}` Firestore profile document with `role: "admin"`.

### Setup

1. Download your Firebase project's service account key (Firebase Console →
   Project Settings → Service Accounts → Generate new private key) and place
   it in this folder, renamed to `serviceAccountKey.json`.
2. Open `seed-admin.cjs` and replace the placeholders with real values:
   - `ADMIN_EMAIL_HERE`
   - `ADMIN_PASSWORD_HERE`
   - `ADMIN_FULL_NAME_HERE`
3. Install `firebase-admin` if it isn't already installed:
   ```
   npm install firebase-admin --save-dev
   ```

### Run

```
node scripts/seed-admin.cjs
```

### After running

Delete or move `serviceAccountKey.json` out of the project. It grants full
admin access to your Firebase project and must never be committed or left
lying around (it's gitignored, but treat it as a secret regardless).
