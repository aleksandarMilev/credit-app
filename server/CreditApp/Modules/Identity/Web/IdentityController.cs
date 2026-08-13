namespace CreditApp.Modules.Identity.Web;

using CreditApp.Shared;
using FluentResults.Extensions;
using FluentResults.Extensions.AspNetCore;
using Microsoft.AspNetCore.Mvc;
using Service;
using Service.Models;
using Shared;
using Web.Models;

public class IdentityController(
    IIdentityService service) : ApiController
{
    [HttpPost("register/")]
    public async Task<ActionResult<JwtTokenServiceModel>> Register(
        RegisterWebModel webModel,
        CancellationToken cancellationToken = default)
        => await service
            .Register(
                webModel.ToRegisterServiceModel(),
                cancellationToken)
            .Map(static token => new JwtTokenServiceModel(token))
            .ToActionResult();

    [HttpPost("login/")]
    public async Task<ActionResult<JwtTokenServiceModel>> Login(
        LoginWebModel webModel,
        CancellationToken cancellationToken = default)
        => await service
            .Login(
                webModel.ToLoginServiceModel(),
                cancellationToken)
            .Map(static token => new JwtTokenServiceModel(token))
            .ToActionResult();
    

    [HttpPost("forgot-password/")]
    public async Task<ActionResult<MessageServiceModel>> ForgotPassword(
        ForgotPasswordWebModel webModel,
        CancellationToken cancellationToken = default)
        => await service
            .ForgotPassword(
                webModel.ToForgotPasswordServiceModel(),
                cancellationToken)
            .Map(static message => new MessageServiceModel(message))
            .ToActionResult();

    [HttpPost("reset-password/")]
    public async Task<ActionResult<MessageServiceModel>> ResetPassword(
        ResetPasswordWebModel webModel,
        CancellationToken cancellationToken = default)
        => await service
            .ResetPassword(
                webModel.ToResetPasswordServiceModel(),
                cancellationToken)
            .Map(static message => new MessageServiceModel(message))
            .ToActionResult();
}