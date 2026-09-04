namespace CreditApp.Modules.Applications.Shared;

using System.Security.Cryptography;
using System.Text;

public static class EgnEncryptor
{
    public static string Encrypt(
        string plainText,
        string base64Key)
    {
        var key = Convert.FromBase64String(base64Key);

        using var aes = Aes.Create();
        aes.Key = key;
        aes.GenerateIV();

        using var encryptor = aes.CreateEncryptor();

        var plainBytes = Encoding.UTF8.GetBytes(plainText);
        var cipherBytes = encryptor.TransformFinalBlock(
            plainBytes,
            0,
            plainBytes.Length);

        var combined = new byte[aes.IV.Length + cipherBytes.Length];

        Buffer.BlockCopy(
            aes.IV,
            0,
            combined,
            0,
            aes.IV.Length);

        Buffer.BlockCopy(
            cipherBytes,
            0,
            combined,
            aes.IV.Length,
            cipherBytes.Length);

        return Convert.ToBase64String(combined);
    }

    public static string Decrypt(
        string cipherText,
        string base64Key)
    {
        var key = Convert.FromBase64String(base64Key);
        var combined = Convert.FromBase64String(cipherText);

        using var aes = Aes.Create();
        aes.Key = key;

        var iv = new byte[aes.IV.Length];

        Buffer.BlockCopy(
            combined,
            0,
            iv,
            0,
            iv.Length);

        aes.IV = iv;

        var cipherBytes = new byte[combined.Length - iv.Length];

        Buffer.BlockCopy(
            combined,
            iv.Length,
            cipherBytes,
            0,
            cipherBytes.Length);

        using var decryptor = aes.CreateDecryptor();
        var plainBytes = decryptor.TransformFinalBlock(
            cipherBytes,
            0,
            cipherBytes.Length);

        return Encoding.UTF8.GetString(plainBytes);
    }
}