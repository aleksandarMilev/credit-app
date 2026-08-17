namespace CreditApp.Shared;

using CreditApp.Modules.Identity.Shared.Errors;
using FluentResults.Extensions.AspNetCore;
using Microsoft.AspNetCore.Mvc;

public sealed class ResultProfile : DefaultAspNetCoreResultEndpointProfile
{
    public override ActionResult TransformFailedResultToActionResult(
        FailedResultToActionResultTransformationContext context)
    {
        var error = context.Result.Errors[0];

        return error switch
        {
            InvalidLoginAttemptError =>
                CreateProblem(
                    StatusCodes.Status401Unauthorized,
                    "Unauthorized",
                    error.Message),

            AccountIsLockedError or AccountWasLockedError =>
                CreateProblem(
                    StatusCodes.Status423Locked,
                    "Locked",
                    error.Message),

            NoRoleAssignedError =>
                CreateProblem(
                    StatusCodes.Status403Forbidden,
                    "Forbidden",
                    error.Message),

            InvalidPasswordResetAttemptError =>
                CreateProblem(
                    StatusCodes.Status400BadRequest,
                    "Bad Request",
                    error.Message),

            _ => base.TransformFailedResultToActionResult(context)
        };
    }

    private static ObjectResult CreateProblem(
        int statusCode,
        string title,
        string detail)
    {
        var problemDetails = new ProblemDetails
        {
            Status = statusCode,
            Title = title,
            Detail = detail
        };

        return new(problemDetails)
        {
            StatusCode = statusCode
        };
    }
}
