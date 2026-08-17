namespace CreditApp.Shared.Services.FileStorage;

using ServiceLifetimes;

public interface IFileStorageService : ISingletonService
{
    Task<string> Save(
        Stream content,
        string fileExtension,
        CancellationToken cancellationToken = default);

    Task<Stream> Read(
        string relativePath,
        CancellationToken cancellationToken = default);

    void Delete(string relativePath);
}
