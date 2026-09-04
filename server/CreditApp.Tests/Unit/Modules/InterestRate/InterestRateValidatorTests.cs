namespace CreditApp.Tests.Unit.Modules.InterestRate;

using CreditApp.Modules.InterestRate.Shared;

public class InterestRateValidatorTests
{
    [Theory]
    [InlineData(9.5)]
    [InlineData(0.01)]
    [InlineData(99.99)]
    public void IsValid_WithinBounds_ReturnsTrue(decimal rate)
    {
        var result = InterestRateValidator.IsValid(rate);

        Assert.True(result);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-5)]
    [InlineData(100)]
    [InlineData(150)]
    public void IsValid_OutOfBounds_ReturnsFalse(decimal rate)
    {
        var result = InterestRateValidator.IsValid(rate);

        Assert.False(result);
    }
}
