namespace CreditApp.Modules.Applications.Shared;

public static class Constants
{
    public static class Validation
    {
        public const int NameMinLength = 2;
        public const int NameMaxLength = 100;

        public const int PhoneMinLength = 6;
        public const int PhoneMaxLength = 20;

        public const int EmailMinLength = 5;
        public const int EmailMaxLength = 254;

        public const int ReviewNoteMaxLength = 1_000;

        public const long MaxIdCardImageSizeBytes = 10 * 1_024 * 1_024;

        public const int EgnEncryptedMaxLength = 64;
    }

    public static class Paging
    {
        public const int MaxPageSize = 100;
    }
}
