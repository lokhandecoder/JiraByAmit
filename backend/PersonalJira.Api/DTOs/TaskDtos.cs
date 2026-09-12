using System;
using System.ComponentModel.DataAnnotations;
using PersonalJira.Api.Models;

namespace PersonalJira.Api.DTOs
{
    public class CreateTaskDto
    {
        [Required]
        [MaxLength(250)]
        public string Title { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        [Required]
        public TaskType TaskType { get; set; } = TaskType.UserStory;

        [Required]
        public TaskStatus Status { get; set; } = TaskStatus.Draft;

        [Required]
        public TaskPriority Priority { get; set; } = TaskPriority.Medium;

        [Range(1, 100)]
        public int StoryPoints { get; set; } = 3;

        [Required]
        public Guid AssigneeId { get; set; }

        [Required]
        public Guid SprintId { get; set; }
    }

    public class UpdateTaskDto
    {
        [Required]
        [MaxLength(250)]
        public string Title { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        [Required]
        public TaskType TaskType { get; set; }

        [Required]
        public TaskStatus Status { get; set; }

        [Required]
        public TaskPriority Priority { get; set; }

        [Range(1, 100)]
        public int StoryPoints { get; set; }

        [Required]
        public Guid AssigneeId { get; set; }

        [Required]
        public Guid SprintId { get; set; }
    }

    public class UpdateTaskStatusDto
    {
        [Required]
        public TaskStatus Status { get; set; }
    }

    public class TaskResponseDto
    {
        public Guid Id { get; set; }
        public string Key { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public TaskType TaskType { get; set; }
        public TaskStatus Status { get; set; }
        public TaskPriority Priority { get; set; }
        public int StoryPoints { get; set; }
        public Guid AssigneeId { get; set; }
        public string AssigneeName { get; set; } = string.Empty;
        public string AssigneeAvatarUrl { get; set; } = string.Empty;
        public Guid SprintId { get; set; }
        public string SprintName { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
