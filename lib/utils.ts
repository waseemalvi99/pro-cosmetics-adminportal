import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5089"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-QA", {
    style: "currency",
    currency: "QAR",
    minimumFractionDigits: 2,
  }).format(amount)
}

export function getImageUrl(path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) return path
  return `${API_BASE_URL}${path}`
}
