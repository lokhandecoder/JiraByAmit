using System;
using System.ComponentModel.DataAnnotations;
using PersonalJira.Api.Models;

namespace PersonalJira.Api.DTOs
{
    public class CreateUserDto
    {
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [MaxLength(255)]
        public string Email { get; set; } = string.Empty;

        [Required]
        public UserRole Role { get; set; } = UserRole.Developer;

        public string? AvatarUrl { get; set; }
    }

    public class UserResponseDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public UserRole Role { get; set; }
        public string AvatarUrl { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public int AssignedTasksCount { get; set; }
    }
}
