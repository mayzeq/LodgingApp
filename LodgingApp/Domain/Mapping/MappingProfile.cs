using AutoMapper;
using LodgingApp.Domain.DTOs;
using LodgingApp.Domain.Entities;

namespace LodgingApp.Domain.Mapping
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            CreateMap<RegisterDto, User>();
            CreateMap<LoginDto, User>();
            CreateMap<CreateLodgingDto, Lodging>();
            CreateMap<CreateBookingDto, Booking>();
            CreateMap<CreatePaymentDto, Payment>();
            CreateMap<CreateReviewDto, Review>();
        }
    }
}