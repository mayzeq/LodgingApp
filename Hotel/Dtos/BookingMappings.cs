using Hotel.Domain.Entities;

namespace Hotel.Dtos;
public static class BookingMappings
{
    public static GuestDto? ToGuestDto(Guest? g)
    {
        if (g is null) return null;
        return new GuestDto(
            g.GuestId,
            g.UserId,
            g.Surname,
            g.FirstName,
            g.Patronymic,
            g.Birthdate,
            g.Passport);
    }

    public static RoomTypeDto? ToRoomTypeDto(RoomType? rt)
    {
        if (rt is null) return null;
        return new RoomTypeDto(
            rt.RoomTypeId,
            rt.TypeName,
            rt.Description,
            rt.MaxGuests,
            rt.PricePerNight);
    }

    public static RoomDto? ToRoomDto(Room? r)
    {
        if (r is null) return null;
        return new RoomDto(
            r.RoomId,
            r.RoomTypeId,
            r.RoomNumber,
            r.Floor,
            r.Status,
            r.PhotoUrl,
            ToRoomTypeDto(r.RoomType));
    }

    public static RoomListItemDto ToRoomListItem(Room r, bool? isAvailable = null)
    {
        return new RoomListItemDto(
            r.RoomId,
            r.RoomTypeId,
            r.RoomNumber,
            r.Floor,
            r.Status,
            r.PhotoUrl,
            ToRoomTypeDto(r.RoomType),
            isAvailable);
    }

    public static ServiceBriefDto? ToServiceBriefDto(Service? s)
    {
        if (s is null) return null;
        return new ServiceBriefDto(
            s.ServiceId,
            s.ServiceName,
            s.Description,
            s.Price,
            s.IsIncluded);
    }

    public static PaymentDto? ToPaymentDto(Payment? p)
    {
        if (p is null) return null;
        return new PaymentDto(
            p.PaymentId,
            p.BookingId,
            p.Amount,
            p.Status,
            p.PaymentMethod,
            p.TransactionId,
            p.PaymentDatetime);
    }

    public static BookingGuestItemDto ToBookingGuestItemDto(BookingGuest bg)
    {
        return new BookingGuestItemDto(
            bg.BookingGuestId,
            bg.BookingId,
            bg.GuestId,
            bg.IsPrimary,
            ToGuestDto(bg.Guest));
    }

    public static BookingServiceLineDto ToBookingServiceLineDto(BookingService line)
    {
        return new BookingServiceLineDto(
            line.BookingServiceId,
            line.BookingId,
            line.ServiceId,
            line.GuestId,
            line.Quantity,
            line.TotalCost,
            line.AddedAt,
            ToServiceBriefDto(line.Service),
            ToGuestDto(line.Guest));
    }

    public static BookingDetailDto ToBookingDetailDto(Booking b)
    {
        return new BookingDetailDto(
            b.BookingId,
            b.GuestId,
            b.RoomId,
            b.CheckInDate,
            b.CheckOutDate,
            b.BookingDatetime,
            b.TotalPrice,
            b.Status,
            ToGuestDto(b.Guest),
            ToRoomDto(b.Room),
            ToPaymentDto(b.Payment),
            b.BookingGuests.Select(ToBookingGuestItemDto).ToList(),
            b.BookingServices.Select(ToBookingServiceLineDto).ToList(),
            b.Guest?.UserId,
            b.Guest?.User?.Login);
    }

    public static PaymentAdminDto ToPaymentAdminDto(Payment p)
    {
        var login = p.Booking?.Guest?.User?.Login;
        return new PaymentAdminDto(
            p.PaymentId,
            p.BookingId,
            p.Amount,
            p.Status,
            p.PaymentMethod,
            p.TransactionId,
            p.PaymentDatetime,
            login);
    }

    public static UserSummaryDto ToUserSummaryDto(User u)
    {
        return new UserSummaryDto(
            u.UserId,
            u.Login,
            u.Email,
            u.Phone,
            u.Role,
            u.IsActive,
            u.CreatedAt);
    }
}
