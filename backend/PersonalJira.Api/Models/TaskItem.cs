using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PersonalJira.Api.Models
{
    [Table("tasks")]
    public class TaskItem
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        [MaxLength(20)]
        [Column("key")]
        public string Key { get; set; } = string.Empty; // e.g. PJ-101

        [Required]
        [MaxLength(250)]
        [Column("title")]
        public string Title { get; set; } = string.Empty;

        [Column("description", TypeName = "text")]
        public string Description { get; set; } = string.Empty;

        [Required]
        [Column("task_type")]
        public TaskType TaskType { get; set; } = TaskType.UserStory;

        [Required]
        [Column("status")]
        public TaskStatus Status { get; set; } = TaskStatus.Draft;

        [Required]
        [Column("priority")]
        public TaskPriority Priority { get; set; } = TaskPriority.Medium;

        [Column("story_points")]
        public int StoryPoints { get; set; } = 3;

        [Required]
        [Column("assignee_id")]
        public Guid AssigneeId { get; set; }

        [ForeignKey("AssigneeId")]
        public User? Assignee { get; set; }

        [Required]
        [Column("sprint_id")]
        public Guid SprintId { get; set; }

        [ForeignKey("SprintId")]
        public Sprint? Sprint { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
