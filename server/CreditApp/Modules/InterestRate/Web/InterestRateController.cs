namespace CreditApp.Modules.InterestRate.Web;

using CreditApp.Shared;
using FluentResults.Extensions.AspNetCore;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Service;
using Service.Models;
using Shared;
using Web.Models;

using static CreditApp.Shared.Constants.Names;

public class InterestRateController(
    IInterestRateService service) : ApiController
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<InterestRateServiceModel>> GetCurrent(
        CancellationToken cancellationToken = default)
        => await service
            .GetCurrentRate(cancellationToken)
            .ToActionResult();

    [HttpPut]
    [Authorize(Roles = ApproverRoleName)]
    public async Task<ActionResult<InterestRateServiceModel>> Update(
        UpdateInterestRateWebModel webModel,
        CancellationToken cancellationToken = default)
        => await service
            .UpdateRate(
                webModel.ToUpdateInterestRateServiceModel(),
                cancellationToken)
            .ToActionResult();
}
