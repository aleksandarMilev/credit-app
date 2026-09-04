namespace CreditApp.Tests.Unit.TestHelpers;

using CreditApp.Modules.Identity.Data.Models;
using Microsoft.AspNetCore.Identity;
using Moq;

public static class MockUserManagerFactory
{
    public static Mock<UserManager<UserDbModel>> Create(IEnumerable<UserDbModel>? users = null)
    {
        var store = new Mock<IUserStore<UserDbModel>>();

        var userManager = new Mock<UserManager<UserDbModel>>(
            store.Object,
            null!,
            null!,
            null!,
            null!,
            null!,
            null!,
            null!,
            null!);

        userManager
            .Setup(static m => m.Users)
            .Returns((users ?? []).ToTestAsyncQueryable());

        userManager
            .Setup(static m => m.NormalizeName(It.IsAny<string>()))
            .Returns((string name) => name.ToUpperInvariant());

        userManager
            .Setup(static m => m.NormalizeEmail(It.IsAny<string>()))
            .Returns((string email) => email.ToUpperInvariant());

        return userManager;
    }
}
