"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Eye, Download, Upload, Trash2, Share, Lock, Search } from "lucide-react"
import { apiClient } from "@/lib/api"

interface AuditEntry {
  id: string
  action: string
  resource: string
  timestamp: string
  ipAddress: string
  userAgent: string
  location?: string
  success: boolean
  details?: any
}

export function AuditLog() {
  const [logs, setLogs] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [dateRange, setDateRange] = useState("7d")

  useEffect(() => {
    fetchLogs()
  }, [filter, dateRange, searchQuery])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get(`/audit/logs?filter=${filter}&range=${dateRange}&search=${searchQuery}`)
      setLogs(response.data || [])
    } catch (error) {
      console.error("Failed to fetch audit logs:", error)
    } finally {
      setLoading(false)
    }
  }

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case "view":
        return <Eye className="h-4 w-4" />
      case "download":
        return <Download className="h-4 w-4" />
      case "upload":
        return <Upload className="h-4 w-4" />
      case "delete":
        return <Trash2 className="h-4 w-4" />
      case "share":
        return <Share className="h-4 w-4" />
      case "login":
        return <Lock className="h-4 w-4" />
      default:
        return null
    }
  }

  const getActionColor = (action: string, success: boolean) => {
    if (!success) return "destructive"

    switch (action.toLowerCase()) {
      case "delete":
        return "destructive"
      case "share":
        return "default"
      case "upload":
        return "default"
      case "login":
        return "default"
      default:
        return "secondary"
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const handleSearch = () => {
    fetchLogs()
  }

  if (loading) {
    return <div>Loading audit logs...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <div className="flex-1">
          <Input
            placeholder="Search logs by resource, IP, or details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch()
              }
            }}
          />
        </div>

        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="login">Login</SelectItem>
            <SelectItem value="upload">Upload</SelectItem>
            <SelectItem value="download">Download</SelectItem>
            <SelectItem value="share">Share</SelectItem>
            <SelectItem value="delete">Delete</SelectItem>
          </SelectContent>
        </Select>

        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Date Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1d">Last 24h</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={handleSearch}>
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {logs.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No audit logs found</p>
        ) : (
          logs.map((log) => (
            <Card key={log.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getActionIcon(log.action)}
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{log.action}</span>
                        <Badge variant={getActionColor(log.action, log.success)}>
                          {log.success ? "Success" : "Failed"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">{log.resource}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-400 mt-1">
                        <span>{formatTimestamp(log.timestamp)}</span>
                        <span>{log.ipAddress}</span>
                        {log.location && <span>{log.location}</span>}
                      </div>
                    </div>
                  </div>
                  {log.details && (
                    <div className="text-xs text-gray-500 max-w-xs truncate">{JSON.stringify(log.details)}</div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
