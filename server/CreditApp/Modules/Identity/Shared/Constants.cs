namespace CreditApp.Modules.Identity.Shared;

public static class Constants
{
    public static class Validation
    {
        public const int PasswordMinLength = 6;
        public const int PasswordMaxLength = 128;

        public const int EmailMinLength = 5;
        public const int EmailMaxLength = 254;

        public const int CredentialsMinLength = 3;
        public const int CredentialsMaxLength = EmailMaxLength;

        public const int NameMinLength = 2;
        public const int NameMaxLength = 100;
    }

    public static class TokenExpiration
    {
        public const int DefaultTokenExpirationTime = 7;

        public const int ExtendedTokenExpirationTime = 30;
    }
}
