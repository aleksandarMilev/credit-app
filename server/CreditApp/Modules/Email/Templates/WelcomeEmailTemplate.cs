namespace CreditApp.Modules.Email.Templates;

using static System.Net.WebUtility;

public static class WelcomeEmailTemplate
{
    public static string Build(
        string username,
        string appUrl)
    {
        var safeUrl = HtmlEncode(appUrl);

        return "";
    }
}
