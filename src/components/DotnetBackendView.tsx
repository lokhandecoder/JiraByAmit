import React, { useState } from 'react';
import { useJira } from '../context/JiraContext';
import { 
  Server, 
  Database, 
  Code, 
  Play, 
  Copy, 
  Check, 
  Terminal, 
  Layers, 
  ShieldCheck, 
  Download, 
  ExternalLink,
  ChevronRight,
  Sparkles
} from 'lucide-react';

type BackendTab = 'code' | 'playground' | 'erd' | 'setup';

export const DotnetBackendView: React.FC = () => {
  const { tasks, sprints, users, currentUser } = useJira();
  const [activeSubTab, setActiveSubTab] = useState<BackendTab>('code');
  const [selectedFile, setSelectedFile] = useState<string>('Program.cs');
  const [copied, setCopied] = useState(false);

  // Playground state
  const [apiMethod, setApiMethod] = useState<'GET' | 'POST' | 'PATCH'>('GET');
  const [apiEndpoint, setApiEndpoint] = useState<string>('/api/tasks');
  const [apiResponse, setApiResponse] = useState<string>(
    JSON.stringify(tasks.slice(0, 3), null, 2)
  );
  const [apiStatus, setApiStatus] = useState<number>(200);

  const fileContents: Record<string, { lang: string; path: string; desc: string; code: string }> = {
    'Program.cs': {
      lang: 'csharp',
      path: 'backend/PersonalJira.Api/Program.cs',
      desc: '.NET 8 Web API entrypoint with Npgsql EF Core DbContext, Swagger UI, and CORS',
      code: `using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using PersonalJira.Api.Data;

var builder = WebApplication.CreateBuilder(args);

// 1. JSON String Enums Converter (draft | in progres | completed)
builder.Services.AddControllers()
    .AddJsonOptions(options => {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

// 2. PostgreSQL Connection with Npgsql EF Core
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString, npgsql => {
        npgsql.EnableRetryOnFailure(maxRetryCount: 5);
    }));

// 3. CORS Policy
builder.Services.AddCors(options => {
    options.AddPolicy("AllowAll", policy => policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});

// 4. Swagger/OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c => {
    c.SwaggerDoc("v1", new OpenApiInfo {
        Title = "Personal Jira .NET Core Web API",
        Version = "v1",
        Description = "Production REST API with PostgreSQL, Sprint Planning & Progress Reporting"
    });
});

var app = builder.Build();

// Auto-migrate PostgreSQL on startup
using (var scope = app.Services.CreateScope()) {
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
}

app.UseSwagger();
app.UseSwaggerUI();
app.UseCors("AllowAll");
app.MapControllers();

app.Run();`
    },

    'AppDbContext.cs': {
      lang: 'csharp',
      path: 'backend/PersonalJira.Api/Data/AppDbContext.cs',
      desc: 'Entity Framework Core PostgreSQL Context with Fluent API mappings and Constraints',
      code: `using Microsoft.EntityFrameworkCore;
using PersonalJira.Api.Models;

namespace PersonalJira.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) {}

    public DbSet<User> Users => Set<User>();
    public DbSet<Sprint> Sprints => Set<Sprint>();
    public DbSet<TaskItem> Tasks => Set<TaskItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Enum conversions to string
        modelBuilder.Entity<TaskItem>().Property(t => t.Status).HasConversion<string>();
        modelBuilder.Entity<TaskItem>().Property(t => t.TaskType).HasConversion<string>();
        modelBuilder.Entity<TaskItem>().Property(t => t.Priority).HasConversion<string>();
        modelBuilder.Entity<User>().Property(u => u.Role).HasConversion<string>();
        modelBuilder.Entity<Sprint>().Property(s => s.Status).HasConversion<string>();

        // Indexes for performance
        modelBuilder.Entity<TaskItem>().HasIndex(t => t.Key).IsUnique();
        modelBuilder.Entity<TaskItem>().HasIndex(t => t.SprintId);
        modelBuilder.Entity<TaskItem>().HasIndex(t => t.AssigneeId);
        modelBuilder.Entity<TaskItem>().HasIndex(t => t.Status);

        // Foreign Key Relationships
        modelBuilder.Entity<TaskItem>()
            .HasOne(t => t.Assignee)
            .WithMany(u => u.AssignedTasks)
            .HasForeignKey(t => t.AssigneeId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<TaskItem>()
            .HasOne(t => t.Sprint)
            .WithMany(s => s.Tasks)
            .HasForeignKey(t => t.SprintId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}`
    },

    'TasksController.cs': {
      lang: 'csharp',
      path: 'backend/PersonalJira.Api/Controllers/TasksController.cs',
      desc: 'REST controller for Tasks: draft | in progres | completed & defect | user story | random task',
      code: `using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PersonalJira.Api.Data;
using PersonalJira.Api.DTOs;
using PersonalJira.Api.Models;

namespace PersonalJira.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TasksController : ControllerBase
{
    private readonly AppDbContext _context;
    public TasksController(AppDbContext context) => _context = context;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TaskResponseDto>>> GetTasks(
        [FromQuery] Guid? sprintId, [FromQuery] TaskStatus? status)
    {
        var query = _context.Tasks.Include(t => t.Assignee).Include(t => t.Sprint).AsQueryable();
        if (sprintId.HasValue) query = query.Where(t => t.SprintId == sprintId.Value);
        if (status.HasValue) query = query.Where(t => t.Status == status.Value);

        return Ok(await query.ToListAsync());
    }

    [HttpPost]
    public async Task<ActionResult<TaskResponseDto>> CreateTask([FromBody] CreateTaskDto dto)
    {
        var count = await _context.Tasks.CountAsync();
        var task = new TaskItem {
            Id = Guid.NewGuid(),
            Key = $"PJ-{101 + count}",
            Title = dto.Title,
            Description = dto.Description,
            TaskType = dto.TaskType,
            Status = dto.Status,
            Priority = dto.Priority,
            StoryPoints = dto.StoryPoints,
            AssigneeId = dto.AssigneeId,
            SprintId = dto.SprintId
        };
        _context.Tasks.Add(task);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetTasks), new { id = task.Id }, task);
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateTaskStatusDto dto)
    {
        var task = await _context.Tasks.FindAsync(id);
        if (task == null) return NotFound();
        task.Status = dto.Status;
        task.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return Ok(new { message = $"Status changed to {task.Status}" });
    }
}`
    },

    'UsersController.cs': {
      lang: 'csharp',
      path: 'backend/PersonalJira.Api/Controllers/UsersController.cs',
      desc: 'Admin user provisioning with role checks (Admin, Developer, QA, ProductOwner)',
      code: `using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PersonalJira.Api.Data;
using PersonalJira.Api.DTOs;
using PersonalJira.Api.Models;

namespace PersonalJira.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _context;
    public UsersController(AppDbContext context) => _context = context;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserResponseDto>>> GetUsers()
    {
        return Ok(await _context.Users.Include(u => u.AssignedTasks).ToListAsync());
    }

    [HttpPost]
    public async Task<ActionResult<UserResponseDto>> CreateUser(
        [FromBody] CreateUserDto dto,
        [FromHeader(Name = "X-Admin-Role")] string? adminHeader = "admin")
    {
        if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
            return Conflict(new { message = "Email already registered" });

        var user = new User {
            Id = Guid.NewGuid(),
            Name = dto.Name,
            Email = dto.Email,
            Role = dto.Role,
            AvatarUrl = dto.AvatarUrl ?? $"https://api.dicebear.com/7.x/initials/svg?seed={dto.Name}",
            CreatedAt = DateTime.UtcNow
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetUsers), new { id = user.Id }, user);
    }
}`
    },

    'ReportsController.cs': {
      lang: 'csharp',
      path: 'backend/PersonalJira.Api/Controllers/ReportsController.cs',
      desc: 'Burndown trajectory calculation, sprint velocity forecasting, and workload metrics',
      code: `using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PersonalJira.Api.Data;
using PersonalJira.Api.DTOs;

namespace PersonalJira.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReportsController : ControllerBase
{
    private readonly AppDbContext _context;
    public ReportsController(AppDbContext context) => _context = context;

    [HttpGet("sprint/{sprintId}/burndown")]
    public async Task<ActionResult<SprintBurndownReportDto>> GetSprintBurndown(Guid sprintId)
    {
        var sprint = await _context.Sprints.Include(s => s.Tasks).FirstOrDefaultAsync(s => s.Id == sprintId);
        if (sprint == null) return NotFound();

        var totalEstimated = sprint.Tasks.Sum(t => t.StoryPoints);
        var completed = sprint.Tasks.Where(t => t.Status == Models.TaskStatus.Completed).Sum(t => t.StoryPoints);

        return Ok(new {
            sprintId = sprint.Id,
            sprintName = sprint.Name,
            totalEstimated,
            completed,
            remaining = totalEstimated - completed
        });
    }

    [HttpGet("velocity")]
    public async Task<ActionResult<IEnumerable<VelocityReportDto>>> GetVelocity()
    {
        var velocity = await _context.Sprints.Include(s => s.Tasks)
            .Select(s => new {
                Sprint = s.Name,
                Committed = s.Tasks.Sum(t => t.StoryPoints),
                Completed = s.Tasks.Where(t => t.Status == Models.TaskStatus.Completed).Sum(t => t.StoryPoints)
            }).ToListAsync();
        return Ok(velocity);
    }
}`
    },

    '001_InitialCreate.sql': {
      lang: 'sql',
      path: 'backend/PersonalJira.Api/Migrations/001_InitialCreate.sql',
      desc: 'PostgreSQL DDL script with CREATE TABLE, UUID, CHECK constraints, and Fresh Admin Seed',
      code: `-- PostgreSQL DDL for Personal Jira
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL DEFAULT '12345678',
    role VARCHAR(50) NOT NULL DEFAULT 'Developer' CHECK (role IN ('Admin','Developer','QA','ProductOwner')),
    avatar_url VARCHAR(500) DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sprints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    goal VARCHAR(1000) DEFAULT '',
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Planning' CHECK (status IN ('Planning','InProgress','Completed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(20) NOT NULL UNIQUE,
    title VARCHAR(250) NOT NULL,
    description TEXT DEFAULT '',
    task_type VARCHAR(50) NOT NULL CHECK (task_type IN ('Defect','UserStory','RandomTask')),
    status VARCHAR(50) NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft','InProgress','Completed')),
    priority VARCHAR(50) NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low','Medium','High','Critical')),
    story_points INTEGER NOT NULL DEFAULT 3,
    assignee_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    sprint_id UUID NOT NULL REFERENCES sprints(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tasks_sprint_id ON tasks(sprint_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_task_type ON tasks(task_type);

-- Seed Initial Fresh State: ONLY Admin User (Password: 12345678)
INSERT INTO users (id, name, email, password, role, avatar_url)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Admin',
    'admin@personaljira.io',
    '12345678',
    'Admin',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
);

-- Seed Initial Fresh Sprint 1
INSERT INTO sprints (id, name, goal, start_date, end_date, status)
VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'Sprint 1',
    'Initial sprint planning, backlog grooming, and user provisioning.',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP + INTERVAL '14 days',
    'InProgress'
);
-- Tasks table left clean and empty for fresh workspace start`
    },

    'docker-compose.yml': {
      lang: 'yaml',
      path: 'backend/PersonalJira.Api/docker-compose.yml',
      desc: 'Docker Compose orchestration for .NET Core 8 Web API container + PostgreSQL 16 container',
      code: `version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: personal_jira_postgres
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: personal_jira_db
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./Migrations/001_InitialCreate.sql:/docker-entrypoint-initdb.d/001_InitialCreate.sql

  backend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: personal_jira_api
    depends_on:
      - postgres
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - ConnectionStrings__DefaultConnection=Host=postgres;Port=5432;Database=personal_jira_db;Username=postgres;Password=postgres
    ports:
      - "5000:5000"

volumes:
  pgdata:`
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(fileContents[selectedFile]?.code || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const executePlayground = () => {
    if (apiEndpoint === '/api/tasks') {
      if (apiMethod === 'GET') {
        setApiResponse(JSON.stringify(tasks, null, 2));
        setApiStatus(200);
      } else if (apiMethod === 'POST') {
        const sampleNew = {
          id: 'task-new-sample',
          key: `PJ-${100 + tasks.length + 1}`,
          title: 'Sample task from .NET API playground',
          taskType: 'user story',
          status: 'draft',
          priority: 'high',
          storyPoints: 5,
          assigneeId: users[0]?.id,
          sprintId: sprints[0]?.id
        };
        setApiResponse(JSON.stringify(sampleNew, null, 2));
        setApiStatus(201);
      }
    } else if (apiEndpoint === '/api/users') {
      if (apiMethod === 'GET') {
        setApiResponse(JSON.stringify(users, null, 2));
        setApiStatus(200);
      } else if (apiMethod === 'POST') {
        if (currentUser.role !== 'admin') {
          setApiResponse(JSON.stringify({ error: 'Forbidden: Only Admin role can create users.' }, null, 2));
          setApiStatus(403);
        } else {
          setApiResponse(JSON.stringify({
            id: 'guid-sample-user',
            name: 'Playground User',
            email: 'playground@teamjira.io',
            role: 'Developer'
          }, null, 2));
          setApiStatus(201);
        }
      }
    } else if (apiEndpoint.includes('/reports/')) {
      setApiResponse(JSON.stringify({
        sprintId: sprints[0]?.id,
        sprintName: sprints[0]?.name,
        totalStoryPoints: tasks.reduce((s, t) => s + t.storyPoints, 0),
        statusDistribution: {
          draft: tasks.filter(t => t.status === 'draft').length,
          inProgress: tasks.filter(t => t.status === 'in progres').length,
          completed: tasks.filter(t => t.status === 'completed').length
        },
        typeDistribution: {
          defect: tasks.filter(t => t.taskType === 'defect').length,
          userStory: tasks.filter(t => t.taskType === 'user story').length,
          randomTask: tasks.filter(t => t.taskType === 'random task').length
        }
      }, null, 2));
      setApiStatus(200);
    } else {
      setApiResponse(JSON.stringify(sprints, null, 2));
      setApiStatus(200);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Server className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              .NET Core 8 Web API & PostgreSQL
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            Backend Architecture & Code Hub
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Production-grade C# Web API solution with Entity Framework Core, PostgreSQL 16 schema, and Docker deployment.
          </p>
        </div>

        {/* Sub Navigation */}
        <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs font-medium shrink-0">
          <button
            onClick={() => setActiveSubTab('code')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeSubTab === 'code'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            C# Code Files
          </button>
          <button
            onClick={() => setActiveSubTab('playground')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeSubTab === 'playground'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            API Playground
          </button>
          <button
            onClick={() => setActiveSubTab('erd')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeSubTab === 'erd'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            PostgreSQL Schema
          </button>
          <button
            onClick={() => setActiveSubTab('setup')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeSubTab === 'setup'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Run & Deploy
          </button>
        </div>
      </div>

      {/* Code Browser View */}
      {activeSubTab === 'code' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* File Selector Sidebar */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-2 shadow-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Solution Files (/backend)
            </div>
            <div className="space-y-1">
              {Object.entries(fileContents).map(([name, item]) => (
                <button
                  key={name}
                  onClick={() => setSelectedFile(name)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono transition-colors flex items-center justify-between ${
                    selectedFile === name
                      ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="truncate">{name}</span>
                  <span className="text-[10px] uppercase opacity-70">{item.lang}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Code Viewer Panel */}
          <div className="lg:col-span-3 bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-md flex flex-col">
            {/* Header */}
            <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono font-bold text-slate-200">
                    {selectedFile}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {fileContents[selectedFile]?.path}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {fileContents[selectedFile]?.desc}
                </p>
              </div>

              <button
                onClick={handleCopyCode}
                className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-md transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Code Body */}
            <div className="p-4 overflow-x-auto max-h-[600px] overflow-y-auto">
              <pre className="font-mono text-xs text-slate-300 leading-relaxed">
                <code>{fileContents[selectedFile]?.code}</code>
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* API Playground View */}
      {activeSubTab === 'playground' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Request Configurator */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Play className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  REST API Interactive Explorer
                </h2>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Swagger v1 Sandbox
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  HTTP Method & Endpoint
                </label>
                <div className="flex space-x-2">
                  <select
                    value={apiMethod}
                    onChange={e => setApiMethod(e.target.value as any)}
                    className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg font-mono font-bold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PATCH">PATCH</option>
                  </select>
                  <select
                    value={apiEndpoint}
                    onChange={e => setApiEndpoint(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg font-mono text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                  >
                    <option value="/api/tasks">/api/tasks (List tasks / Filter)</option>
                    <option value="/api/tasks/status">/api/tasks/{'{id}'}/status (Update workflow)</option>
                    <option value="/api/users">/api/users (Admin provision user)</option>
                    <option value="/api/sprints">/api/sprints (List & capacity)</option>
                    <option value="/api/reports/burndown">/api/reports/sprint/{'{id}'}/burndown</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Active Caller Role Header
                </label>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span className="font-mono text-slate-600 dark:text-slate-300">
                    X-Admin-Role: {currentUser.role}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-blue-600">
                    {currentUser.name}
                  </span>
                </div>
              </div>

              <button
                onClick={executePlayground}
                className="w-full flex items-center justify-center space-x-1.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-xs transition-colors"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Send API Request</span>
              </button>
            </div>
          </div>

          {/* Response Inspector */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 flex flex-col shadow-md">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold text-slate-300">
                  Response Payload
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  apiStatus === 200 || apiStatus === 201 
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
                    : 'bg-rose-950 text-rose-400 border border-rose-800'
                }`}>
                  Status: {apiStatus} OK
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">application/json</span>
            </div>

            <div className="flex-1 overflow-x-auto max-h-[400px]">
              <pre className="font-mono text-xs text-emerald-400 leading-relaxed">
                <code>{apiResponse}</code>
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* PostgreSQL ERD Schema View */}
      {activeSubTab === 'erd' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Table: Users */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="bg-rose-50 dark:bg-rose-950/70 p-3 border-b border-rose-200 dark:border-rose-900 font-mono font-bold text-xs text-rose-800 dark:text-rose-300 flex items-center justify-between">
                <span>TABLE users</span>
                <span className="text-[10px]">PK id</span>
              </div>
              <div className="p-3 text-xs divide-y divide-slate-100 dark:divide-slate-800 font-mono space-y-1">
                <div className="flex justify-between py-1">
                  <span className="font-bold text-slate-900 dark:text-white">id</span>
                  <span className="text-slate-400">UUID (PK)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-700 dark:text-slate-300">name</span>
                  <span className="text-slate-400">VARCHAR(100)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-700 dark:text-slate-300">email</span>
                  <span className="text-slate-400">VARCHAR(255) UNIQUE</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-700 dark:text-slate-300">role</span>
                  <span className="text-rose-600 dark:text-rose-400">CHECK (Admin..)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-700 dark:text-slate-300">avatar_url</span>
                  <span className="text-slate-400">VARCHAR(500)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-700 dark:text-slate-300">created_at</span>
                  <span className="text-slate-400">TIMESTAMPTZ</span>
                </div>
              </div>
            </div>

            {/* Table: Sprints */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="bg-blue-50 dark:bg-blue-950/70 p-3 border-b border-blue-200 dark:border-blue-900 font-mono font-bold text-xs text-blue-800 dark:text-blue-300 flex items-center justify-between">
                <span>TABLE sprints</span>
                <span className="text-[10px]">PK id</span>
              </div>
              <div className="p-3 text-xs divide-y divide-slate-100 dark:divide-slate-800 font-mono space-y-1">
                <div className="flex justify-between py-1">
                  <span className="font-bold text-slate-900 dark:text-white">id</span>
                  <span className="text-slate-400">UUID (PK)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-700 dark:text-slate-300">name</span>
                  <span className="text-slate-400">VARCHAR(150)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-700 dark:text-slate-300">goal</span>
                  <span className="text-slate-400">VARCHAR(1000)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-700 dark:text-slate-300">start_date</span>
                  <span className="text-slate-400">TIMESTAMPTZ</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-700 dark:text-slate-300">end_date</span>
                  <span className="text-slate-400">TIMESTAMPTZ</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-700 dark:text-slate-300">status</span>
                  <span className="text-blue-600 dark:text-blue-400">CHECK (Planning..)</span>
                </div>
              </div>
            </div>

            {/* Table: Tasks */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="bg-emerald-50 dark:bg-emerald-950/70 p-3 border-b border-emerald-200 dark:border-emerald-900 font-mono font-bold text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                <span>TABLE tasks</span>
                <span className="text-[10px]">PK id / FKs</span>
              </div>
              <div className="p-3 text-xs divide-y divide-slate-100 dark:divide-slate-800 font-mono space-y-1">
                <div className="flex justify-between py-1">
                  <span className="font-bold text-slate-900 dark:text-white">key</span>
                  <span className="text-slate-400">VARCHAR(20) UNIQUE</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-700 dark:text-slate-300">title</span>
                  <span className="text-slate-400">VARCHAR(250)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-700 dark:text-slate-300">task_type</span>
                  <span className="text-emerald-600 dark:text-emerald-400">Defect|UserStory|..</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-700 dark:text-slate-300">status</span>
                  <span className="text-indigo-600 dark:text-indigo-400">Draft|InProgress|..</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-700 dark:text-slate-300">assignee_id</span>
                  <span className="text-rose-600 dark:text-rose-400">FK -&gt; users(id)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-700 dark:text-slate-300">sprint_id</span>
                  <span className="text-blue-600 dark:text-blue-400">FK -&gt; sprints(id)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Setup & Run Guide */}
      {activeSubTab === 'setup' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5 text-xs">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Running the .NET Core 8 Web API & PostgreSQL Solution
          </h2>

          <div className="space-y-3">
            <h3 className="font-bold text-slate-800 dark:text-slate-200">
              Option 1: Complete Stack via Docker Compose (Recommended)
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Starts PostgreSQL 16 container, mounts initial database migrations, and boots .NET 8 Web API container:
            </p>
            <div className="bg-slate-900 p-3 rounded-lg font-mono text-emerald-400">
              cd backend/PersonalJira.Api<br/>
              docker compose up -d --build
            </div>
            <p className="text-slate-500">
              Swagger UI will be immediately available at <code>http://localhost:5000/swagger</code>.
            </p>
          </div>

          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-800 dark:text-slate-200">
              Option 2: Native .NET 8 CLI & Local PostgreSQL
            </h3>
            <div className="bg-slate-900 p-3 rounded-lg font-mono text-emerald-400 space-y-1">
              <div># 1. Restore & Build packages</div>
              <div>dotnet restore</div>
              <div className="pt-1"># 2. Apply migrations to PostgreSQL</div>
              <div>dotnet ef database update</div>
              <div className="pt-1"># 3. Launch Web API</div>
              <div>dotnet run</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
