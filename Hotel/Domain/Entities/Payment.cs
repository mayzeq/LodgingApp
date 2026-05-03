namespace Hotel.Domain.Entities;

public class Payment
{
    public int PaymentId { get; set; }
    public int OrderId { get; set; }
    public string TransactionId { get; set; } = string.Empty;
    public DateTime PaymentDatetime { get; set; } = DateTime.UtcNow;
    public string PaymentMethod { get; set; } = "card";
    public decimal Amount { get; set; }
    public string Status { get; set; } = "created";

    public Order? Order { get; set; }
}
