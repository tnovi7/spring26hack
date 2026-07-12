# spring26hack
BAIUST CSE Spring Fest 2026 hackathon project

## Run the app

1. Activate the virtual environment: `source .venv-1/bin/activate`
2. Install dependencies if needed: `pip install django supabase`
3. Start the server: `python manage.py runserver`
4. Open `http://127.0.0.1:8000/`

## Optional Supabase setup

Set environment variables before starting the server:

```bash
export SUPABASE_URL='https://your-project.supabase.co'
export SUPABASE_KEY='your-public-anon-key'
```

The app is offline-capable with a service worker and uses dark aqua styling for the dashboard.
