# Personal Jira .NET Core 8 Web API & PostgreSQL Backend

Production-ready backend for Personal Jira with Sprint Planning, Progress Reporting, User Management, and Task Tracking.

## Architecture Highlights
- **Framework**: .NET Core 8 (C# 12) Web API
- **Database**: PostgreSQL 16 with Npgsql Entity Framework Core Provider
- **Documentation**: Swagger / OpenAPI with schema annotations
- **Workflow State Engine**: 
  - Statuses: `Draft` | `InProgress` | `Completed`
  - Task Types: `Defect` | `UserStory` | `RandomTask`
  - Priorities: `Low` | `Medium` | `High` | `Critical`
- **Modules**:
  - **Admin User Provisioning**: Admin can create users and assign roles (`Admin`, `Developer`, `QA`, `ProductOwner`).
  - **Task Workflow Transparency**: Track assignees, priorities, rich descriptions, and lifecycle transitions.
  - **Sprint Planning**: Capacity planning, story point commitments, start/complete sprint flows.
  - **Progress Reporting**: Burndown trajectory calculation, velocity tracking, type/status distributions, and team workload matrix.

## Quick Start (Docker Compose)
The easiest way to start both PostgreSQL and the .NET Core Web API:

```bash
cd backend/PersonalJira.Api
docker compose up -d
```
The API will be available at:
- **Swagger UI**: `http://localhost:5000/swagger`
- **Health Check**: `http://localhost:5000/health`

## Manual Local Setup

### 1. Prerequisites
- [.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [PostgreSQL 14+](https://www.postgresql.org/download/)

### 2. Configure Connection String
Edit `appsettings.json`:
```json
"ConnectionStrings": {
  "DefaultConnection": "Host=localhost;Port=5432;Database=personal_jira_db;Username=postgres;Password=your_password;"
}
```

### 3. Run Database Migrations
```bash
# Using EF Core CLI
dotnet tool install --global dotnet-ef
dotnet ef database update

# OR execute the raw SQL script directly in PostgreSQL:
psql -U postgres -d personal_jira_db -f Migrations/001_InitialCreate.sql
```

### 4. Run the API
```bash
dotnet run
```
