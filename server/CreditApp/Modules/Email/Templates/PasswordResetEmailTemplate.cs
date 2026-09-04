namespace CreditApp.Modules.Email.Templates;

using static System.Net.WebUtility;

public static class PasswordResetEmailTemplate
{
    public static string Build(string resetUrl)
    {
        var safeUrl = HtmlEncode(resetUrl);

        return $"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            </head>
            <body style="margin:0; padding:0; background-color:#f4f5f7; font-family:Arial, Helvetica, sans-serif;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7; padding:24px 0;">
                    <tr>
                        <td align="center">
                            <table role="presentation" width="100%" style="max-width:480px; background-color:#ffffff; border-radius:8px; overflow:hidden;">
                                <tr>
                                    <td style="background-color:#1e3a8a; padding:24px 32px;">
                                        <span style="color:#ffffff; font-size:20px; font-weight:bold;">CreditApp</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding:32px;">
                                        <h1 style="margin:0 0 16px; font-size:22px; color:#111827;">Нулиране на паролата</h1>
                                        <p style="margin:0 0 24px; font-size:15px; line-height:1.6; color:#374151;">
                                            Получихме заявка за нулиране на вашата парола. Натиснете бутона по-долу, за да
                                            изберете нова парола. Тази връзка ще изтече скоро от съображения за сигурност.
                                        </p>
                                        <table role="presentation" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="border-radius:6px; background-color:#1e3a8a;">
                                                    <a href="{safeUrl}" style="display:inline-block; padding:12px 24px; font-size:15px; color:#ffffff; text-decoration:none; font-weight:bold;">
                                                        Нулиране на паролата
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding:20px 32px; border-top:1px solid #e5e7eb;">
                                        <p style="margin:0; font-size:12px; color:#9ca3af;">
                                            Ако не сте заявявали нулиране на паролата, можете спокойно да игнорирате този имейл —
                                            паролата ви няма да бъде променена.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
            """;
    }
}
