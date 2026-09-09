namespace CreditApp.Shared.Services.FileStorage;

using Microsoft.Extensions.Options;
using Settings;

public class FileStorageService(
    IWebHostEnvironment env,
    IOptions<FileStorageSettings> settings) : IFileStorageService
{
    public async Task<string> Save(
        Stream content,
        string fileExtension,
        CancellationToken cancellationToken = default)
    {
        Directory.CreateDirectory(this.RootPath);

        var fileName = $"{Guid.NewGuid():N}{fileExtension}";
        var fullPath = Path.Combine(this.RootPath, fileName);

        await using var fileStream = new FileStream(
            fullPath,
            FileMode.CreateNew,
            FileAccess.Write);

        try
        {
            await content.CopyToAsync(
                fileStream,
                cancellationToken);
        }
        catch
        {
            fileStream.Close();
            File.Delete(fullPath);

            throw;
        }

        return fileName;
    }

    public Task<Stream> Read(
        string relativePath,
        CancellationToken cancellationToken = default)
    {
        var fullPath = this.ResolveContainedPath(relativePath);

        Stream stream = new FileStream(
            fullPath,
            FileMode.Open,
            FileAccess.Read);

        return Task.FromResult(stream);
    }

    public void Delete(string relativePath)
    {
        var fullPath = this.ResolveContainedPath(relativePath);

        if (File.Exists(fullPath))
        {
            File.Delete(fullPath);
        }
    }

    private string ResolveContainedPath(string relativePath)
    {
        var uploadsRootPath = Path.GetFullPath(this.RootPath);

        var normalizedRoot = uploadsRootPath.EndsWith(Path.DirectorySeparatorChar)
            ? uploadsRootPath
            : uploadsRootPath + Path.DirectorySeparatorChar;

        var combinedPath = Path.Combine(
            uploadsRootPath,
            relativePath);

        var fullPath = Path.GetFullPath(combinedPath);

        var escapesTheUploadsRoot = !fullPath.StartsWith(
            normalizedRoot,
            StringComparison.Ordinal);

        if (escapesTheUploadsRoot)
        {
            throw new InvalidOperationException("Resolved path escapes the uploads root.");
        }

        return fullPath;
    }

    private string RootPath
        => Path.Combine(
            env.ContentRootPath,
            settings.Value.UploadsRootPath);
}