"use client"

import { useState } from "react"

interface DateRangePickerProps {
    onDateChange: (startDate: string, endDate: string) => void
}

export default function DateRangePicker({ onDateChange }: DateRangePickerProps) {
    const today = new Date().toISOString().split("T")[0]
    const [startDate, setStartDate] = useState(today)
    const [endDate, setEndDate] = useState(today)
    const [activePreset, setActivePreset] = useState<string | null>("today")

    const presets = [
        { id: "today", label: "Bugün" },
        { id: "week", label: "Bu Hafta" },
        { id: "month", label: "Bu Ay" },
        { id: "custom", label: "Özel" },
    ]

    const applyPreset = (presetId: string) => {
        setActivePreset(presetId)
        const now = new Date()
        let start = now
        let end = now

        switch (presetId) {
            case "today":
                start = end = now
                break
            case "week":
                start = new Date(now.setDate(now.getDate() - now.getDay()))
                end = new Date()
                break
            case "month":
                start = new Date(now.getFullYear(), now.getMonth(), 1)
                end = new Date()
                break
        }

        const startStr = start.toISOString().split("T")[0]
        const endStr = end.toISOString().split("T")[0]
        setStartDate(startStr)
        setEndDate(endStr)
        onDateChange(startStr, endStr)
    }

    const handleDateChange = (type: "start" | "end", value: string) => {
        setActivePreset("custom")
        if (type === "start") {
            setStartDate(value)
            onDateChange(value, endDate)
        } else {
            setEndDate(value)
            onDateChange(startDate, value)
        }
    }

    return (
        <div className="date-range-picker">
            <div className="preset-buttons">
                {presets.map((preset) => (
                    <button
                        key={preset.id}
                        className={`preset-btn ${activePreset === preset.id ? "active" : ""}`}
                        onClick={() => preset.id !== "custom" && applyPreset(preset.id)}
                    >
                        {preset.label}
                    </button>
                ))}
            </div>
            <div className="date-inputs">
                <div className="date-picker-wrapper">
                    <span>📅</span>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => handleDateChange("start", e.target.value)}
                    />
                    <span className="date-separator">—</span>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => handleDateChange("end", e.target.value)}
                    />
                </div>
            </div>
            <style jsx>{`
        .date-range-picker {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        .preset-buttons {
          display: flex;
          gap: 5px;
        }
        .preset-btn {
          padding: 8px 14px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background-color: var(--bg-card);
          color: var(--text-muted);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .preset-btn:hover {
          background-color: var(--bg-hover);
          color: var(--text-dark);
        }
        .preset-btn.active {
          background-color: var(--primary);
          border-color: var(--primary);
          color: white;
        }
        .date-inputs {
          display: flex;
        }
      `}</style>
        </div>
    )
}
