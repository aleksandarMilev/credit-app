namespace CreditApp.Modules.Identity.Shared;

using Service.Models;
using Web.Models;

public static class IdentityMapping
{
    public static LoginServiceModel ToLoginServiceModel(
       this LoginWebModel webmodel)
       => new(
           webmodel.Credentials,
           webmodel.Password,
           webmodel.RememberMe);

    public static RegisterServiceModel ToRegisterServiceModel(
        this RegisterWebModel webmodel)
        => new(
            webmodel.Username,
            webmodel.Email,
            webmodel.Password,
            webmodel.FirstName,
            webmodel.LastName,
            webmodel.DateOfBirth);

    public static ForgotPasswordServiceModel ToForgotPasswordServiceModel(
       this ForgotPasswordWebModel webModel)
       => new(webModel.Email);

    public static ResetPasswordServiceModel ToResetPasswordServiceModel(
        this ResetPasswordWebModel webModel)
        => new(
            webModel.Email,
            webModel.Token,
            webModel.NewPassword);
}
