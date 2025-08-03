'use client'
import WeeklyRoutinePreview, { RoutineData } from "@/components/WeeklyRoutine";
import { useEffect, useState } from "react";

const sampleData = {
    days: [
      {
        day: "Mon",
        blocks: [
          { start: "06:30", end: "07:00", label: "Wake-up & Hygiene", category: "routine" },
          { start: "07:00", end: "07:30", label: "Breakfast", category: "routine" },
          { start: "07:30", end: "08:00", label: "Commute", category: "routine", location: "Car" },
          { start: "08:00", end: "10:30", label: "Work – Deep Focus", category: "work", location: "Office" },
          { start: "10:30", end: "10:45", label: "Coffee Break", category: "routine" },
          { start: "10:45", end: "12:00", label: "Work – Meetings", category: "work" },
          { start: "12:00", end: "13:00", label: "Lunch + Walk", category: "routine" },
          { start: "13:00", end: "15:00", label: "Work – Code Review", category: "work" },
          { start: "15:00", end: "15:15", label: "Stretch / Water", category: "routine" },
          { start: "15:15", end: "17:30", label: "Work – Feature Dev", category: "work" },
          { start: "17:30", end: "18:00", label: "Commute", category: "routine", location: "Car" },
          { start: "18:00", end: "19:00", label: "Gym Session", category: "physical", location: "Gym" },
          { start: "19:00", end: "19:30", label: "Shower / Cool-down", category: "routine" },
          { start: "19:30", end: "20:30", label: "Dinner", category: "routine" },
          { start: "20:30", end: "22:00", label: "Reading", category: "mindful" },
          { start: "22:00", end: "23:00", label: "Unwind – TV / Chat", category: "mindful" },
          { start: "23:00", end: "23:30", label: "Prep for Bed", category: "routine" },
          { start: "23:30", end: "06:30+1", label: "Sleep", category: "sleep" },
        ],
      },
      {
        day: "Tue",
        blocks: [
          { start: "06:30", end: "07:00", label: "Wake-up & Stretch", category: "routine" },
          { start: "07:00", end: "07:30", label: "Breakfast", category: "routine" },
          { start: "08:00", end: "10:00", label: "Work – Sprint Tasks", category: "work", location: "Home" },
          { start: "10:00", end: "10:15", label: "Coffee Break", category: "routine" },
          { start: "10:15", end: "12:00", label: "Work – Pair Programming", category: "work" },
          { start: "12:00", end: "13:00", label: "Lunch", category: "routine" },
          { start: "13:00", end: "15:00", label: "Work – Client Call", category: "work" },
          { start: "15:00", end: "15:15", label: "Break – Walk", category: "routine" },
          { start: "15:15", end: "18:00", label: "Work – Documentation", category: "work" },
          { start: "18:00", end: "18:30", label: "Snack / Relax", category: "routine" },
          { start: "18:30", end: "20:00", label: "Side Project", category: "goal" },
          { start: "20:00", end: "21:00", label: "Dinner", category: "routine" },
          { start: "21:00", end: "22:30", label: "Gaming with Friends", category: "hobby" },
          { start: "22:30", end: "07:00+1", label: "Sleep", category: "sleep" },
        ],
      },
      {
        day: "Wed",
        blocks: [
          { start: "06:30", end: "07:00", label: "Wake-up & Meditation", category: "mindful" },
          { start: "07:00", end: "07:30", label: "Breakfast", category: "routine" },
          { start: "07:30", end: "08:00", label: "Commute", category: "routine" },
          { start: "08:00", end: "10:30", label: "Work – Architecture Design", category: "work", location: "Office" },
          { start: "10:30", end: "10:45", label: "Coffee Break", category: "routine" },
          { start: "10:45", end: "12:00", label: "Work – Code Review", category: "work" },
          { start: "12:00", end: "13:00", label: "Team Lunch", category: "routine" },
          { start: "13:00", end: "15:00", label: "Work – Sprint Review", category: "work" },
          { start: "15:00", end: "15:15", label: "Walk / Water", category: "routine" },
          { start: "15:15", end: "17:30", label: "Work – Planning", category: "work" },
          { start: "17:30", end: "18:00", label: "Commute", category: "routine" },
          { start: "18:00", end: "19:00", label: "Yoga Class", category: "physical" },
          { start: "19:30", end: "20:30", label: "Dinner", category: "routine" },
          { start: "20:30", end: "22:00", label: "Family Time", category: "hobby" },
          { start: "22:00", end: "23:00", label: "Read Fiction", category: "mindful" },
          { start: "23:00", end: "06:30+1", label: "Sleep", category: "sleep" },
        ],
      },
      {
        day: "Thu",
        blocks: [
          { start: "06:30", end: "07:00", label: "Wake-up & Journaling", category: "mindful" },
          { start: "07:00", end: "07:30", label: "Breakfast", category: "routine" },
          { start: "08:30", end: "10:30", label: "Work – Feature Dev", category: "work", location: "Home" },
          { start: "10:30", end: "10:45", label: "Coffee Break", category: "routine" },
          { start: "10:45", end: "12:00", label: "Work – Sync", category: "work" },
          { start: "12:00", end: "13:00", label: "Lunch", category: "routine" },
          { start: "13:00", end: "15:00", label: "Work – Bug Fixes", category: "work" },
          { start: "15:00", end: "15:15", label: "Break – Stretch", category: "routine" },
          { start: "15:15", end: "18:00", label: "Work – Documentation", category: "work" },
          { start: "18:00", end: "19:30", label: "Side Project", category: "goal" },
          { start: "19:30", end: "20:30", label: "Dinner", category: "routine" },
          { start: "21:00", end: "22:30", label: "Movie Night", category: "hobby" },
          { start: "22:30", end: "06:30+1", label: "Sleep", category: "sleep" },
        ],
      },
      {
        day: "Fri",
        blocks: [
          { start: "07:00", end: "07:30", label: "Breakfast", category: "routine" },
          { start: "08:00", end: "12:00", label: "Work – Stand-ups & Emails", category: "work", location: "Office" },
          { start: "12:00", end: "13:00", label: "Lunch with Colleagues", category: "routine" },
          { start: "13:00", end: "15:00", label: "Work – Wrap-up", category: "work" },
          { start: "15:00", end: "15:30", label: "Commute", category: "routine" },
          { start: "15:30", end: "17:00", label: "Grocery + Meal-prep", category: "routine" },
          { start: "17:00", end: "18:00", label: "Walk", category: "physical" },
          { start: "18:00", end: "23:00", label: "Game Night", category: "hobby" },
          { start: "23:00", end: "08:00+1", label: "Sleep", category: "sleep" },
        ],
      },
      {
        day: "Sat",
        blocks: [
          { start: "08:00", end: "08:30", label: "Breakfast", category: "routine" },
          { start: "09:00", end: "11:00", label: "Hike", category: "physical" },
          { start: "11:00", end: "12:00", label: "Drive Home", category: "routine" },
          { start: "12:00", end: "14:00", label: "Lunch Out", category: "routine" },
          { start: "15:00", end: "17:00", label: "Photography Session", category: "hobby" },
          { start: "17:00", end: "18:00", label: "Edit Photos", category: "hobby" },
          { start: "18:30", end: "19:30", label: "Dinner", category: "routine" },
          { start: "19:30", end: "22:00", label: "Watch Show", category: "mindful" },
          { start: "22:00", end: "08:00+1", label: "Sleep", category: "sleep" },
        ],
      },
      {
        day: "Sun",
        blocks: [
          { start: "08:00", end: "08:30", label: "Breakfast", category: "routine" },
          { start: "09:00", end: "10:30", label: "Brunch Cooking", category: "routine" },
          { start: "11:00", end: "13:00", label: "Weekly Planning", category: "goal" },
          { start: "13:00", end: "14:00", label: "Lunch", category: "routine" },
          { start: "14:00", end: "18:00", label: "Family Time", category: "hobby" },
          { start: "18:00", end: "19:00", label: "Dinner", category: "routine" },
          { start: "19:00", end: "20:00", label: "Meditation & Journal", category: "mindful" },
          { start: "20:00", end: "22:00", label: "Light Reading", category: "mindful" },
          { start: "22:00", end: "07:00+1", label: "Sleep", category: "sleep" },
        ],
      },
    ],
    changes: {
      summary: ["no change"],
    },
}

export function WeekPage(userId : string){

    const [weekData, setWeekData] = useState<RoutineData>();

    useEffect(()=>  {
        //ToDo: connect to mongo and get week data
        setWeekData(sampleData)

    },[])

    if(!weekData){
        return (
            <div>
                Week data not available
            </div>
        )
    }

    return(
        <WeeklyRoutinePreview data={weekData}/>
    )
}