"use client"

import { useEffect, useState } from "react"

interface ConfirmModalProps {
    isOpen: boolean
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    type?: "danger" | "warning" | "info"
    onConfirm: () => void
    onCancel: () => void
}

export default function ConfirmModal({
    isOpen,
    title,
    message,
    confirmText = "Onayla",
    cancelText = "İptal",
    type = "danger",
    onConfirm,
    onCancel,
}: ConfirmModalProps) {
    const [isClosing, setIsClosing] = useState(false)

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden"
        } else {
            document.body.style.overflow = ""
        }

        return () => {
            document.body.style.overflow = ""
        }
    }, [isOpen])

    const handleClose = () => {
        setIsClosing(true)
        setTimeout(() => {
            setIsClosing(false)
            onCancel()
        }, 200)
    }

    const handleConfirm = () => {
        setIsClosing(true)
        setTimeout(() => {
            setIsClosing(false)
            onConfirm()
        }, 200)
    }

    if (!isOpen && !isClosing) return null

    const icons = {
        danger: "🗑️",
        warning: "⚠️",
        info: "ℹ️",
    }

    return (
        <div className={`confirm-modal-overlay ${isClosing ? "closing" : ""}`} onClick={handleClose}>
            <div
                className={`confirm-modal ${isClosing ? "closing" : ""}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className={`confirm-modal-icon ${type}`}>
                    {icons[type]}
                </div>
                <h3 className="confirm-modal-title">{title}</h3>
                <p className="confirm-modal-message">{message}</p>
                <div className="confirm-modal-actions">
                    <button className="btn btn-secondary" onClick={handleClose}>
                        {cancelText}
                    </button>
                    <button className={`btn btn-${type}`} onClick={handleConfirm}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    )
}
