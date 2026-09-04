namespace CreditApp.Tests.Unit.TestHelpers;

using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore.Query;

public static class TestAsyncQueryable
{
    public static IQueryable<T> ToTestAsyncQueryable<T>(
        this IEnumerable<T> source)
        => new TestAsyncEnumerable<T>(source);
}

internal sealed class TestAsyncEnumerable<T>(IEnumerable<T> enumerable) :
    EnumerableQuery<T>(enumerable),
    IAsyncEnumerable<T>,
    IQueryable<T>
{
    public TestAsyncEnumerable(Expression expression)
        : this([])
    {
        this.expression = expression;
    }

    private readonly Expression expression = Expression.Constant(enumerable.AsQueryable());

    IQueryProvider IQueryable.Provider => new TestAsyncQueryProvider<T>(this);

    Expression IQueryable.Expression => this.expression;

    public IAsyncEnumerator<T> GetAsyncEnumerator(
        CancellationToken cancellationToken = default)
        => new TestAsyncEnumerator<T>(this.AsEnumerable().GetEnumerator());
}

internal sealed class TestAsyncEnumerator<T>(
    IEnumerator<T> enumerator) : IAsyncEnumerator<T>
{
    public T Current => enumerator.Current;

    public ValueTask<bool> MoveNextAsync()
        => ValueTask.FromResult(enumerator.MoveNext());

    public ValueTask DisposeAsync()
    {
        enumerator.Dispose();

        return ValueTask.CompletedTask;
    }
}

internal sealed class TestAsyncQueryProvider<TEntity>(
    IQueryProvider inner) : IAsyncQueryProvider
{
    public IQueryable CreateQuery(Expression expression)
        => new TestAsyncEnumerable<TEntity>(expression);

    public IQueryable<TElement> CreateQuery<TElement>(Expression expression)
        => new TestAsyncEnumerable<TElement>(expression);

    public object? Execute(Expression expression)
        => inner.Execute(expression);

    public TResult Execute<TResult>(Expression expression)
        => inner.Execute<TResult>(expression);

    public TResult ExecuteAsync<TResult>(
        Expression expression,
        CancellationToken cancellationToken = default)
    {
        var resultType = typeof(TResult)
            .GetGenericArguments()
            .FirstOrDefault()
            ?? typeof(TResult);

        var executionResult = typeof(IQueryProvider)
            .GetMethod(
                nameof(IQueryProvider.Execute),
                1,
                [typeof(Expression)])!
            .MakeGenericMethod(resultType)
            .Invoke(inner, [expression]);

        return (TResult)typeof(Task)
            .GetMethod(nameof(Task.FromResult))!
            .MakeGenericMethod(resultType)
            .Invoke(null, [executionResult])!;
    }
}
