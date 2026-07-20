namespace KiryanaStore.Domain.Interfaces;

public interface ICurrentUserContext
{
    int StoreId { get; }
    int UserId { get; }
    string Role { get; }
}
