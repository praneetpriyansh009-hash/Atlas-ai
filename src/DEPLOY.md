# <center>🚀 Deploying ATLAS to the Web</center>

Your application is now fully restructured for professional deployment. Follow these steps to get it online for free.

## Option 1: Vercel (Recommended)

1.  **Push to GitHub** (if you haven't already):
    - Create a new repository on GitHub.
    - Upload all files in this `Atlas` folder to it.

2.  **Import to Vercel**:
    - Go to [vercel.com](https://vercel.com) and sign up/login.
    - Click **"Add New Project"**.
    - Select your GitHub repository.

3.  **Configure Project**:
    - Framework Preset: **Vite** (should be auto-detected).
    - **Environment Variables**:
        - Click the "Environment Variables" section.
        - Add `VITE_GEMINI_API_KEY`
        - Value: `AIzaSyAM5J2k_856pUW2e86euCTvC1oj8Yt1Jzs` (Or get a fresh key from Google AI Studio).

4.  **Deploy**:
    - Click **"Deploy"**.
    - Wait about 1 minute.
    - **Done!** Your app is now live at `https://your-project-name.vercel.app`.

## Option 2: Netlify

1.  Go to [app.netlify.com](https://app.netlify.com).
2.  Click **"Add new site"** -> **"Import from existing project"** -> **GitHub**.
3.  Select your repo.
4.  Build command: `vite build` (Netlify usually detects this).
5.  Publish directory: `dist`.
6.  **Advanced** -> **New Variable**:
    - Key: `VITE_GEMINI_API_KEY`
    - Value: `Your API Key`.
7.  Click **"Deploy site"**.

## Local Development (Optional)
If you ever fix your `npm` installation:
1.  Run `npm install`
2.  Run `npm run dev`
