using System.Text.Json.Serialization;
using LodgingApp.Domain.Entities;

    namespace LodgingApp.Domain.Entities
    {
        /// <summary>
        /// Предстваляет сущность администратора жилья
        /// </summary>
        public class Admin
        {
            /// <summary>
            /// Уникальный идентификатор администратора жилья.
            /// </summary>
            public int AdminId { get; set; }
            /// <summary>
            /// Уникальный идентификатор пользователя, который является администратором жилья.
            /// </summary>
            public int UserId { get; set; }
            /// <summary>
            /// Тип администратора жилья (Владелец, Модератор).
            /// </summary>
            public required string Type { get; set; }

            [JsonIgnore]
            public User? User { get; set; }
            [JsonIgnore]
            public List<Lodging>? Lodgings { get; set; }
        }
    }
