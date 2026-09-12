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
    public class TasksController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TasksController(AppDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Retrieves tasks filtered by sprint, assignee, status, or task type.
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<TaskResponseDto>>> GetTasks(
            [FromQuery] Guid? sprintId,
            [FromQuery] Guid? assigneeId,
            [FromQuery] TaskStatus? status,
            [FromQuery] TaskType? taskType)
        {
            var query = _context.Tasks
                .Include(t => t.Assignee)
                .Include(t => t.Sprint)
                .AsQueryable();

            if (sprintId.HasValue)
            {
                query = query.Where(t => t.SprintId == sprintId.Value);
            }

            if (assigneeId.HasValue)
            {
                query = query.Where(t => t.AssigneeId == assigneeId.Value);
            }

            if (status.HasValue)
            {
                query = query.Where(t => t.Status == status.Value);
            }

            if (taskType.HasValue)
            {
                query = query.Where(t => t.TaskType == taskType.Value);
            }

            var tasks = await query
                .OrderBy(t => t.CreatedAt)
                .Select(t => new TaskResponseDto
                {
                    Id = t.Id,
                    Key = t.Key,
                    Title = t.Title,
                    Description = t.Description,
                    TaskType = t.TaskType,
                    Status = t.Status,
                    Priority = t.Priority,
                    StoryPoints = t.StoryPoints,
                    AssigneeId = t.AssigneeId,
                    AssigneeName = t.Assignee != null ? t.Assignee.Name : "Unassigned",
                    AssigneeAvatarUrl = t.Assignee != null ? t.Assignee.AvatarUrl : string.Empty,
                    SprintId = t.SprintId,
                    SprintName = t.Sprint != null ? t.Sprint.Name : "No Sprint",
                    CreatedAt = t.CreatedAt,
                    UpdatedAt = t.UpdatedAt
                })
                .ToListAsync();

            return Ok(tasks);
        }

        /// <summary>
        /// Retrieves a single task by ID.
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<TaskResponseDto>> GetTask(Guid id)
        {
            var t = await _context.Tasks
                .Include(x => x.Assignee)
                .Include(x => x.Sprint)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (t == null)
            {
                return NotFound(new { message = $"Task with ID {id} not found." });
            }

            return Ok(new TaskResponseDto
            {
                Id = t.Id,
                Key = t.Key,
                Title = t.Title,
                Description = t.Description,
                TaskType = t.TaskType,
                Status = t.Status,
                Priority = t.Priority,
                StoryPoints = t.StoryPoints,
                AssigneeId = t.AssigneeId,
                AssigneeName = t.Assignee != null ? t.Assignee.Name : "Unassigned",
                AssigneeAvatarUrl = t.Assignee != null ? t.Assignee.AvatarUrl : string.Empty,
                SprintId = t.SprintId,
                SprintName = t.Sprint != null ? t.Sprint.Name : "No Sprint",
                CreatedAt = t.CreatedAt,
                UpdatedAt = t.UpdatedAt
            });
        }

        /// <summary>
        /// Creates a new task. Every task must be assigned to a sprint and an assignee.
        /// Auto-generates unique task key (e.g. PJ-101).
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<TaskResponseDto>> CreateTask([FromBody] CreateTaskDto dto)
        {
            // Verify sprint exists
            var sprint = await _context.Sprints.FindAsync(dto.SprintId);
            if (sprint == null)
            {
                return BadRequest(new { message = $"Sprint with ID {dto.SprintId} does not exist. Each task must be assigned to a valid sprint." });
            }

            // Verify assignee exists
            var assignee = await _context.Users.FindAsync(dto.AssigneeId);
            if (assignee == null)
            {
                return BadRequest(new { message = $"Assignee with ID {dto.AssigneeId} does not exist." });
            }

            // Generate Key e.g. PJ-101
            var totalCount = await _context.Tasks.CountAsync();
            var nextKeyNumber = 101 + totalCount;
            var key = $"PJ-{nextKeyNumber}";

            var task = new TaskItem
            {
                Id = Guid.NewGuid(),
                Key = key,
                Title = dto.Title.Trim(),
                Description = dto.Description.Trim(),
                TaskType = dto.TaskType,
                Status = dto.Status,
                Priority = dto.Priority,
                StoryPoints = dto.StoryPoints,
                AssigneeId = dto.AssigneeId,
                SprintId = dto.SprintId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Tasks.Add(task);
            await _context.SaveChangesAsync();

            var response = new TaskResponseDto
            {
                Id = task.Id,
                Key = task.Key,
                Title = task.Title,
                Description = task.Description,
                TaskType = task.TaskType,
                Status = task.Status,
                Priority = task.Priority,
                StoryPoints = task.StoryPoints,
                AssigneeId = task.AssigneeId,
                AssigneeName = assignee.Name,
                AssigneeAvatarUrl = assignee.AvatarUrl,
                SprintId = task.SprintId,
                SprintName = sprint.Name,
                CreatedAt = task.CreatedAt,
                UpdatedAt = task.UpdatedAt
            };

            return CreatedAtAction(nameof(GetTask), new { id = task.Id }, response);
        }

        /// <summary>
        /// Updates task details, sprint assignment, or assignee.
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTask(Guid id, [FromBody] UpdateTaskDto dto)
        {
            var task = await _context.Tasks.FindAsync(id);
            if (task == null)
            {
                return NotFound(new { message = $"Task with ID {id} not found." });
            }

            var sprintExists = await _context.Sprints.AnyAsync(s => s.Id == dto.SprintId);
            if (!sprintExists)
            {
                return BadRequest(new { message = $"Sprint with ID {dto.SprintId} does not exist." });
            }

            var assigneeExists = await _context.Users.AnyAsync(u => u.Id == dto.AssigneeId);
            if (!assigneeExists)
            {
                return BadRequest(new { message = $"Assignee with ID {dto.AssigneeId} does not exist." });
            }

            task.Title = dto.Title.Trim();
            task.Description = dto.Description.Trim();
            task.TaskType = dto.TaskType;
            task.Status = dto.Status;
            task.Priority = dto.Priority;
            task.StoryPoints = dto.StoryPoints;
            task.AssigneeId = dto.AssigneeId;
            task.SprintId = dto.SprintId;
            task.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        /// <summary>
        /// Quick workflow transition: Draft -> In Progress -> Completed.
        /// </summary>
        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateTaskStatusDto dto)
        {
            var task = await _context.Tasks.FindAsync(id);
            if (task == null)
            {
                return NotFound(new { message = $"Task with ID {id} not found." });
            }

            task.Status = dto.Status;
            task.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { message = $"Task {task.Key} moved to {task.Status}.", status = task.Status });
        }

        /// <summary>
        /// Deletes a task by ID.
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTask(Guid id)
        {
            var task = await _context.Tasks.FindAsync(id);
            if (task == null)
            {
                return NotFound(new { message = $"Task with ID {id} not found." });
            }

            _context.Tasks.Remove(task);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
