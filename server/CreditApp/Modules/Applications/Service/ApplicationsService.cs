namespace CreditApp.Modules.Applications.Service;

using CreditApp.Shared.Data;
using CreditApp.Shared.Models;
using CreditApp.Shared.Services.FileStorage;
using Data.Models;
using Email;
using FluentResults;
using Microsoft.EntityFrameworkCore;
using Models;
using Shared;
using Shared.Errors;

using static CreditApp.Shared.Constants.DefaultValues;
using static Shared.Constants.Paging;
using static Shared.Constants.Validation;

public class ApplicationsService(
    CreditAppDbContext data,
    IFileStorageService fileStorage,
    IEmailSender emailSender,
    ILogger<ApplicationsService> logger) : IApplicationsService
{
    public async Task<Result<PagedResult<ApplicationSummaryServiceModel>>> GetAll(
        GetApplicationsQueryServiceModel query,
        CancellationToken cancellationToken = default)
    {
        var pageIndex = query.PageIndex < 1
            ? DefaultPageIndex
            : query.PageIndex;

        var pageSize = query.PageSize is < 1 or > MaxPageSize
            ? DefaultPageSize
            : query.PageSize;

        var applicationsQuery = data
            .Applications
            .AsNoTracking();

        if (query.Status is not null)
        {
            applicationsQuery = applicationsQuery
                .Where(a => a.Status == query.Status);
        }

        var totalCount = await applicationsQuery.CountAsync(cancellationToken);

        var items = await applicationsQuery
            .OrderByDescending(static a => a.CreatedOn)
            .Skip((pageIndex - 1) * pageSize)
            .Take(pageSize)
            .Select(ApplicationsMapping.ToApplicationSummaryServiceModel)
            .ToListAsync(cancellationToken);

        var applications = new PagedResult<ApplicationSummaryServiceModel>(
            items,
            totalCount,
            pageIndex,
            pageSize);

        return Result.Ok(applications);
    }

    public async Task<Result<ApplicationDetailServiceModel>> GetById(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var application = await data
            .Applications
            .AsNoTracking()
            .FirstOrDefaultAsync(
                a => a.Id == id,
                cancellationToken);

        if (application is null)
        {
            return Result.Fail<ApplicationDetailServiceModel>(
                new ApplicationNotFoundError());
        }

        return Result.Ok(application.ToApplicationDetailServiceModel());
    }

    public async Task<Result<ApplicationDocumentServiceModel>> GetDocument(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var application = await data
            .Applications
            .AsNoTracking()
            .FirstOrDefaultAsync(
                a => a.Id == id,
                cancellationToken);

        if (application is null)
        {
            return Result.Fail<ApplicationDocumentServiceModel>(
                new ApplicationNotFoundError());
        }

        var content = await fileStorage.Read(
            application.IdCardImagePath,
            cancellationToken);

        var contentType = GetContentType(application.IdCardImagePath);
        var serviceModel = new ApplicationDocumentServiceModel(
            content,
            contentType,
            application.IdCardImagePath);

        return Result.Ok(serviceModel);
    }

    public async Task<Result<Guid>> Submit(
        SubmitApplicationServiceModel serviceModel,
        CancellationToken cancellationToken = default)
    {
        var validationResult = IdCardImageValidator.Validate(
            serviceModel.IdCardImageContentType,
            serviceModel.IdCardImageFileName,
            serviceModel.IdCardImageSizeBytes,
            serviceModel.IdCardImageContent);

        if (validationResult != IdCardImageValidationResult.Valid)
        {
            return Result.Fail<Guid>(
                MapValidationError(validationResult));
        }

        var hasPendingApplication = await data
            .Applications
            .AsNoTracking()
            .Where(a => a.Status == ApplicationStatus.Pending)
            .Select(static a => a.Egn)
            .ToListAsync(cancellationToken);

        if (hasPendingApplication.Contains(serviceModel.Egn))
        {
            return Result.Fail<Guid>(
                new PendingApplicationAlreadyExistsError());
        }

        var extension = Path.GetExtension(serviceModel.IdCardImageFileName);

        string? imagePath = null;
        ApplicationDbModel application;

        try
        {
            imagePath = await fileStorage.Save(
                serviceModel.IdCardImageContent,
                extension,
                cancellationToken);

            application = serviceModel.ToApplicationDbModel(
                imagePath,
                ApplicationStatus.Pending);

            data.Add(application);

            await data.SaveChangesAsync(cancellationToken);
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Failed to submit application.");

            if (imagePath is not null)
            {
                fileStorage.Delete(imagePath);
            }

            throw;
        }

        try
        {
            await emailSender.SendApplicationSubmitted(
                application.Email,
                $"{application.FirstName} {application.LastName}",
                cancellationToken);
        }
        catch (Exception exception)
        {
            logger.LogError(
                exception,
                "Failed to send submission confirmation email. ApplicationId={ApplicationId}",
                application.Id);
        }

        return Result.Ok(application.Id);
    }

    public async Task<Result<ApplicationDetailServiceModel>> UpdateStatus(
        UpdateApplicationStatusServiceModel serviceModel,
        CancellationToken cancellationToken = default)
    {
        var application = await data
            .Applications
            .AsNoTracking()
            .FirstOrDefaultAsync(
                a => a.Id == serviceModel.ApplicationId,
                cancellationToken);

        if (application is null)
        {
            return Result.Fail<ApplicationDetailServiceModel>(
                new ApplicationNotFoundError());
        }

        if (application.Status != ApplicationStatus.Pending)
        {
            return Result.Fail<ApplicationDetailServiceModel>(
                new ApplicationAlreadyReviewedError());
        }

        var reviewedOn = DateTime.UtcNow;

        var affectedRows = await data
            .Applications
            .Where(a =>
                a.Id == serviceModel.ApplicationId &&
                a.Status == ApplicationStatus.Pending)
            .ExecuteUpdateAsync(
                setters => setters
                    .SetProperty(a => a.Status, serviceModel.Status)
                    .SetProperty(a => a.ReviewNote, serviceModel.Note)
                    .SetProperty(a => a.ReviewedBy, serviceModel.ReviewedByUsername)
                    .SetProperty(a => a.ReviewedOn, reviewedOn),
                cancellationToken);

        if (affectedRows == 0)
        {
            return Result.Fail<ApplicationDetailServiceModel>(
                new ApplicationAlreadyReviewedError());
        }

        var updatedApplication = application
            .ToApplicationDetailServiceModel() with
            {
                Status = serviceModel.Status,
                ReviewNote = serviceModel.Note,
                ReviewedBy = serviceModel.ReviewedByUsername,
                ReviewedOn = reviewedOn
            };

        try
        {
            var applicantName = $"{updatedApplication.FirstName} {updatedApplication.LastName}";

            if (updatedApplication.Status == ApplicationStatus.Approved)
            {
                await emailSender.SendApplicationApproved(
                    updatedApplication.Email,
                    applicantName,
                    cancellationToken);
            }
            else
            {
                await emailSender.SendApplicationRejected(
                    updatedApplication.Email,
                    applicantName,
                    cancellationToken);
            }
        }
        catch (Exception exception)
        {
            logger.LogError(
                exception,
                "Failed to send status-change email. ApplicationId={ApplicationId}",
                updatedApplication.Id);
        }

        return Result.Ok(updatedApplication);
    }

    private static string GetContentType(string fileName)
    {
        var extension = Path
            .GetExtension(fileName)
            .ToLowerInvariant();

        return extension switch
        {
            ".png" => "image/png",
            ".jpg" or ".jpeg" => "image/jpeg",
            _ => throw new InvalidOperationException(
                $"Unexpected file extension '{extension}' for a stored ID card image.")
        };
    }

    private static Error MapValidationError(IdCardImageValidationResult result)
        => result switch
        {
            IdCardImageValidationResult.Empty =>
                new EmptyIdCardImageError(),

            IdCardImageValidationResult.TooLarge =>
                new IdCardImageTooLargeError(
                    $"Файлът със снимката на личната карта трябва да е по-малък от {MaxIdCardImageSizeBytes / 1_024 / 1_024} MB."),

            IdCardImageValidationResult.InvalidExtension =>
                new InvalidIdCardImageExtensionError(),

            IdCardImageValidationResult.ContentTypeMismatch =>
                new IdCardImageContentTypeMismatchError(),

            IdCardImageValidationResult.ContentDoesNotMatchFormat =>
                new InvalidIdCardImageFormatError(),

            _ => throw new ArgumentOutOfRangeException(nameof(result))
        };
}
