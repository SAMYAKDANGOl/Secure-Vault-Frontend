"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useAuth } from "./auth-context"
import { useRouter } from "next/navigation"

interface SessionContextType {
  sessionTimeLeft: number
  extendSession: () => void
  isSessionWarning: boolean
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

const SESSION_TIMEOUT = 30 * 60 * 1000 // 30 minutes
const WARNING_TIME = 5 * 60 * 1000 // 5 minutes before timeout

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [sessionTimeLeft, setSessionTimeLeft] = useState(SESSION_TIMEOUT)
  const [isSessionWarning, setIsSessionWarning] = useState(false)
  const [lastActivity, setLastActivity] = useState(Date.now())
  const { user, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) return

    const updateActivity = () => {
      setLastActivity(Date.now())
      setSessionTimeLeft(SESSION_TIMEOUT)
      setIsSessionWarning(false)
    }

    // Track user activity
    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"]
    events.forEach((event) => {
      document.addEventListener(event, updateActivity, true)
    })

    // Session countdown timer
    const timer = setInterval(() => {
      const now = Date.now()
      const timeSinceActivity = now - lastActivity
      const timeLeft = SESSION_TIMEOUT - timeSinceActivity

      if (timeLeft <= 0) {
        // Session expired
        signOut()
        router.push("/auth/login?reason=session-expired")
      } else if (timeLeft <= WARNING_TIME) {
        setIsSessionWarning(true)
        setSessionTimeLeft(timeLeft)
      } else {
        setIsSessionWarning(false)
        setSessionTimeLeft(timeLeft)
      }
    }, 1000)

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, updateActivity, true)
      })
      clearInterval(timer)
    }
  }, [user, lastActivity, signOut, router])

  const extendSession = () => {
    setLastActivity(Date.now())
    setSessionTimeLeft(SESSION_TIMEOUT)
    setIsSessionWarning(false)
  }

  const value = {
    sessionTimeLeft,
    extendSession,
    isSessionWarning,
  }

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const context = useContext(SessionContext)
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider")
  }
  return context
}
