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
    public class ReportsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ReportsController(AppDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Calculates burndown chart metrics for a given sprint.
        /// </summary>
        [HttpGet("sprint/{sprintId}/burndown")]
        public async Task<ActionResult<SprintBurndownReportDto>> GetSprintBurndown(Guid sprintId)
        {
            var sprint = await _context.Sprints
                .Include(s => s.Tasks)
                .FirstOrDefaultAsync(s => s.Id == sprintId);

            if (sprint == null)
            {
                return NotFound(new { message = $"Sprint with ID {sprintId} not found." });
            }

            var totalEstimated = sprint.Tasks.Sum(t => t.StoryPoints);
            var completedPoints = sprint.Tasks.Where(t => t.Status == TaskStatus.Completed).Sum(t => t.StoryPoints);
            var remainingPoints = totalEstimated - completedPoints;
            var completionPct = totalEstimated > 0 ? Math.Round((double)completedPoints / totalEstimated * 100, 1) : 0.0;

            // Generate daily trajectory points between StartDate and EndDate
            var dataPoints = new List<BurndownDataPointDto>();
            var daysCount = (sprint.EndDate.Date - sprint.StartDate.Date).Days;
            if (daysCount < 1) daysCount = 14;

            for (int i = 0; i <= daysCount; i++)
            {
                var currentDate = sprint.StartDate.AddDays(i);
                var idealRemaining = Math.Max(0, Math.Round(totalEstimated - (double)totalEstimated * i / daysCount, 1));

                // For simulation/reporting: actual remaining decreases as tasks are completed
                int actualRemaining;
                if (currentDate <= DateTime.UtcNow)
                {
                    // Linear decay down to current remaining points
                    var progressRatio = (double)i / Math.Max(1, (DateTime.UtcNow - sprint.StartDate).Days);
                    progressRatio = Math.Min(1.0, progressRatio);
                    actualRemaining = (int)Math.Round(totalEstimated - (totalEstimated - remainingPoints) * progressRatio);
                }
                else
                {
                    actualRemaining = remainingPoints;
                }

                dataPoints.Add(new BurndownDataPointDto
                {
                    Date = currentDate.ToString("yyyy-MM-dd"),
                    IdealRemaining = idealRemaining,
                    ActualRemaining = actualRemaining
                });
            }

            return Ok(new SprintBurndownReportDto
            {
                SprintId = sprint.Id,
                SprintName = sprint.Name,
                StartDate = sprint.StartDate,
                EndDate = sprint.EndDate,
                TotalEstimatedPoints = totalEstimated,
                RemainingPoints = remainingPoints,
                CompletedPoints = completedPoints,
                CompletionPercentage = completionPct,
                DataPoints = dataPoints
            });
        }

        /// <summary>
        /// Calculates sprint velocity across all completed and active sprints.
        /// </summary>
        [HttpGet("velocity")]
        public async Task<ActionResult<IEnumerable<VelocityReportDto>>> GetVelocity()
        {
            var sprints = await _context.Sprints
                .Include(s => s.Tasks)
                .OrderBy(s => s.StartDate)
                .Select(s => new VelocityReportDto
                {
                    SprintId = s.Id,
                    SprintName = s.Name,
                    CommittedPoints = s.Tasks.Sum(t => t.StoryPoints),
                    CompletedPoints = s.Tasks.Where(t => t.Status == TaskStatus.Completed).Sum(t => t.StoryPoints)
                })
                .ToListAsync();

            return Ok(sprints);
        }

        /// <summary>
        /// Task type distribution (Defect, UserStory, RandomTask).
        /// </summary>
        [HttpGet("distribution/type")]
        public async Task<ActionResult<IEnumerable<TaskTypeDistributionDto>>> GetTaskTypeDistribution([FromQuery] Guid? sprintId)
        {
            var query = _context.Tasks.AsQueryable();
            if (sprintId.HasValue)
            {
                query = query.Where(t => t.SprintId == sprintId.Value);
            }

            var totalTasks = await query.CountAsync();
            if (totalTasks == 0)
            {
                return Ok(new List<TaskTypeDistributionDto>());
            }

            var distribution = await query
                .GroupBy(t => t.TaskType)
                .Select(g => new
                {
                    Type = g.Key,
                    Count = g.Count(),
                    Points = g.Sum(t => t.StoryPoints)
                })
                .ToListAsync();

            var result = distribution.Select(d => new TaskTypeDistributionDto
            {
                TypeName = d.Type.ToString(),
                Count = d.Count,
                TotalPoints = d.Points,
                Percentage = Math.Round((double)d.Count / totalTasks * 100, 1)
            }).ToList();

            return Ok(result);
        }

        /// <summary>
        /// Task status distribution (Draft, InProgress, Completed).
        /// </summary>
        [HttpGet("distribution/status")]
        public async Task<ActionResult<IEnumerable<StatusDistributionDto>>> GetStatusDistribution([FromQuery] Guid? sprintId)
        {
            var query = _context.Tasks.AsQueryable();
            if (sprintId.HasValue)
            {
                query = query.Where(t => t.SprintId == sprintId.Value);
            }

            var distribution = await query
                .GroupBy(t => t.Status)
                .Select(g => new StatusDistributionDto
                {
                    StatusName = g.Key.ToString(),
                    Count = g.Count(),
                    TotalPoints = g.Sum(t => t.StoryPoints)
                })
                .ToListAsync();

            return Ok(distribution);
        }

        /// <summary>
        /// Workload distribution by assignee across the team.
        /// </summary>
        [HttpGet("team-workload")]
        public async Task<ActionResult<IEnumerable<WorkloadReportDto>>> GetTeamWorkload([FromQuery] Guid? sprintId)
        {
            var query = _context.Tasks
                .Include(t => t.Assignee)
                .AsQueryable();

            if (sprintId.HasValue)
            {
                query = query.Where(t => t.SprintId == sprintId.Value);
            }

            var tasks = await query.ToListAsync();

            var users = await _context.Users.ToListAsync();

            var workload = users.Select(u =>
            {
                var userTasks = tasks.Where(t => t.AssigneeId == u.Id).ToList();
                return new WorkloadReportDto
                {
                    UserId = u.Id,
                    UserName = u.Name,
                    Role = u.Role.ToString(),
                    TotalTasks = userTasks.Count,
                    InProgressTasks = userTasks.Count(t => t.Status == TaskStatus.InProgress),
                    CompletedTasks = userTasks.Count(t => t.Status == TaskStatus.Completed),
                    TotalPoints = userTasks.Sum(t => t.StoryPoints)
                };
            }).OrderByDescending(w => w.TotalTasks).ToList();

            return Ok(workload);
        }
    }
}
