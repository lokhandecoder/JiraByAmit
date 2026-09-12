using System;
using System.ComponentModel.DataAnnotations;
using PersonalJira.Api.Models;

namespace PersonalJira.Api.DTOs
{
    public class CreateSprintDto
    {
        [Required]
        [MaxLength(150)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string Goal { get; set; } = string.Empty;

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }
    }

    public class UpdateSprintDto
    {
        [Required]
        [MaxLength(150)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string Goal { get; set; } = string.Empty;

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }

        public SprintStatus Status { get; set; }
    }

    public class SprintResponseDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Goal { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public SprintStatus Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public int TotalTasks { get; set; }
        public int CompletedTasks { get; set; }
        public int TotalStoryPoints { get; set; }
        public int CompletedStoryPoints { get; set; }
    }
}
