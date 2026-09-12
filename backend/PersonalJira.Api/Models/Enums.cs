using System.Text.Json.Serialization;

namespace PersonalJira.Api.Models
{
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public enum TaskStatus
    {
        Draft,
        InProgress,
        Completed
    }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public enum TaskType
    {
        Defect,
        UserStory,
        RandomTask
    }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public enum TaskPriority
    {
        Low,
        Medium,
        High,
        Critical
    }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public enum UserRole
    {
        Admin,
        Developer,
        QA,
        ProductOwner
    }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public enum SprintStatus
    {
        Planning,
        InProgress,
        Completed
    }
}
