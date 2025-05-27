### 🛠 Setup & Development Guide for the Backend
### Welcome to the Save n Bite backend project! This document will help you install everything needed to run and contribute to the Django + PostgreSQL application.

🚀 Step-by-Step Installation Instructions
### 1. Install Prerequisites
✅ Python 3.10 (Python 3.10 is generally more compatible)
- Download and install from: https://www.python.org/downloads/
- Add python to your system path

Ensure it's installed properly:
```
python --version
```
✅ PostgreSQL
Download and install from: https://www.postgresql.org/download/

During setup:
-Set a password for the default user postgres
-Remember the port (usually 5432)
-Keep the install directory noted (e.g., C:\Program Files\PostgreSQL\17)

After installation:
-Add PostgreSQL's bin folder to your system PATH (e.g., C:\Program Files\PostgreSQL\17\bin)
-Confirm it works:
```
psql -U postgres
```
✅ Poetry (Python dependency manager)
```
pip install poetry
OR (Invoke-WebRequest -Uri https://install.python-poetry.org -UseBasicParsing).Content | python -
(The second option is more reliable)
```
### 2. Clone the Repository
```
git clone <your-repo-url>
cd <repo-folder>
```
### 3. Create and Activate the Virtual Environment
```
poetry install
poetry env activate
```
### 4. Set Up the Database
**Note I have already created a db with a password and all so we just need to get it onto Azure and then we can all share the db (the password for postgreSQL db is in backend/settings.py -> in the DATABASES section**

Open psql:
```
psql -U postgres
```
Then create the database:
```
CREATE DATABASE savenbite_db;
```
### 5. Configure the .env File
Create a .env file in the root directory (if it doesn’t exist) with:
```
SECRET_KEY=your_django_secret_key_here
DEBUG=True
DB_NAME=savenbite_db
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_HOST=localhost
DB_PORT=5432
```
### 6. Apply Migrations and Start the Server
```
python manage.py migrate
python manage.py runserver
```
Visit http://127.0.0.1:8000 to see the site running!

📁 Project Structure Explanation
.
├── assets/               # Frontend or static files (if any)
├── backend/              # Core Django backend
│   ├── __init__.py       # Marks this as a Python package
│   ├── asgi.py           # For async deployment (e.g., Daphne/Uvicorn)
│   ├── settings.py       # Main configuration file (db, apps, etc.)
│   ├── urls.py           # URL routing definitions
│   ├── wsgi.py           # WSGI entry point for production servers
├── documentation/        # Project documentation files
├── .env                  # Environment variables (should not be committed)
├── .gitignore            # Specifies untracked files to ignore in Git
├── manage.py             # Django CLI tool (like npm scripts for Django)
├── poetry.lock           # Locked versions of all dependencies
├── pyproject.toml        # Project config (like package.json)
└── README.md             # Project overview and metadata

### 🧪 Where to Develop & Test

➕ Adding New Features!!!!!!!!!!!!!!
Create a new Django app inside backend/:
```
python manage.py startapp myfeature
```
This command automatically creates the correct structure and essential files for a Django app, which would be a pain to set up manually.

**🔍 What Happens When You Run That Command?**
creates a folder like this inside your project:
myfeature/
├── __init__.py          # Makes this a Python package
├── admin.py             # Admin site config
├── apps.py              # App config for Django
├── models.py            # Database models (tables)
├── tests.py             # Unit tests
├── views.py             # Views (functions or classes handling requests)
├── migrations/          # Database migration files
│   └── __init__.py
You can then add additional files like:
-serializers.py (if you're using Django REST Framework),
-urls.py (for routing specific to this app),
-permissions.py, etc.


-Add the app to INSTALLED_APPS in backend/settings.py.
-Write your views, models, serializers, and routes inside the new app.

✅ Unit Testing
Write your tests inside the app’s tests.py file or a tests/ subfolder.

Run all tests:
```
python manage.py test
```

👥 Collaboration Tips
-Use Git branches per feature.
-Follow Django’s app structure.
-Use .env for secrets (never hardcode!).
-Keep documentation updated inside documentation/.

📞 Getting Help
If something doesn’t work:
-Double-check the .env and database setup.
-Ask in the team chat or raise a GitHub issue.
-Use logs and poetry run python manage.py runserver to debug.