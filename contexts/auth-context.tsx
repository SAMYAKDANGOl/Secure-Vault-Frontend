"use client"

import type React from "react"

import { supabase } from "@/lib/supabase"
import type { Session, User } from "@supabase/supabase-js"
import { createContext, useContext, useEffect, useState } from "react"

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<any>
  signUp: (email: string, password: string, metadata?: any) => Promise<void>
  signOut: () => Promise<void>
  verifyTwoFactor: (token: string, code: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("Error getting session:", error)
        }

        console.log("Initial session:", session)
        setSession(session)
        setUser(session?.user ?? null)

        // If we have a user, ensure their profile exists
        if (session?.user) {
          await ensureUserProfile(session.user)
        }
      } catch (error) {
        console.error("Error in getInitialSession:", error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.email)

      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)

      // If user signed in, ensure their profile exists
      if (event === "SIGNED_IN" && session?.user) {
        await ensureUserProfile(session.user)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const ensureUserProfile = async (user: User) => {
    try {
      console.log("Ensuring user profile exists for:", user.email)

      // Check if profile already exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (fetchError && fetchError.code !== "PGRST116") {
        console.error("Error fetching user profile:", fetchError)
        return
      }

      if (!existingProfile) {
        console.log("Creating new user profile...")

        // Create user profile
        const { error: insertError } = await supabase.from("user_profiles").insert({
          user_id: user.id,
          email: user.email,
          full_name: user.user_metadata?.fullName || user.email?.split("@")[0] || "User",
          phone: user.user_metadata?.phone || null,
          date_of_birth: user.user_metadata?.dateOfBirth || null,
          two_factor_enabled: user.user_metadata?.enableTwoFactor || false,
          email_notifications: true,
          security_alerts: true,
          session_timeout: 30,
          data_retention: 365,
          active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

        if (insertError) {
          console.error("Error creating user profile:", insertError)
        } else {
          console.log("User profile created successfully")
        }
      } else {
        console.log("User profile already exists")
      }
    } catch (error) {
      console.error("Error in ensureUserProfile:", error)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      console.log("Attempting to sign in:", email)

      // First attempt regular sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("Sign in error:", error)
        throw error
      }

      console.log("Sign in successful:", data.user?.email)

      // Check if user has 2FA enabled (this would be a backend call in production)
      // For now, we'll skip 2FA check
      return { requiresTwoFactor: false }
    } catch (error) {
      console.error("Sign in failed:", error)
      throw error
    }
  }

  const signUp = async (email: string, password: string, metadata?: any) => {
    try {
      console.log("Attempting to sign up:", email)

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata || {},
        },
      })

      if (error) {
        console.error("Sign up error:", error)
        throw error
      }

      console.log("Sign up successful:", data.user?.email)

      // The user profile will be created automatically when the auth state changes
      // due to the onAuthStateChange listener calling ensureUserProfile
    } catch (error) {
      console.error("Sign up failed:", error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      console.log("Signing out...")
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error("Sign out error:", error)
        throw error
      }
      console.log("Sign out successful")
    } catch (error) {
      console.error("Sign out failed:", error)
      throw error
    }
  }

  const verifyTwoFactor = async (tempToken: string, code: string) => {
    // This would be implemented with your backend 2FA system
    console.log("2FA verification not implemented yet")
  }

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    verifyTwoFactor,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
