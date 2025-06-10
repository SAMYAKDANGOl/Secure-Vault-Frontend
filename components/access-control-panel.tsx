"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api"
import { Clock, MapPin, Plus, Smartphone, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"

interface AccessRule {
  id: string
  type: "time" | "location" | "device"
  name: string
  enabled: boolean
  config: any
}

export function AccessControlPanel() {
  const [rules, setRules] = useState<AccessRule[]>([])
  const [loading, setLoading] = useState(true)
  const [newRule, setNewRule] = useState<{
    type: "time" | "location" | "device"
    name: string
    config: any
  }>({
    type: "time",
    name: "",
    config: {},
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchRules()
  }, [])

  const fetchRules = async () => {
    try {
      const response = await apiClient.get("/access-control/rules")
      setRules(response.data || [])
    } catch (error) {
      console.error("Failed to fetch access rules:", error)
    } finally {
      setLoading(false)
    }
  }

  const createRule = async () => {
    try {
      await apiClient.post("/access-control/rules", newRule)
      await fetchRules()
      setNewRule({ type: "time", name: "", config: {} })
      toast({
        title: "Success",
        description: "Access rule created successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create access rule",
        variant: "destructive",
      })
    }
  }

  const toggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      await apiClient.post(`/access-control/rules/${ruleId}/toggle`, { enabled })
      await fetchRules()
      toast({
        title: "Success",
        description: `Access rule ${enabled ? "enabled" : "disabled"}`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update access rule",
        variant: "destructive",
      })
    }
  }

  const deleteRule = async (ruleId: string) => {
    try {
      await apiClient.delete(`/access-control/rules/${ruleId}`)
      await fetchRules()
      toast({
        title: "Success",
        description: "Access rule deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete access rule",
        variant: "destructive",
      })
    }
  }

  const getRuleIcon = (type: string) => {
    switch (type) {
      case "time":
        return <Clock className="h-4 w-4" />
      case "location":
        return <MapPin className="h-4 w-4" />
      case "device":
        return <Smartphone className="h-4 w-4" />
      default:
        return null
    }
  }

  const getRuleDescription = (rule: AccessRule) => {
    switch (rule.type) {
      case "time":
        return `Active ${rule.config.startTime} - ${rule.config.endTime}`
      case "location":
        return `Allowed from ${rule.config.countries?.join(", ") || "specified locations"}`
      case "device":
        return `${rule.config.allowedDevices?.length || 0} authorized devices`
      default:
        return "Custom access rule"
    }
  }

  if (loading) {
    return <div>Loading access control settings...</div>
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Create New Access Rule</CardTitle>
            <CardDescription>Set up dynamic access controls based on time, location, or device</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rule-type">Rule Type</Label>
                <Select value={newRule.type} onValueChange={(value: any) => setNewRule({ ...newRule, type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select rule type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="time">Time-based</SelectItem>
                    <SelectItem value="location">Location-based</SelectItem>
                    <SelectItem value="device">Device-based</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rule-name">Rule Name</Label>
                <Input
                  id="rule-name"
                  placeholder="Enter rule name"
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                />
              </div>
            </div>

            {newRule.type === "time" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    onChange={(e) =>
                      setNewRule({
                        ...newRule,
                        config: { ...newRule.config, startTime: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    onChange={(e) =>
                      setNewRule({
                        ...newRule,
                        config: { ...newRule.config, endTime: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
            )}

            {newRule.type === "location" && (
              <div className="space-y-2">
                <Label>Allowed Countries (comma-separated)</Label>
                <Input
                  placeholder="US, CA, UK"
                  onChange={(e) =>
                    setNewRule({
                      ...newRule,
                      config: { ...newRule.config, countries: e.target.value.split(",").map((c) => c.trim()) },
                    })
                  }
                />
              </div>
            )}

            {newRule.type === "device" && (
              <div className="space-y-2">
                <Label>Device Fingerprint</Label>
                <Input
                  placeholder="Device identifier"
                  onChange={(e) =>
                    setNewRule({
                      ...newRule,
                      config: { ...newRule.config, deviceId: e.target.value },
                    })
                  }
                />
              </div>
            )}

            <Button onClick={createRule} disabled={!newRule.name}>
              <Plus className="h-4 w-4 mr-2" />
              Create Rule
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Access Rules</CardTitle>
            <CardDescription>Manage your dynamic access control rules</CardDescription>
          </CardHeader>
          <CardContent>
            {rules.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No access rules configured</p>
            ) : (
              <div className="space-y-4">
                {rules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getRuleIcon(rule.type)}
                      <div>
                        <h4 className="font-medium">{rule.name}</h4>
                        <p className="text-sm text-gray-500">{getRuleDescription(rule)}</p>
                      </div>
                      <Badge variant={rule.enabled ? "default" : "secondary"}>
                        {rule.enabled ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                      checked={rule.enabled}
                      onCheckedChange={(checked: boolean) => toggleRule(rule.id, checked)}
                      />
                      <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteRule(rule.id)}
                      >
                      <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
