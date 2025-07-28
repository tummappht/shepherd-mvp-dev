# Shepherd MVP - Supabase Integration Setup

This guide will help you set up the Supabase database and get the repository analysis form working.

## 1. Supabase Database Setup

### Step 1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note down your `SUPABASE_URL` and `SUPABASE_KEY` (anon/public key)

### Step 2: Run Database Schema
1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `backend/supabase_schema.sql`
4. Run the SQL script

This will create:
- `repository_analyses` table with all necessary fields
- Indexes for better performance
- Row Level Security (RLS) policies
- Automatic timestamp updates

## 2. Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_anon_key_here

# MAS Configuration (if using MAS)
MAS_REPO_PATH=../blackRabbit
MAS_PYTHON_PATH=python
```

## 3. Database Schema Overview

The `repository_analyses` table stores:

| Field | Type | Description |
|-------|------|-------------|
| `id` | BIGSERIAL | Primary key |
| `run_id` | UUID | Unique identifier for each analysis |
| `repository_url` | TEXT | GitHub repository URL |
| `project_description` | TEXT | Project documentation |
| `environment` | TEXT | "local" or "testnet" |
| `status` | TEXT | "pending", "running", "completed", "failed" |
| `user_id` | TEXT | User identifier |
| `reference_files` | TEXT[] | Array of file names |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

## 4. API Endpoints

### Create Repository Analysis
```bash
POST /api/repository-analysis
Content-Type: application/json

{
  "repository_url": "https://github.com/user/repo",
  "project_description": "Project description here",
  "environment": "local",
  "user_id": "@0xps",
  "reference_files": ["file1.sol", "file2.sol"]
}
```

### Get Repository Analysis
```bash
GET /api/repository-analysis/{run_id}
```

## 5. Frontend Integration

The form component (`RepositoryForm.jsx`) includes:
- ✅ Repository URL input
- ✅ Project description textarea
- ✅ File upload for reference files
- ✅ Environment selection (Local/Testnet)
- ✅ Form validation
- ✅ Success/error messaging
- ✅ Loading states

## 6. Testing the Integration

1. Start the backend server:
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

2. Start the frontend:
```bash
cd frontend
npm install
npm run dev
```

3. Fill out the form and submit
4. Check your Supabase dashboard to see the created record

## 7. Database Helper Functions

The backend includes these helper functions:

- `create_repository_analysis()` - Create new analysis
- `get_repository_analysis()` - Get analysis by run_id
- `update_analysis_status()` - Update status
- `list_user_analyses()` - Get user's analyses

## 8. Security Features

- Row Level Security (RLS) enabled
- User-specific data access
- Input validation
- Environment constraints

## 9. Next Steps

After setting up the form storage:

1. **File Upload**: Implement actual file storage (Supabase Storage)
2. **Authentication**: Add user authentication
3. **MAS Integration**: Connect form data to MAS analysis
4. **Status Updates**: Real-time status updates via WebSocket
5. **Results Display**: Show analysis results in the UI

## Troubleshooting

### Common Issues:

1. **CORS Error**: Make sure your backend allows frontend origin
2. **Supabase Connection**: Verify your environment variables
3. **Database Permissions**: Check RLS policies in Supabase
4. **File Upload**: Currently stores file names only, not actual files

### Debug Commands:

```bash
# Check Supabase connection
curl -X GET "https://your-project.supabase.co/rest/v1/repository_analyses" \
  -H "apikey: your_anon_key" \
  -H "Authorization: Bearer your_anon_key"

# Test API endpoint
curl -X POST "http://localhost:8000/api/repository-analysis" \
  -H "Content-Type: application/json" \
  -d '{"repository_url":"https://github.com/test/repo","project_description":"test","environment":"local"}'
``` 