"use client"

interface StatsCardsProps {
    stats: {
        toplamYatirim: number
        toplamCekim: number
        devir: number
        komisyon: number
    }
}

export default function StatsCards({ stats }: StatsCardsProps) {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("tr-TR", {
            style: "currency",
            currency: "TRY",
            minimumFractionDigits: 2,
        }).format(value)
    }

    const cards = [
        {
            label: "Toplam Yatırım",
            value: stats.toplamYatirim,
            icon: "💰",
            color: "green",
            trend: "+12.5%",
            trendUp: true,
        },
        {
            label: "Toplam Çekim",
            value: stats.toplamCekim,
            icon: "💸",
            color: "red",
            trend: "-8.2%",
            trendUp: false,
        },
        {
            label: "Kasa (Devir)",
            value: stats.devir,
            icon: "📊",
            color: "blue",
            trend: "+5.1%",
            trendUp: true,
        },
        {
            label: "Komisyon Kazanç",
            value: stats.komisyon,
            icon: "🏆",
            color: "yellow",
            trend: "+15.3%",
            trendUp: true,
        },
    ]

    return (
        <div className="stats-grid">
            {cards.map((card, index) => (
                <div key={index} className="stat-card">
                    <div className="stat-card-header">
                        <div className={`stat-icon ${card.color}`}>{card.icon}</div>
                        <span className={`stat-trend ${card.trendUp ? "up" : "down"}`}>
                            {card.trend}
                        </span>
                    </div>
                    <div className="stat-value">{formatCurrency(card.value)}</div>
                    <div className="stat-label">{card.label}</div>
                </div>
            ))}
        </div>
    )
}
