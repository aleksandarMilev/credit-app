namespace CreditApp.Shared;

using FluentResults.Extensions.AspNetCore;
using Microsoft.AspNetCore.Mvc;
using Modules.Applications.Shared.Errors;
using Modules.Identity.Shared.Errors;

public sealed class ResultProfile : DefaultAspNetCoreResultEndpointProfile
{
    public override ActionResult TransformFailedResultToActionResult(
        FailedResultToActionResultTransformationContext context)
    {
        var error = context.Result.Errors[0];

        return error switch
        {

            InvalidPasswordResetAttemptError or
            EmptyIdCardImageError or
            IdCardImageTooLargeError or
            InvalidIdCardImageExtensionError or
            IdCardImageContentTypeMismatchError or
            InvalidIdCardImageFormatError =>
                CreateProblem(
                    StatusCodes.Status400BadRequest,
                    "Bad Request",
                    error.Message),

            InvalidLoginAttemptError =>
                CreateProblem(
                    StatusCodes.Status401Unauthorized,
                    "Unauthorized",
                    error.Message),

            NoRoleAssignedError =>
                CreateProblem(
                    StatusCodes.Status403Forbidden,
                    "Forbidden",
                    error.Message),

            ApplicationNotFoundError =>
                CreateProblem(
                    StatusCodes.Status404NotFound,
                    "Not Found",
                    error.Message),

            ApplicationAlreadyReviewedError or
            PendingApplicationAlreadyExistsError =>
               CreateProblem(
                   StatusCodes.Status409Conflict,
                   "Conflict",
                   error.Message),

            AccountIsLockedError or
            AccountWasLockedError =>
                CreateProblem(
                    StatusCodes.Status423Locked,
                    "Locked",
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
