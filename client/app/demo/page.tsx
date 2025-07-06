'use client'
import {AnchorPayload, AnchorsDashboard} from "@/components/AnchorsDashboard"
// ---------- Sample Data for Preview --------------------------------------
const sampleData: AnchorPayload = {
    "schemaVersion": 1,
    "userId": "user-5",
    "anchors": [
      {
        "id": "bakery",
        "label": "Bakery Shop",
        "category": "work",
        "blocks": [
          { "blockId": "shop", "kind": "fixed", "days": ["Tue","Wed","Thu","Fri","Sat","Sun"], "start": "05:00", "end": "14:00", "location": "Bakery", "meta": { "commuteMinutes": 15 } }
        ]
      },
      {
        "id": "supply",
        "label": "Supply Run",
        "category": "work",
        "blocks": [
          { "blockId": "mon-supplies", "kind": "fixed", "days": ["Mon"], "start": "07:00", "end": "09:00", "location": "Wholesale Market" }
        ]
      },
      {
        "id": "admin",
        "label": "Admin Work",
        "category": "work",
        "blocks": [
          { "blockId": "admin", "kind": "fixed", "days": ["Tue","Wed","Thu","Fri"], "start": "15:00", "end": "17:00", "location": "Office" }
        ]
      },
      {
        "id": "e-commerce",
        "label": "Online Store Build",
        "category": "goal",
        "blocks": [
          { "blockId": "mon-dev",  "kind": "fixed", "days": ["Mon"],                     "start": "10:00", "end": "14:00" },
          { "blockId": "weekday",  "kind": "fixed", "days": ["Tue","Wed","Thu"],        "start": "18:45", "end": "20:30" }
        ]
      },
      {
        "id": "marketing",
        "label": "Marketing Posts",
        "category": "goal",
        "blocks": [
          { "blockId": "daily", "kind": "fixed", "days": ["Mon","Tue","Wed","Fri","Sat","Sun"], "start": "19:00", "end": "19:30" },
          { "blockId": "thu-late", "kind": "fixed", "days": ["Thu"], "start": "20:30", "end": "21:00" }
        ]
      },
      {
        "id": "workshop",
        "label": "Community Workshop",
        "category": "other",
        "blocks": [
          { "blockId": "thu-workshop", "kind": "fixed", "days": ["Thu"], "start": "18:00", "end": "20:00", "location": "Community Center" }
        ]
      },
      {
        "id": "exercise",
        "label": "Gym",
        "category": "routine",
        "blocks": [
          { "blockId": "mwf-gym", "kind": "fixed", "days": ["Mon","Wed","Fri"], "start": "17:30", "end": "18:30", "location": "Gym" }
        ]
      },
      {
        "id": "family",
        "label": "Family Time",
        "category": "hobby",
        "blocks": [
          { "blockId": "sunday", "kind": "fixed", "days": ["Sun"], "start": "15:00", "end": "19:00" }
        ]
      },
      {
        "id": "photography",
        "label": "Photography",
        "category": "hobby",
        "blocks": [
          { "blockId": "saturday-photo", "kind": "fixed", "days": ["Sat"], "start": "16:00", "end": "18:00" }
        ]
      },
      {
        "id": "sleep",
        "label": "Sleep",
        "category": "routine",
        "blocks": [
          { "blockId": "nightly", "kind": "fixed", "days": ["Daily"], "start": "21:30", "end": "04:30" },
          { "blockId": "mon-nap", "kind": "fixed", "days": ["Mon"], "start": "15:00", "end": "16:00" }
        ]
      },
      {
        "id": "meals",
        "label": "Meals",
        "category": "routine",
        "blocks": [
          { "blockId": "breakfast", "kind": "fixed", "days": ["Daily"], "start": "04:15", "end": "04:30" },
          { "blockId": "lunch",     "kind": "fixed", "days": ["Daily"], "start": "14:30", "end": "14:45" },
          { "blockId": "dinner",    "kind": "fixed", "days": ["Daily"], "start": "20:00", "end": "20:30" }
        ]
      }
    ]
  }
  

export default function Demo() {
    return <AnchorsDashboard data={sampleData} />;
  }
  