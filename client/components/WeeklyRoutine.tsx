"use client"

import { useState, useMemo } from "react"
import { Clock, ChevronDown, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface Block {
  start: string
  end: string
  label: string
  category: string
  location?: string
}

interface Day {
  day: string
  blocks: Block[]
}

export interface RoutineData {
  days: Day[]
}

export interface WeeklyRoutinePreviewProps {
  data: RoutineData
}

const categoryColors = {
  work: "bg-blue-100 border-blue-300 text-blue-800",
  workout: "bg-red-100 border-red-300 text-red-800",
  wakeup: "bg-amber-100 border-amber-300 text-amber-800",
  sleep: "bg-sky-100 border-sky-300 text-sky-800",
  relax: "bg-indigo-100 border-indigo-300 text-indigo-800",
  routine: "bg-emerald-100 border-emerald-300 text-emerald-800",
  goals: "bg-orange-100 border-orange-300 text-orange-800",
  hobby: "bg-pink-100 border-pink-300 text-pink-800",
  other: "bg-gray-100 border-gray-300 text-gray-800",
  meals: "bg-emerald-100 border-emerald-300 text-emerald-800",
}

const categoryDots = {
  work: "bg-blue-500",
  workout: "bg-red-500",
  wakeup: "bg-amber-400",
  sleep: "bg-sky-400",
  relax: "bg-indigo-400",
  routine: "bg-emerald-500",
  goals: "bg-orange-500",
  hobby: "bg-pink-400",
  other: "bg-gray-500",
  meals: "bg-emerald-500",
}

function parseTime(timeStr: string): { hours: number; minutes: number; nextDay: boolean } {
  const nextDay = timeStr.includes("+1")
  const cleanTime = timeStr.replace("+1", "")
  const [hours, minutes] = cleanTime.split(":").map(Number)
  return { hours, minutes, nextDay }
}

function getTimeInMinutes(timeStr: string): number {
  const { hours, minutes, nextDay } = parseTime(timeStr)
  return (nextDay ? 24 * 60 : 0) + hours * 60 + minutes
}

function generateHourSlots(): string[] {
  const slots = []
  for (let hour = 6; hour <= 23; hour++) {
    slots.push(`${hour.toString().padStart(2, "0")}:00`)
  }
  // Add early morning hours for next day
  for (let hour = 0; hour <= 5; hour++) {
    slots.push(`${hour.toString().padStart(2, "0")}:00`)
  }
  return slots
}

function formatTime12Hour(timeStr: string): string {
  const { hours, minutes } = parseTime(timeStr)
  const period = hours >= 12 ? "PM" : "AM"
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`
}

export default function WeeklyRoutinePreview({ data }: WeeklyRoutinePreviewProps) {
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("mobile")
  const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set())

  const hourSlots = useMemo(() => generateHourSlots(), [])

  const toggleDayCollapse = (dayName: string) => {
    const newCollapsed = new Set(collapsedDays)
    if (newCollapsed.has(dayName)) {
      newCollapsed.delete(dayName)
    } else {
      newCollapsed.add(dayName)
    }
    setCollapsedDays(newCollapsed)
  }

  const DesktopView = () => (
    <div className="space-y-4">
      {data.days.map((day) => (
        <Card key={day.day} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg overflow-hidden">
          <div
            className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
            onClick={() => toggleDayCollapse(day.day)}
          >
            {collapsedDays.has(day.day) ? (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
            <h3 className="text-xl font-semibold text-gray-800">{day.day}</h3>
            <div className="h-px bg-gray-200 flex-1" />
            <span className="text-sm text-gray-500">{day.blocks.length} activities</span>
          </div>

          {!collapsedDays.has(day.day) && (
            <div className="px-4 pb-4">
              <div className="space-y-2">
                {day.blocks.map((block, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-4 p-3 rounded-lg border-l-4 ${categoryColors[block.category as keyof typeof categoryColors]}`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div
                        className={`w-2 h-2 rounded-full ${categoryDots[block.category as keyof typeof categoryDots]}`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm truncate">{block.label}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-mono bg-white/50 px-2 py-1 rounded">
                      <Clock className="w-3 h-3" />
                      <span>
                        {formatTime12Hour(block.start)} - {formatTime12Hour(block.end)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  )

  const MobileView = () => {
    // Calculate the grid layout for each day
    const dayGridData = useMemo(() => {
      return data.days.map((day) => {
        const gridData: { [key: string]: any[] } = {}

        hourSlots.forEach((hourSlot) => {
          const hourMinutes = getTimeInMinutes(hourSlot)
          const nextHourMinutes = hourMinutes + 60

          // Find all blocks that span across this hour
          const blocksInHour = day.blocks.filter((block) => {
            const startMinutes = getTimeInMinutes(block.start)
            const endMinutes = getTimeInMinutes(block.end)
            return startMinutes < nextHourMinutes && endMinutes > hourMinutes
          })

          // For each block, calculate its position and determine if it should show text
          const processedBlocks = blocksInHour.map((block) => {
            const startMinutes = getTimeInMinutes(block.start)
            const endMinutes = getTimeInMinutes(block.end)
            const blockDurationMinutes = endMinutes - startMinutes

            // Calculate position within this hour
            const startPosition = Math.max(0, (startMinutes - hourMinutes) / 60)
            const endPosition = Math.min(1, (endMinutes - hourMinutes) / 60)

            // Calculate the absolute middle time of the entire block
            const blockMiddleMinutes = (startMinutes + endMinutes) / 2
            const currentHourMiddleMinutes = hourMinutes + 30

            // Show text in the hour slot that contains the middle of the block
            const shouldShowText =
              blockMiddleMinutes >= hourMinutes && blockMiddleMinutes < nextHourMinutes && blockDurationMinutes > 15

            return {
              ...block,
              startPosition,
              endPosition,
              height: endPosition - startPosition,
              durationMinutes: blockDurationMinutes,
              shouldShowText,
              blockId: `${block.label}-${block.category}-${startMinutes}`,
            }
          })

          gridData[hourSlot] = processedBlocks
        })

        return { day: day.day, gridData }
      })
    }, [data.days, hourSlots])

    return (
      <div className="space-y-4">
        {/* Grid View */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg overflow-hidden">
          <div className="overflow-auto max-h-[70vh]">
            <div className="min-w-max">
              {/* Header */}
              <div
                className="grid bg-gray-200 sticky top-0 z-20"
                style={{ gridTemplateColumns: `120px repeat(${data.days.length}, 140px)` }}
              >
                <div className="bg-gray-50 p-3 text-xs font-medium text-gray-600 text-center sticky left-0 z-30 border-r border-gray-200">
                  Time
                </div>
                {data.days.map((day) => (
                  <div
                    key={day.day}
                    className="bg-gray-50 p-3 text-xs font-medium text-gray-700 text-center border-r border-gray-200 last:border-r-0"
                  >
                    {day.day}
                  </div>
                ))}
              </div>

              {/* Hour slots */}
              <div
                className="bg-gray-200"
                style={{ display: "grid", gridTemplateColumns: `120px repeat(${data.days.length}, 140px)` }}
              >
                {hourSlots.map((hourSlot, hourIndex) => (
                  <div key={hourSlot} className="contents">
                    <div className="bg-white p-2 text-xs font-mono text-gray-500 text-center sticky left-0 z-10 border-r border-gray-200 border-b border-gray-200">
                      {formatTime12Hour(hourSlot)}
                    </div>
                    {dayGridData.map((dayData, dayIndex) => {
                      const blocksInHour = dayData.gridData[hourSlot] || []

                      return (
                        <div
                          key={`${dayData.day}-${hourSlot}`}
                          className="relative min-h-[3rem] bg-white border-r border-gray-200 border-b border-gray-200 last:border-r-0"
                          style={{ minHeight: "3rem" }}
                        >
                          {blocksInHour.map((block, blockIndex) => (
                            <div
                              key={`${block.blockId}-${blockIndex}`}
                              className={`absolute inset-x-0 flex items-center justify-center p-1 ${
                                categoryColors[block.category as keyof typeof categoryColors]
                              }`}
                              style={{
                                top: `${block.startPosition * 100}%`,
                                height: `${block.height * 100}%`,
                                minHeight: "0.5rem",
                                left: "1px",
                                right: "1px",
                              }}
                            >
                              {block.shouldShowText && (
                                <div className="text-center w-full px-1">
                                  <div className="font-semibold text-xs leading-tight truncate">{block.label}</div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Legend */}
        <Card className="p-3 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(categoryColors).map(([category]) => (
              <div key={category} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${categoryDots[category as keyof typeof categoryDots]}`} />
                <span className="capitalize text-gray-600">{category}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="flex justify-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-1 shadow-lg">
          <Button
            variant={viewMode === "desktop" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("desktop")}
            className="text-xs"
          >
            Timeline View
          </Button>
          <Button
            variant={viewMode === "mobile" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("mobile")}
            className="text-xs"
          >
            Grid View
          </Button>
        </div>
      </div>

      {viewMode === "desktop" ? <DesktopView /> : <MobileView />}
    </div>
  )
}
