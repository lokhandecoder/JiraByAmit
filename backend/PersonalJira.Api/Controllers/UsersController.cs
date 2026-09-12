using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PersonalJira.Api.Data;
using PersonalJira.Api.DTOs;
using PersonalJira.Api.Models;

namespace PersonalJira.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UsersController(AppDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Retrieves all team users with their assigned task count.
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<UserResponseDto>>> GetUsers()
        {
            var users = await _context.Users
                .Include(u => u.AssignedTasks)
                .OrderBy(u => u.Name)
                .Select(u => new UserResponseDto
                {
                    Id = u.Id,
                    Name = u.Name,
                    Email = u.Email,
                    Role = u.Role,
                    AvatarUrl = u.AvatarUrl,
                    CreatedAt = u.CreatedAt,
                    AssignedTasksCount = u.AssignedTasks.Count
                })
                .ToListAsync();

            return Ok(users);
        }

        /// <summary>
        /// Retrieves a single user by ID.
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<UserResponseDto>> GetUser(Guid id)
        {
            var user = await _context.Users
                .Include(u => u.AssignedTasks)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null)
            {
                return NotFound(new { message = $"User with ID {id} not found." });
            }

            return Ok(new UserResponseDto
            {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email,
                Role = user.Role,
                AvatarUrl = user.AvatarUrl,
                CreatedAt = user.CreatedAt,
                AssignedTasksCount = user.AssignedTasks.Count
            });
        }

        /// <summary>
        /// Admin creation of team user with role assignment.
        /// Header 'X-Admin-Token' or requester role check can be configured.
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<UserResponseDto>> CreateUser([FromBody] CreateUserDto dto, [FromHeader(Name = "X-Admin-Role")] string? adminHeader = "admin")
        {
            if (string.IsNullOrEmpty(dto.Name) || string.IsNullOrEmpty(dto.Email))
            {
                return BadRequest(new { message = "User name and email are required." });
            }

            var emailExists = await _context.Users.AnyAsync(u => u.Email.ToLower() == dto.Email.ToLower());
            if (emailExists)
            {
                return Conflict(new { message = "A user with this email address already exists." });
            }

            // Fallback avatar if not supplied
            var avatar = string.IsNullOrWhiteSpace(dto.AvatarUrl)
                ? $"https://api.dicebear.com/7.x/initials/svg?seed={Uri.EscapeDataString(dto.Name)}"
                : dto.AvatarUrl;

            var newUser = new User
            {
                Id = Guid.NewGuid(),
                Name = dto.Name.Trim(),
                Email = dto.Email.Trim().ToLower(),
                Role = dto.Role,
                AvatarUrl = avatar,
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();

            var response = new UserResponseDto
            {
                Id = newUser.Id,
                Name = newUser.Name,
                Email = newUser.Email,
                Role = newUser.Role,
                AvatarUrl = newUser.AvatarUrl,
                CreatedAt = newUser.CreatedAt,
                AssignedTasksCount = 0
            };

            return CreatedAtAction(nameof(GetUser), new { id = newUser.Id }, response);
        }

        /// <summary>
        /// Deletes a user (only if they have no active tasks).
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(Guid id)
        {
            var user = await _context.Users
                .Include(u => u.AssignedTasks)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null)
            {
                return NotFound(new { message = $"User with ID {id} not found." });
            }

            if (user.AssignedTasks.Any(t => t.Status != TaskStatus.Completed))
            {
                return BadRequest(new { message = "Cannot delete a user who has active tasks. Reassign their tasks first." });
            }

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
