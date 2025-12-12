# HomeDar

## Project Overview
Full-stack e-commerce application with Django REST Framework backend and React frontend, featuring product catalog with categories, sub-categories, and contact functionality.

## Project Structure

```
HomeDar/
├── backend/              # Django REST Framework backend
│   ├── .env.example      # Backend environment variables template
│   └── ...
├── frontend/             # React frontend
│   ├── .env.example      # Frontend environment variables template
│   └── ...
├── .gitignore           # Git ignore rules
├── .env.example         # Root environment variables template
└── README.md            # This file
```

## Virtual Environment Directory Structure

### Backend Virtual Environment
The backend uses Python virtual environments. Recommended structure:

```
backend/
├── venv/                 # Virtual environment (not tracked in git)
│   ├── bin/              # Executables (Linux/Mac)
│   ├── lib/              # Python packages
│   └── include/          # Header files
├── .env                  # Environment variables (not tracked in git)
├── .env.example          # Environment variables template
├── requirements.txt      # Python dependencies
└── ...
```

**Setup Instructions:**
1. Navigate to `backend/` directory
2. Create virtual environment:
   ```bash
   python3 -m venv venv
   ```
   or
   ```bash
   python3 -m venv .venv
   ```
3. Activate virtual environment:
   - Linux/Mac: `source venv/bin/activate`
   - Windows: `venv\Scripts\activate`
4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### Frontend Node Modules
The frontend uses npm/yarn for dependency management:

```
frontend/
├── node_modules/         # Dependencies (not tracked in git)
├── .env                  # Environment variables (not tracked in git)
├── .env.example          # Environment variables template
├── package.json          # Node dependencies
└── ...
```

**Setup Instructions:**
1. Navigate to `frontend/` directory
2. Install dependencies:
   ```bash
   npm install
   ```
   or
   ```bash
   yarn install
   ```

## Prerequisites

- Python 3.8 or higher
- Node.js 16.x or higher (or 18.x recommended)
- npm or yarn
- Git

## Quick Start

### Backend Setup
1. Navigate to `backend/` directory
2. Create and activate virtual environment (see above)
3. Copy `.env.example` to `.env` and configure
4. Install dependencies: `pip install -r requirements.txt`
5. Run migrations: `python manage.py migrate`
6. Start development server: `python manage.py runserver`

### Frontend Setup
1. Navigate to `frontend/` directory
2. Copy `.env.example` to `.env` and configure
3. Install dependencies: `npm install` or `yarn install`
4. Start development server: `npm start` or `yarn start`

## Environment Variables

### Root `.env.example`
Contains shared configuration for the entire project.

### Backend `.env.example`
Contains Django-specific settings including:
- Secret key
- Debug mode
- Database configuration (SQLite default, PostgreSQL optional)
- CORS settings
- Media and static files configuration

### Frontend `.env.example`
Contains React-specific settings including:
- API base URL
- Environment configuration

**Important:** Copy each `.env.example` to `.env` and fill in your actual values. Never commit `.env` files to version control.

## Database Configuration

### Default: SQLite
No configuration needed. SQLite database will be created automatically in `backend/` directory.

### Optional: PostgreSQL
1. Install PostgreSQL
2. Create database
3. Update `backend/.env` with PostgreSQL credentials:
   ```
   DB_ENGINE=django.db.backends.postgresql
   DB_NAME=your_db_name
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_HOST=localhost
   DB_PORT=5432
   ```
4. Run migrations: `python manage.py migrate`

## Development Workflow

1. **Backend Development:**
   - Activate virtual environment
   - Make changes to Django code
   - Run tests: `python manage.py test`
   - Run migrations if models changed: `python manage.py makemigrations && python manage.py migrate`
   - Start server: `python manage.py runserver`

2. **Frontend Development:**
   - Navigate to frontend directory
   - Make changes to React code
   - Start development server: `npm start` or `yarn start`
   - Frontend will proxy API requests to backend

3. **Full Stack Development:**
   - Run backend server on port 8000
   - Run frontend server on port 3000
   - Frontend communicates with backend via API

## License
[Add license information here if applicable]