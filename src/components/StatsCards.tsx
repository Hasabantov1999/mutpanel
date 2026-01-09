"use client"

interface StatsCardsProps {
    stats: {
        toplamYatirim: number
        toplamCekim: number
        devir: number
        komisyon: number
        araciKomisyon: number
        kasa: number
    }
    userRole?: string
}

export default function StatsCards({ stats, userRole }: StatsCardsProps) {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("tr-TR", {
            style: "currency",
            currency: "TRY",
            minimumFractionDigits: 2,
        }).format(value)
    }

    const cards = [
        {
            label: "GENEL KASA",
            value: stats.kasa,
            icon: "📊",
            color: "blue",
            show: true
        },
        {
            label: "Toplam Yatırım",
            value: stats.toplamYatirim,
            icon: "💰",
            color: "green",
            show: true
        },
        {
            label: "Toplam Çekim",
            value: stats.toplamCekim,
            icon: "💸",
            color: "red",
            show: true
        },
        {
            label: "Komisyon Kazanç",
            value: stats.komisyon,
            icon: "🏆",
            color: "yellow",
            show: true
        },
        {
            label: "Aracı Komisyon",
            value: stats.araciKomisyon,
            icon: "🤝",
            color: "purple",
            show: userRole === "SUPERADMIN" || userRole === "ADMIN"
        },
    ]

    return (
        <div className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
            {cards.filter(c => c.show).map((card, index) => (
                <div key={index} className="stat-card">
                    <div className="stat-card-header">
                        <div className={`stat-icon ${card.color}`}>{card.icon}</div>
                    </div>
                    <div className="stat-value">{formatCurrency(card.value)}</div>
                    <div className="stat-label">{card.label}</div>
                </div>
            ))}
        </div>
    )
}
