using AutoMapper;
using LodgingApp.Domain.ValueObjects;
using LodgingApp.Domain.Entities;

namespace LodgingApp.Application.Mapping
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            CreateMap<RegistrationRequest, User>();
            CreateMap<LoginRequest, User>();
            CreateMap<LodgingCreation, Lodging>();
            CreateMap<BookingRequest, Booking>();
            CreateMap<PaymentCreation, Payment>();
            CreateMap<ReviewCreation, Review>();
        }
    }
}