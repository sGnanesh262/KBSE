<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1v-v_intiAUgMkx0QFRUuVffDxnDFq0GK

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Configure credentials (recommended: use a service account)

   - Copy `.env.example` to `.env.local` and update values:

     - `GEMINI_API_KEY` (optional)
     - `GOOGLE_APPLICATION_CREDENTIALS` (recommended): absolute path to your service-account JSON key, e.g. `D:/KBSA/keys/gcloud-sa.json`

   - Example `.env.local`:

     ```text
     GEMINI_API_KEY=your_gemini_api_key_here
     GOOGLE_APPLICATION_CREDENTIALS=D:/KBSA/keys/gcloud-sa.json
     ```

   - Make sure the service-account JSON file exists at the path you provided.

3. Run the app:
   `npm run dev`

PowerShell tip (temporary env for current shell):

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS = 'D:\KBSA\keys\gcloud-sa.json'
$env:GEMINI_API_KEY = 'your_gemini_api_key_here'
npm run dev
```

Security notes:

- Do NOT commit `.env.local` or service account JSON to version control. Add them to `.gitignore`.
- If any key has been exposed, revoke it immediately and create new credentials.

