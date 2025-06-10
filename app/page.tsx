"use client"

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Upload, Download, Clock, MapPin, Smartphone } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      router.push("/dashboard")
    }
  }, [user, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">Secure Vault Pro</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Advanced file storage with military-grade encryption, dynamic access control, and comprehensive security
            features.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" className="px-8">
                Get Started
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="outline" size="lg" className="px-8">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          <Card>
            <CardHeader>
              <Shield className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Military-Grade Security</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                AES-256 encryption with two-factor authentication and secure password hashing
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Clock className="h-8 w-8 text-green-600 mb-2" />
              <CardTitle>Dynamic Access Control</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Time-based, location-based, and device-based access restrictions</CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <MapPin className="h-8 w-8 text-purple-600 mb-2" />
              <CardTitle>Location Security</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Restrict file access based on geographic location and IP ranges</CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Smartphone className="h-8 w-8 text-orange-600 mb-2" />
              <CardTitle>Device Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Control access from specific devices and maintain device security logs</CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Upload className="h-8 w-8 text-red-600 mb-2" />
              <CardTitle>Secure Sharing</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Password-protected sharing with expiration dates and access permissions</CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Download className="h-8 w-8 text-indigo-600 mb-2" />
              <CardTitle>Audit Trail</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Comprehensive logging of all file access and user activities</CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Why Choose Secure Vault Pro?</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Unlike traditional cloud storage solutions, we offer unique dynamic access control features that adapt to
            your security needs in real-time.
          </p>
        </div>
      </div>
    </div>
  )
}
