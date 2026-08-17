
namespace CreditApp.Modules.Applications.Web.Attributes;

using System.ComponentModel.DataAnnotations;

public sealed class ValidEgnAttribute : ValidationAttribute
{
    private static readonly int[] Weights = [2, 4, 8, 5, 10, 9, 7, 3, 6];

    public override bool IsValid(object? value)
        => value is string egn && IsValidEgn(egn);

    private static bool IsValidEgn(string egn)
    {
        var isInvalidEgn =
            string.IsNullOrWhiteSpace(egn) ||
            egn.Length != 10 ||
            !egn.All(char.IsDigit);

        if (isInvalidEgn)
        {
            return false;
        }

        var year = int.Parse(egn.AsSpan(0, 2));
        var month = int.Parse(egn.AsSpan(2, 2));
        var day = int.Parse(egn.AsSpan(4, 2));

        if (month >= 21 && month <= 32)
        {
            year += 1_800;
            month -= 20;
        }
        else if (month >= 41 && month <= 52)
        {
            year += 2_000;
            month -= 40;
        }
        else if (month >= 1 && month <= 12)
        {
            year += 1_900;
        }
        else
        {
            return false;
        }

        var isInvalidBirthDate =
            day < 1 ||
            day > DateTime.DaysInMonth(year, month);

        if (isInvalidBirthDate)
        {
            return false;
        }

        var sum = 0;

        for (var i = 0; i < 9; i++)
        {
            sum += (egn[i] - '0') * Weights[i];
        }

        var checksum = sum % 11;

        if (checksum == 10)
        {
            checksum = 0;
        }

        return checksum == (egn[9] - '0');
    }
}
