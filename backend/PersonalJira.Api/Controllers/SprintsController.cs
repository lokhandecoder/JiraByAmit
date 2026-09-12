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
    public class SprintsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SprintsController(AppDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Retrieves all sprints with aggregate task and story point statistics.
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<SprintResponseDto>>> GetSprints()
        {
            var sprints = await _context.Sprints
                .Include(s => s.Tasks)
                .OrderByDescending(s => s.StartDate)
                .Select(s => new SprintResponseDto
                {
                    Id = s.Id,
                    Name = s.Name,
                    Goal = s.Goal,
                    StartDate = s.StartDate,
                    EndDate = s.EndDate,
                    Status = s.Status,
                    CreatedAt = s.CreatedAt,
                    TotalTasks = s.Tasks.Count,
                    CompletedTasks = s.Tasks.Count(t => t.Status == TaskStatus.Completed),
                    TotalStoryPoints = s.Tasks.Sum(t => t.StoryPoints),
                    CompletedStoryPoints = s.Tasks.Where(t => t.Status == TaskStatus.Completed).Sum(t => t.StoryPoints)
                })
                .ToListAsync();

            return Ok(sprints);
        }

        /// <summary>
        /// Retrieves a sprint by ID.
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<SprintResponseDto>> GetSprint(Guid id)
        {
            var s = await _context.Sprints
                .Include(sp => sp.Tasks)
                .FirstOrDefaultAsync(sp => sp.Id == id);

            if (s == null)
            {
                return NotFound(new { message = $"Sprint with ID {id} not found." });
            }

            return Ok(new SprintResponseDto
            {
                Id = s.Id,
                Name = s.Name,
                Goal = s.Goal,
                StartDate = s.StartDate,
                EndDate = s.EndDate,
                Status = s.Status,
                CreatedAt = s.CreatedAt,
                TotalTasks = s.Tasks.Count,
                CompletedTasks = s.Tasks.Count(t => t.Status == TaskStatus.Completed),
                TotalStoryPoints = s.Tasks.Sum(t => t.StoryPoints),
                CompletedStoryPoints = s.Tasks.Where(t => t.Status == TaskStatus.Completed).Sum(t => t.StoryPoints)
            });
        }

        /// <summary>
        /// Creates a new sprint in Planning status.
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<SprintResponseDto>> CreateSprint([FromBody] CreateSprintDto dto)
        {
            if (dto.EndDate <= dto.StartDate)
            {
                return BadRequest(new { message = "Sprint EndDate must be strictly after StartDate." });
            }

            var sprint = new Sprint
            {
                Id = Guid.NewGuid(),
                Name = dto.Name.Trim(),
                Goal = dto.Goal.Trim(),
                StartDate = DateTime.SpecifyKind(dto.StartDate, DateTimeKind.Utc),
                EndDate = DateTime.SpecifyKind(dto.EndDate, DateTimeKind.Utc),
                Status = SprintStatus.Planning,
                CreatedAt = DateTime.UtcNow
            };

            _context.Sprints.Add(sprint);
            await _context.SaveChangesAsync();

            var response = new SprintResponseDto
            {
                Id = sprint.Id,
                Name = sprint.Name,
                Goal = sprint.Goal,
                StartDate = sprint.StartDate,
                EndDate = sprint.EndDate,
                Status = sprint.Status,
                CreatedAt = sprint.CreatedAt,
                TotalTasks = 0,
                CompletedTasks = 0,
                TotalStoryPoints = 0,
                CompletedStoryPoints = 0
            };

            return CreatedAtAction(nameof(GetSprint), new { id = sprint.Id }, response);
        }

        /// <summary>
        /// Updates sprint details or status.
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateSprint(Guid id, [FromBody] UpdateSprintDto dto)
        {
            var sprint = await _context.Sprints.FindAsync(id);
            if (sprint == null)
            {
                return NotFound(new { message = $"Sprint with ID {id} not found." });
            }

            sprint.Name = dto.Name.Trim();
            sprint.Goal = dto.Goal.Trim();
            sprint.StartDate = DateTime.SpecifyKind(dto.StartDate, DateTimeKind.Utc);
            sprint.EndDate = DateTime.SpecifyKind(dto.EndDate, DateTimeKind.Utc);
            sprint.Status = dto.Status;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        /// <summary>
        /// Transitions a sprint into InProgress status.
        /// </summary>
        [HttpPost("{id}/start")]
        public async Task<IActionResult> StartSprint(Guid id)
        {
            var sprint = await _context.Sprints.FindAsync(id);
            if (sprint == null)
            {
                return NotFound(new { message = $"Sprint with ID {id} not found." });
            }

            sprint.Status = SprintStatus.InProgress;
            await _context.SaveChangesAsync();
            return Ok(new { message = $"Sprint '{sprint.Name}' is now active." });
        }

        /// <summary>
        /// Completes a sprint.
        /// </summary>
        [HttpPost("{id}/complete")]
        public async Task<IActionResult> CompleteSprint(Guid id)
        {
            var sprint = await _context.Sprints.FindAsync(id);
            if (sprint == null)
            {
                return NotFound(new { message = $"Sprint with ID {id} not found." });
            }

            sprint.Status = SprintStatus.Completed;
            await _context.SaveChangesAsync();
            return Ok(new { message = $"Sprint '{sprint.Name}' has been marked completed." });
        }
    }
}
