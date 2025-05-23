using System;
using System.ComponentModel.DataAnnotations;

namespace LodgingApp.Domain.ValueObjects
{
    public class BookingRequest
    {
        public required int LodgingId { get; set; }
        public required DateTime StartDate { get; set; }
        public required DateTime EndDate { get; set; }
    }
}
