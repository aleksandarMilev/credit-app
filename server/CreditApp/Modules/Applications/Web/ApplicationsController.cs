namespace CreditApp.Modules.Applications.Web;

using CreditApp.Shared;
using CreditApp.Shared.Models;
using CreditApp.Shared.Services.CurrentUser;
using Data.Models;
using FluentResults.Extensions;
using FluentResults.Extensions.AspNetCore;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Service;
using Service.Models;
using Shared;
using Web.Models;

using static CreditApp.Shared.Constants.ApiRoutes;
using static CreditApp.Shared.Constants.DefaultValues;
using static CreditApp.Shared.Constants.Names;

public class ApplicationsController(
    IApplicationsService service,
    ICurrentUserService currentUser) : ApiController
{
    [HttpGet]
    [Authorize(Roles = AllStaffRoles)]
    public async Task<ActionResult<PagedResult<ApplicationSummaryServiceModel>>> GetAll(
        [FromQuery] int pageIndex = DefaultPageIndex,
        [FromQuery] int pageSize = DefaultPageSize,
        [FromQuery] ApplicationStatus? status = null,
        CancellationToken cancellationToken = default)
        => await service
            .GetAll(
                new GetApplicationsQueryServiceModel(pageIndex, pageSize, status),
                cancellationToken)
            .ToActionResult();

    [HttpGet(Id)]
    [Authorize(Roles = AllStaffRoles)]
    public async Task<ActionResult<ApplicationDetailServiceModel>> GetById(
        Guid id,
        CancellationToken cancellationToken = default)
        => await service
            .GetById(id, cancellationToken)
            .ToActionResult();

    [HttpGet("{id}/document/")]
    [Authorize(Roles = AllStaffRoles)]
    public async Task<ActionResult> GetDocument(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var result = await service.GetDocument(
            id,
            cancellationToken);

        if (result.IsFailed)
        {
            return result.ToActionResult();
        }

        var document = result.Value;

        return this.File(
            document.Content,
            document.ContentType,
            document.FileName);
    }

    [HttpPut("{id}/status/")]
    [Authorize(Roles = ApproverRoleName)]
    public async Task<ActionResult<ApplicationDetailServiceModel>> UpdateStatus(
        Guid id,
        UpdateApplicationStatusWebModel webModel,
        CancellationToken cancellationToken = default)
    {
        var reviewer = currentUser.GetUsername()!;

        return await service
            .UpdateStatus(
                webModel.ToUpdateApplicationStatusServiceModel(id, reviewer),
                cancellationToken)
            .ToActionResult();
    }

    [HttpPost]
    [AllowAnonymous]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<ApplicationSubmittedServiceModel>> Submit(
        [FromForm] SubmitApplicationWebModel webModel,
        CancellationToken cancellationToken = default)
        => await service
            .Submit(
                webModel.ToSubmitApplicationServiceModel(),
                cancellationToken)
            .Map(static id => new ApplicationSubmittedServiceModel(id))
            .ToActionResult();
}
