namespace LodgingApp.Domain.ValueObjects
{
    public class PhoneNumber
    {
        public string Value { get; }
        public PhoneNumber(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
                throw new ArgumentException("Phone number required.");
            Value = value;
        }
    }
}
