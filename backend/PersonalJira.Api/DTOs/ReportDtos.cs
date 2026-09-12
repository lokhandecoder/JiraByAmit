using System;
using System.Collections.Generic;

namespace PersonalJira.Api.DTOs
{
    public class SprintBurndownReportDto
    {
        public Guid SprintId { get; set; }
        public string SprintName { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int TotalEstimatedPoints { get; set; }
        public int RemainingPoints { get; set; }
        public int CompletedPoints { get; set; }
        public double CompletionPercentage { get; set; }
        public List<BurndownDataPointDto> DataPoints { get; set; } = new();
    }

    public class BurndownDataPointDto
    {
        public string Date { get; set; } = string.Empty; // YYYY-MM-DD
        public double IdealRemaining { get; set; }
        public int ActualRemaining { get; set; }
    }

    public class VelocityReportDto
    {
        public Guid SprintId { get; set; }
        public string SprintName { get; set; } = string.Empty;
        public int CommittedPoints { get; set; }
        public int CompletedPoints { get; set; }
    }

    public class TaskTypeDistributionDto
    {
        public string TypeName { get; set; } = string.Empty;
        public int Count { get; set; }
        public int TotalPoints { get; set; }
        public double Percentage { get; set; }
    }

    public class StatusDistributionDto
    {
        public string StatusName { get; set; } = string.Empty;
        public int Count { get; set; }
        public int TotalPoints { get; set; }
    }

    public class WorkloadReportDto
    {
        public Guid UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public int TotalTasks { get; set; }
        public int InProgressTasks { get; set; }
        public int CompletedTasks { get; set; }
        public int TotalPoints { get; set; }
    }
}
