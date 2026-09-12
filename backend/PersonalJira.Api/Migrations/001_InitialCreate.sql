-- ==========================================================
-- Personal Jira Database Migration: PostgreSQL DDL Script
-- Architecture: .NET Core 8 Web API + PostgreSQL (EF Core)
-- ==========================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(50) NOT NULL DEFAULT 'Developer' 
        CHECK (role IN ('Admin', 'Developer', 'QA', 'ProductOwner')),
    avatar_url VARCHAR(500) DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create Sprints Table
CREATE TABLE IF NOT EXISTS sprints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    goal VARCHAR(1000) DEFAULT '',
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Planning'
        CHECK (status IN ('Planning', 'InProgress', 'Completed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create Tasks Table
-- Each task is assigned to some sprint with status: draft | in progres | completed
-- Task type: defect | user story | random task
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(20) NOT NULL UNIQUE,
    title VARCHAR(250) NOT NULL,
    description TEXT DEFAULT '',
    task_type VARCHAR(50) NOT NULL DEFAULT 'UserStory'
        CHECK (task_type IN ('Defect', 'UserStory', 'RandomTask')),
    status VARCHAR(50) NOT NULL DEFAULT 'Draft'
        CHECK (status IN ('Draft', 'InProgress', 'Completed')),
    priority VARCHAR(50) NOT NULL DEFAULT 'Medium'
        CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
    story_points INTEGER NOT NULL DEFAULT 3 CHECK (story_points >= 1 AND story_points <= 100),
    assignee_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    sprint_id UUID NOT NULL REFERENCES sprints(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_sprint_id ON tasks(sprint_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_task_type ON tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_sprints_status ON sprints(status);

-- 6. Trigger to automatically update updated_at timestamp on task changes
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_tasks_update_timestamp ON tasks;
CREATE TRIGGER trg_tasks_update_timestamp
BEFORE UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- 7. Initial Seed Data
INSERT INTO users (id, name, email, role, avatar_url, created_at)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Alex Rivera', 'alex.rivera@teamjira.io', 'Admin', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', '2026-01-10 08:00:00+00'),
    ('22222222-2222-2222-2222-222222222222', 'Sarah Chen', 'sarah.chen@teamjira.io', 'Developer', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', '2026-01-15 09:30:00+00'),
    ('33333333-3333-3333-3333-333333333333', 'Elena Rostova', 'elena.r@teamjira.io', 'QA', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80', '2026-02-10 14:20:00+00')
ON CONFLICT (email) DO NOTHING;

INSERT INTO sprints (id, name, goal, start_date, end_date, status, created_at)
VALUES 
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Sprint 14: Core Workflow Engine', 'Deliver robust task workflow transitions and PostgreSQL persistence.', '2026-09-01 00:00:00+00', '2026-09-15 23:59:59+00', 'InProgress', '2026-08-30 10:00:00+00')
ON CONFLICT (id) DO NOTHING;

INSERT INTO tasks (id, key, title, description, task_type, status, priority, story_points, assignee_id, sprint_id, created_at, updated_at)
VALUES 
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'PJ-101', 'Implement Admin User Creation API', 'Enable administrators to register and assign roles (Admin, Dev, QA, PO).', 'UserStory', 'Completed', 'High', 5, '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2026-09-01 09:00:00+00', '2026-09-04 16:00:00+00'),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'PJ-102', 'PostgreSQL connection timeout under concurrency', 'Investigate pool exhaustion in Npgsql during sprint batch queries.', 'Defect', 'InProgress', 'Critical', 8, '22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2026-09-02 11:30:00+00', '2026-09-10 14:15:00+00'),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'PJ-103', 'QA sanity validation for workflow state transitions', 'Verify draft -> in progres -> completed integrity across all task types.', 'RandomTask', 'Draft', 'Medium', 3, '33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2026-09-06 15:45:00+00', '2026-09-06 15:45:00+00')
ON CONFLICT (key) DO NOTHING;
