"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, X } from "lucide-react"

interface FileSearchProps {
  onSearchChange: (query: string) => void
}

export function FileSearch({ onSearchChange }: FileSearchProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [fileType, setFileType] = useState("all")
  const [sortBy, setSortBy] = useState("name")
  const [sortOrder, setSortOrder] = useState("asc")
  const [activeFilters, setActiveFilters] = useState<string[]>([])

  const handleSearch = () => {
    const filters = {
      query: searchQuery,
      type: fileType,
      sortBy,
      sortOrder,
    }

    onSearchChange(JSON.stringify(filters))

    // Update active filters display
    const newFilters = []
    if (searchQuery) newFilters.push(`Search: ${searchQuery}`)
    if (fileType !== "all") newFilters.push(`Type: ${fileType}`)
    if (sortBy !== "name") newFilters.push(`Sort: ${sortBy}`)
    setActiveFilters(newFilters)
  }

  const clearFilters = () => {
    setSearchQuery("")
    setFileType("all")
    setSortBy("name")
    setSortOrder("asc")
    setActiveFilters([])
    onSearchChange("")
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            placeholder="Search files by name, content, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <Button onClick={handleSearch}>
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Select value={fileType} onValueChange={setFileType}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="File Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="image">Images</SelectItem>
            <SelectItem value="document">Documents</SelectItem>
            <SelectItem value="video">Videos</SelectItem>
            <SelectItem value="audio">Audio</SelectItem>
            <SelectItem value="archive">Archives</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="size">Size</SelectItem>
            <SelectItem value="date">Date</SelectItem>
            <SelectItem value="type">Type</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortOrder} onValueChange={setSortOrder}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Order" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">Ascending</SelectItem>
            <SelectItem value="desc">Descending</SelectItem>
          </SelectContent>
        </Select>

        {activeFilters.length > 0 && (
          <Button variant="outline" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </div>

      {activeFilters.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {activeFilters.map((filter, index) => (
            <Badge key={index} variant="secondary">
              <Filter className="h-3 w-3 mr-1" />
              {filter}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
