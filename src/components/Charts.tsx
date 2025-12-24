"use client"

interface ChartsProps {
    data: {
        labels: string[]
        yatirim: number[]
        cekim: number[]
    }
}

export default function Charts({ data }: ChartsProps) {
    const maxValue = Math.max(...data.yatirim, ...data.cekim, 1)

    return (
        <div className="charts-grid">
            {/* Bar Chart */}
            <div className="chart-card">
                <div className="chart-header">
                    <h3 className="chart-title">Panel Yatırım / Çekim</h3>
                    <div className="chart-legend">
                        <span className="legend-item">
                            <span className="legend-dot green"></span> Yatırım
                        </span>
                        <span className="legend-item">
                            <span className="legend-dot red"></span> Çekim
                        </span>
                    </div>
                </div>
                <div className="chart-body">
                    <div className="bar-chart">
                        {data.labels.map((label, index) => (
                            <div key={index} className="bar-group">
                                <div className="bars">
                                    <div
                                        className="bar yatirim"
                                        style={{ height: `${(data.yatirim[index] / maxValue) * 200}px` }}
                                        title={`Yatırım: ₺${data.yatirim[index].toLocaleString()}`}
                                    ></div>
                                    <div
                                        className="bar cekim"
                                        style={{ height: `${(data.cekim[index] / maxValue) * 200}px` }}
                                        title={`Çekim: ₺${data.cekim[index].toLocaleString()}`}
                                    ></div>
                                </div>
                                <span className="bar-label">{label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Pie Chart */}
            <div className="chart-card">
                <div className="chart-header">
                    <h3 className="chart-title">Yatırım / Çekim Oranı</h3>
                </div>
                <div className="chart-body">
                    <div className="pie-chart-wrapper">
                        <PieChart
                            yatirim={data.yatirim.reduce((a, b) => a + b, 0)}
                            cekim={data.cekim.reduce((a, b) => a + b, 0)}
                        />
                    </div>
                </div>
            </div>

            <style jsx>{`
        .chart-legend {
          display: flex;
          gap: 15px;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--text-muted);
        }
        .legend-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }
        .legend-dot.green { background-color: var(--success); }
        .legend-dot.red { background-color: var(--danger); }
        
        .bar-chart {
          display: flex;
          align-items: flex-end;
          justify-content: space-around;
          height: 250px;
          width: 100%;
          padding: 20px 0;
        }
        .bar-group {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        .bars {
          display: flex;
          gap: 4px;
          align-items: flex-end;
          height: 220px;
        }
        .bar {
          width: 20px;
          border-radius: 4px 4px 0 0;
          transition: height 0.3s ease;
          min-height: 4px;
        }
        .bar.yatirim { background: linear-gradient(180deg, #17c666, #0ea954); }
        .bar.cekim { background: linear-gradient(180deg, #ea4d4d, #d43d3d); }
        .bar:hover {
          opacity: 0.8;
        }
        .bar-label {
          font-size: 11px;
          color: var(--text-muted);
          font-weight: 500;
        }
        
        .pie-chart-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
      `}</style>
        </div>
    )
}

function PieChart({ yatirim, cekim }: { yatirim: number; cekim: number }) {
    const total = yatirim + cekim || 1
    const yatirimPercent = (yatirim / total) * 100
    const cekimPercent = (cekim / total) * 100

    return (
        <div className="pie-container">
            <svg viewBox="0 0 200 200" className="pie-svg">
                <circle
                    cx="100"
                    cy="100"
                    r="80"
                    fill="none"
                    stroke="var(--danger)"
                    strokeWidth="40"
                    strokeDasharray={`${cekimPercent * 5.027} 502.7`}
                    strokeDashoffset="0"
                    transform="rotate(-90 100 100)"
                />
                <circle
                    cx="100"
                    cy="100"
                    r="80"
                    fill="none"
                    stroke="var(--success)"
                    strokeWidth="40"
                    strokeDasharray={`${yatirimPercent * 5.027} 502.7`}
                    strokeDashoffset={`-${cekimPercent * 5.027}`}
                    transform="rotate(-90 100 100)"
                />
                <circle cx="100" cy="100" r="50" fill="var(--bg-card)" />
            </svg>
            <div className="pie-legend">
                <div className="pie-legend-item">
                    <span className="pie-dot green"></span>
                    <span>Yatırım: %{yatirimPercent.toFixed(1)}</span>
                </div>
                <div className="pie-legend-item">
                    <span className="pie-dot red"></span>
                    <span>Çekim: %{cekimPercent.toFixed(1)}</span>
                </div>
            </div>
            <style jsx>{`
        .pie-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }
        .pie-svg {
          width: 180px;
          height: 180px;
        }
        .pie-legend {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .pie-legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--text-dark);
        }
        .pie-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }
        .pie-dot.green { background-color: var(--success); }
        .pie-dot.red { background-color: var(--danger); }
      `}</style>
        </div>
    )
}
