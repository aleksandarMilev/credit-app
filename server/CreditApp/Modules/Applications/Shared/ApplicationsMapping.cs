namespace CreditApp.Modules.Applications.Shared;

using Data.Models;
using Service.Models;
using System.Linq.Expressions;
using Web.Models;

public static class ApplicationsMapping
{
    public static ApplicationDbModel ToApplicationDbModel(
        this SubmitApplicationServiceModel serviceModel,
        string imagePath,
        ApplicationStatus status) => new()
        {
            FirstName = serviceModel.FirstName,
            LastName = serviceModel.LastName,
            Egn = serviceModel.Egn,
            Phone = serviceModel.Phone,
            Email = serviceModel.Email,
            RequestedAmount = serviceModel.RequestedAmount,
            RequestedTermMonths = serviceModel.RequestedTermMonths,
            IdCardImagePath = imagePath,
            Status = status
        };

    public static SubmitApplicationServiceModel ToSubmitApplicationServiceModel(
        this SubmitApplicationWebModel webModel)
        => new(
            webModel.FirstName,
            webModel.LastName,
            webModel.Egn,
            webModel.Phone,
            webModel.Email,
            webModel.RequestedAmount,
            webModel.RequestedTermMonths,
            webModel.IdCardImage.OpenReadStream(),
            webModel.IdCardImage.ContentType,
            webModel.IdCardImage.FileName,
            webModel.IdCardImage.Length);

    public static UpdateApplicationStatusServiceModel ToUpdateApplicationStatusServiceModel(
        this UpdateApplicationStatusWebModel webModel,
        Guid applicationId,
        string reviewedByUsername)
        => new(
            applicationId,
            webModel.Decision == ApplicationDecision.Approved
                ? ApplicationStatus.Approved
                : ApplicationStatus.Rejected,
            webModel.Note,
            reviewedByUsername);

    public static ApplicationDetailServiceModel ToApplicationDetailServiceModel(
        this ApplicationDbModel application)
        => new(
            application.Id,
            application.FirstName,
            application.LastName,
            application.Egn,
            application.Phone,
            application.Email,
            application.RequestedAmount,
            application.RequestedTermMonths,
            application.Status,
            application.ReviewNote,
            application.ReviewedBy,
            application.ReviewedOn,
            application.CreatedOn);

    public static Expression<Func<ApplicationDbModel, ApplicationSummaryServiceModel>> ToApplicationSummaryServiceModel =>
        application => new(
            application.Id,
            application.FirstName,
            application.LastName,
            application.RequestedAmount,
            application.RequestedTermMonths,
            application.Status,
            application.CreatedOn);
}
