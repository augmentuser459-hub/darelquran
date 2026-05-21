# Netlify Deployment Instructions

## Quick Deploy Steps

### Option 1: Drag & Drop (Easiest)
1. Go to https://app.netlify.com
2. Click "Add new site" → "Deploy manually"
3. Drag the entire `frontend` folder to the page
4. Done! Your site will be live in seconds

### Option 2: Git Integration (Recommended)
1. Push your code to GitHub
2. Connect Netlify to your GitHub repository
3. Set build settings:
   - **Base directory**: `frontend`
   - **Build command**: (leave empty)
   - **Publish directory**: `frontend`

## Configuration Files

This folder contains all necessary Netlify configuration:
- ✅ `netlify.toml` - Main configuration
- ✅ `_redirects` - SPA routing rules
- ✅ All static assets (HTML, CSS, JS, images)

## After Deployment

1. Your site will be available at: `https://your-site-name.netlify.app`
2. Test all features:
   - Login functionality
   - Data loading from Supabase
   - All pages (students, teachers, sessions, etc.)
3. Check browser console (F12) for any errors

## Supabase Configuration

The app is already configured to use Supabase:
- URL: `https://aixzmeuexuzipxrfkoqx.supabase.co`
- Configuration file: `js/supabase-config.js`

No additional environment variables needed!

## Troubleshooting

- **404 errors**: Check that `_redirects` file is present
- **No data loading**: Verify Supabase configuration in browser console
- **Images not showing**: Ensure all files in `frontend` folder are uploaded

---

For detailed Arabic instructions, see: `../NETLIFY_DEPLOYMENT_AR.md`
