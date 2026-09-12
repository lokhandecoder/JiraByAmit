using Microsoft.EntityFrameworkCore;
using PersonalJira.Api.Models;

namespace PersonalJira.Api.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users => Set<User>();
        public DbSet<Sprint> Sprints => Set<Sprint>();
        public DbSet<TaskItem> Tasks => Set<TaskItem>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure PostgreSQL Enum storage as strings
            modelBuilder.Entity<User>()
                .Property(u => u.Role)
                .HasConversion<string>();

            modelBuilder.Entity<Sprint>()
                .Property(s => s.Status)
                .HasConversion<string>();

            modelBuilder.Entity<TaskItem>()
                .Property(t => t.TaskType)
                .HasConversion<string>();

            modelBuilder.Entity<TaskItem>()
                .Property(t => t.Status)
                .HasConversion<string>();

            modelBuilder.Entity<TaskItem>()
                .Property(t => t.Priority)
                .HasConversion<string>();

            // Indexes for high performance sprint planning & filtering
            modelBuilder.Entity<TaskItem>()
                .HasIndex(t => t.Key)
                .IsUnique();

            modelBuilder.Entity<TaskItem>()
                .HasIndex(t => t.SprintId);

            modelBuilder.Entity<TaskItem>()
                .HasIndex(t => t.AssigneeId);

            modelBuilder.Entity<TaskItem>()
                .HasIndex(t => t.Status);

            modelBuilder.Entity<TaskItem>()
                .HasIndex(t => t.TaskType);

            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            // Relationships
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

            // Seed Initial Data
            var adminId = Guid.Parse("11111111-1111-1111-1111-111111111111");
            var dev1Id = Guid.Parse("22222222-2222-2222-2222-222222222222");
            var qaId = Guid.Parse("33333333-3333-3333-3333-333333333333");
            var sprint14Id = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

            modelBuilder.Entity<User>().HasData(
                new User
                {
                    Id = adminId,
                    Name = "Alex Rivera",
                    Email = "alex.rivera@teamjira.io",
                    Role = UserRole.Admin,
                    AvatarUrl = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
                    CreatedAt = new DateTime(2026, 1, 10, 8, 0, 0, DateTimeKind.Utc)
                },
                new User
                {
                    Id = dev1Id,
                    Name = "Sarah Chen",
                    Email = "sarah.chen@teamjira.io",
                    Role = UserRole.Developer,
                    AvatarUrl = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
                    CreatedAt = new DateTime(2026, 1, 15, 9, 30, 0, DateTimeKind.Utc)
                },
                new User
                {
                    Id = qaId,
                    Name = "Elena Rostova",
                    Email = "elena.r@teamjira.io",
                    Role = UserRole.QA,
                    AvatarUrl = "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
                    CreatedAt = new DateTime(2026, 2, 10, 14, 20, 0, DateTimeKind.Utc)
                }
            );

            modelBuilder.Entity<Sprint>().HasData(
                new Sprint
                {
                    Id = sprint14Id,
                    Name = "Sprint 14: Core Workflow Engine",
                    Goal = "Deliver robust task workflow transitions and PostgreSQL persistence.",
                    StartDate = new DateTime(2026, 9, 1, 0, 0, 0, DateTimeKind.Utc),
                    EndDate = new DateTime(2026, 9, 15, 23, 59, 59, DateTimeKind.Utc),
                    Status = SprintStatus.InProgress,
                    CreatedAt = new DateTime(2026, 8, 30, 10, 0, 0, DateTimeKind.Utc)
                }
            );

            modelBuilder.Entity<TaskItem>().HasData(
                new TaskItem
                {
                    Id = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                    Key = "PJ-101",
                    Title = "Implement Admin User Creation API",
                    Description = "Enable administrators to register and assign roles (Admin, Dev, QA, PO).",
                    TaskType = TaskType.UserStory,
                    Status = TaskStatus.Completed,
                    Priority = TaskPriority.High,
                    StoryPoints = 5,
                    AssigneeId = adminId,
                    SprintId = sprint14Id,
                    CreatedAt = new DateTime(2026, 9, 1, 9, 0, 0, DateTimeKind.Utc),
                    UpdatedAt = new DateTime(2026, 9, 4, 16, 0, 0, DateTimeKind.Utc)
                },
                new TaskItem
                {
                    Id = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
                    Key = "PJ-102",
                    Title = "PostgreSQL connection timeout under concurrency",
                    Description = "Investigate pool exhaustion in Npgsql during sprint batch queries.",
                    TaskType = TaskType.Defect,
                    Status = TaskStatus.InProgress,
                    Priority = TaskPriority.Critical,
                    StoryPoints = 8,
                    AssigneeId = dev1Id,
                    SprintId = sprint14Id,
                    CreatedAt = new DateTime(2026, 9, 2, 11, 30, 0, DateTimeKind.Utc),
                    UpdatedAt = new DateTime(2026, 9, 10, 14, 15, 0, DateTimeKind.Utc)
                },
                new TaskItem
                {
                    Id = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
                    Key = "PJ-103",
                    Title = "QA sanity validation for workflow state transitions",
                    Description = "Verify draft -> in progres -> completed integrity across all task types.",
                    TaskType = TaskType.RandomTask,
                    Status = TaskStatus.Draft,
                    Priority = TaskPriority.Medium,
                    StoryPoints = 3,
                    AssigneeId = qaId,
                    SprintId = sprint14Id,
                    CreatedAt = new DateTime(2026, 9, 6, 15, 45, 0, DateTimeKind.Utc),
                    UpdatedAt = new DateTime(2026, 9, 6, 15, 45, 0, DateTimeKind.Utc)
                }
            );
        }
    }
}
