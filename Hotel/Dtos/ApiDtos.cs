namespace Hotel.Dtos;

public record GuestDto(
    int GuestId,
    int UserId,
    string Surname,
    string FirstName,
    string? Patronymic,
    DateOnly Birthdate,
    string Passport);

public record RoomTypeDto(
    int RoomTypeId,
    string TypeName,
    string? Description,
    int MaxGuests,
    decimal PricePerNight);

public record RoomDto(
    int RoomId,
    int RoomTypeId,
    string RoomNumber,
    int Floor,
    string Status,
    string? PhotoUrl,
    RoomTypeDto? RoomType);

/// <summary>Номер для списка в UI (опционально доступность на датах).</summary>
public record RoomListItemDto(
    int RoomId,
    int RoomTypeId,
    string RoomNumber,
    int Floor,
    string Status,
    string? PhotoUrl,
    RoomTypeDto? RoomType,
    bool? IsAvailable);

public record ServiceBriefDto(
    int ServiceId,
    string ServiceName,
    string? Description,
    decimal Price,
    bool IsIncluded);

public record PaymentDto(
    int PaymentId,
    int BookingId,
    decimal Amount,
    string Status,
    string PaymentMethod,
    string TransactionId,
    DateTime PaymentDatetime);

public record BookingGuestItemDto(
    int BookingGuestId,
    int BookingId,
    int GuestId,
    bool IsPrimary,
    GuestDto? Guest);

public record BookingServiceLineDto(
    int BookingServiceId,
    int BookingId,
    int ServiceId,
    int? GuestId,
    int Quantity,
    decimal TotalCost,
    DateTime AddedAt,
    ServiceBriefDto? Service,
    GuestDto? Guest);

public record BookingDetailDto(
    int BookingId,
    int GuestId,
    int RoomId,
    DateOnly CheckInDate,
    DateOnly CheckOutDate,
    DateTime BookingDatetime,
    decimal TotalPrice,
    string Status,
    GuestDto? Guest,
    RoomDto? Room,
    PaymentDto? Payment,
    IReadOnlyList<BookingGuestItemDto> BookingGuests,
    IReadOnlyList<BookingServiceLineDto> BookingServices,
    int? OwnerUserId,
    string? OwnerLogin);

public record PaymentAdminDto(
    int PaymentId,
    int BookingId,
    decimal Amount,
    string Status,
    string PaymentMethod,
    string TransactionId,
    DateTime PaymentDatetime,
    string? PayerLogin);

public record UserSummaryDto(
    int UserId,
    string Login,
    string Email,
    string? Phone,
    string Role,
    bool IsActive,
    DateTime CreatedAt);
