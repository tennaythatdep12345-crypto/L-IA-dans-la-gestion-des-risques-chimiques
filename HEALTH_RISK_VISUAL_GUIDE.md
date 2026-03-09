# Health Risk Assessment Module - Visual & Layout Guide

## User Interface Layout

### Desktop View (1024px+)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    HEADER (Navigation)                              │
│  [Analyseur]  [❤️ Santé]  [📖 Connaissances]  [ℹ️ À Propos]  🌙    │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                   Health Risk Assessment                             │
│   Evaluate the long-term health hazards of chemical substances...   │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────────┬──────────────────────────────────────────┐
│                          │                                          │
│  LEFT PANEL              │         RIGHT PANEL                      │
│  (INPUT FORM)            │         (RESULTS)                        │
│                          │                                          │
│ ┌────────────────────┐   │  ╔════════════════════════════════════╗ │
│ │    Search Box      │   │  ║  🔴 Benzene (CAS-71-43-2)      75  ║ │
│ │                    │   │  ║  HIGH Risk Level              /100  ║ │
│ │ [Benzene       ↓]  │   │  ╚════════════════════════════════════╝ │
│ │                    │   │                                          │
│ │ Suggestions:       │   │  ┌──────────────┬──────────────┐        │
│ │ • Benzene          │   │  │ Carcinogenity │ Mutagenicity │        │
│ │ • Formaldehyde     │   │  │    HIGH       │   MEDIUM     │        │
│ │ • Chloroform       │   │  └──────────────┴──────────────┘        │
│ │                    │   │                                          │
│ │ Exposure Route:    │   │  ┌──────────────┬──────────────┐        │
│ │ [Inhalation ▼]     │   │  │ Genotoxicity  │ Chronic Tox  │        │
│ │                    │   │  │    HIGH       │    HIGH      │        │
│ │ Exposure Duration: │   │  └──────────────┴──────────────┘        │
│ │ [Chronic ▼]        │   │                                          │
│ │                    │   │  ┌────────────────────────────────────┐ │
│ │ [Analyze] [Reset]  │   │  │ 🌬️  Exposure Routes               │ │
│ │                    │   │  │ Inhalation    Skin Contact         │ │
│ │                    │   │  └────────────────────────────────────┘ │
│ │                    │   │                                          │
│ │                    │   │  ┌────────────────────────────────────┐ │
│ │                    │   │  │ 🎯 Target Organs                  │ │
│ │ 💡 Tip:           │   │  │ [Blood] [Bone Marrow] [Nervous]   │ │
│ │ Enter a chemical   │   │  └────────────────────────────────────┘ │
│ │ name or CAS #      │   │                                          │
│ │                    │   │  ┌────────────────────────────────────┐ │
│ │                    │   │  │ ⚡ Mechanisms                      │ │
│ │                    │   │  │ • DNA damage                       │ │
│ │                    │   │  │ • Oxidative stress                 │ │
│ │                    │   │  │ • Chromosomal alteration           │ │
│ │                    │   │  └────────────────────────────────────┘ │
│ │                    │   │                                          │
│ │                    │   │  ┌────────────────────────────────────┐ │
│ │                    │   │  │ 📋 Health Risk Summary             │ │
│ │                    │   │  │ Benzene is a known human carcinogen │
│ │                    │   │  │ (Group 1) associated with high     │ │
│ │                    │   │  │ carcinogenic risk, especially      │ │
│ │                    │   │  │ through chronic inhalation exposure │
│ │                    │   │  └────────────────────────────────────┘ │
│ │                    │   │                                          │
│ │                    │   │  Classification: Group 1 (IARC)         │
│ │                    │   │  Source: IARC, GHS                      │
│ │                    │   │                                          │
│ └────────────────────┘   │                                          │
│                          │                                          │
└──────────────────────────┴──────────────────────────────────────────┘
```

### Tablet View (640px - 1024px)

```
┌─────────────────────────────────────┐
│      HEADER (Navigation)            │
│ [Analyseur] [❤️] [📖] [ℹ️] 🌙       │
└─────────────────────────────────────┘

Health Risk Assessment

┌─────────────────────────────────────┐
│       INPUT FORM (LEFT)             │
│  [Search.. ]                        │
│  [Exposure ▼] [Duration ▼]          │
│  [Analyze] [Reset]                  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│      RESULTS (FULL WIDTH)           │
│  🔴 Benzene - 75/100 - HIGH         │
│                                     │
│  [Carcinogenicity] [Mutagenicity]   │
│  [Genotoxicity]    [Chronic Tox]    │
│                                     │
│  [Exposure Routes]                  │
│  [Target Organs]                    │
│  [Mechanisms]                       │
│  [Health Summary]                   │
└─────────────────────────────────────┘
```

### Mobile View (<640px)

```
┌────────────────────┐
│ HEADER (Collapse)  │
│ [≡] 🌙             │
└────────────────────┘

Health Risk Assessment

┌────────────────────┐
│   INPUT FORM       │
│  [Search..]        │
│  [Exposure ▼]      │
│  [Duration ▼]      │
│  [Analyze]         │
│  [Reset]           │
└────────────────────┘

┌────────────────────┐
│   RESULTS          │
│  🔴 Benzene        │
│  75/100            │
│  HIGH              │
│                    │
│  [Carcinogenity]   │
│  [Mutagenicity]    │
│  ...               │
└────────────────────┘
```

## Color Scheme & Risk Levels

### Risk Level Colors

```
CRITICAL  →  RED           from-red-500 to-red-600
76-100       bg-red-100    text-red-800  border-red-200

HIGH      →  ORANGE        from-orange-500 to-amber-500
51-75        bg-orange-100 text-orange-800 border-orange-200

MODERATE  →  AMBER         from-amber-500 to-amber-600
26-50        bg-amber-100  text-amber-800 border-amber-200

LOW       →  GREEN         from-emerald-500 to-green-500
0-25         bg-green-100  text-green-800 border-green-200
```

### Attribute Colors

```
HIGH     → bg-red-100    text-red-800    border-red-200
MEDIUM   → bg-amber-100  text-amber-800  border-amber-200
LOW      → bg-green-100  text-green-800  border-green-200
```

### Organ Colors

```
Liver           → bg-purple-100    text-purple-800
Kidney          → bg-blue-100      text-blue-800
Lungs           → bg-cyan-100      text-cyan-800
Blood           → bg-red-100       text-red-800
Nervous System  → bg-pink-100      text-pink-800
Respiratory     → bg-indigo-100    text-indigo-800
Reproductive    → bg-fuchsia-100   text-fuchsia-800
```

## Component Sections

### Section 1: Main Risk Card
```
┌─────────────────────────────────────┐
│ 🔴 BENZENE  (CAS: 71-43-2)       75 │
│                                /100 │
│                                     │
│ [HIGH Risk Level]                   │
│                                     │
│ Severe health hazard - Immediate    │
│ risk assessment and control         │
│ measures required                   │
└─────────────────────────────────────┘
```

### Section 2: Health Attributes (2x2 Grid)
```
┌──────────────────┬──────────────────┐
│ Carcinogenicity  │ Mutagenicity     │
│ [H]     HIGH     │ [M]    MEDIUM    │
│ Potential to     │ Ability to cause │
│ cause cancer     │ mutations        │
└──────────────────┴──────────────────┘

┌──────────────────┬──────────────────┐
│ Genotoxicity     │ Chronic Toxicity │
│ [H]     HIGH     │ [H]     HIGH     │
│ DNA damage       │ Long-term harmful│
│ potential        │ effects          │
└──────────────────┴──────────────────┘
```

### Section 3: Exposure Routes
```
┌──────────────────────────────────────┐
│ 🌬️  EXPOSURE ROUTES                  │
│                                      │
│  [🌬️ Inhalation]  [🤚 Skin Contact] │
│                                      │
└──────────────────────────────────────┘
```

### Section 4: Target Organs
```
┌──────────────────────────────────────┐
│ 🎯 TARGET ORGANS                     │
│                                      │
│ [Blood] [Bone Marrow] [Nervous]     │
│                                      │
└──────────────────────────────────────┘
```

### Section 5: Mechanisms
```
┌──────────────────────────────────────┐
│ ⚡ MECHANISMS OF ACTION              │
│                                      │
│ • DNA damage                         │
│ • Oxidative stress                   │
│ • Chromosomal alteration             │
│                                      │
└──────────────────────────────────────┘
```

### Section 6: Health Summary
```
┌──────────────────────────────────────┐
│ 📋 HEALTH RISK SUMMARY               │
│                                      │
│ This substance may present a high    │
│ long-term health risk due to        │
│ possible carcinogenic effects,      │
│ especially under chronic inhalation  │
│ exposure.                            │
│                                      │
└──────────────────────────────────────┘
```

### Section 7: Classification
```
Classification: Group 1 (IARC)
Source: IARC, GHS
```

## Empty State

When no search has been performed:

```
┌────────────────────────────────────────┐
│                                        │
│            🧪                          │
│                                        │
│      No analysis yet                   │
│                                        │
│  Enter a chemical name or CAS number   │
│  to begin the health risk assessment   │
│                                        │
└────────────────────────────────────────┘
```

## Error State

When chemical not found:

```
┌────────────────────────────────────────┐
│ ⚠️  Chemical Not Found                 │
│                                        │
│ "UnknownChemical" not found in the    │
│ health risk database.                  │
│                                        │
│ Try another chemical name or CAS #     │
└────────────────────────────────────────┘
```

## Loading State

During analysis:

```
┌────────────────────────────────────────┐
│                                        │
│  ⟳ Analyzing...                        │
│                                        │
│  Please wait while we evaluate the     │
│  health risks of this chemical...      │
│                                        │
└────────────────────────────────────────┘
```

## Autocomplete Dropdown

When typing in search:

```
[Benzene           ▼]
┌──────────────────────────┐
│ Benzene          (CAS)   │
│ CAS: 71-43-2             │  ← Click to select
├──────────────────────────┤
│ Formaldehyde             │
│ CAS: 50-00-0             │
├──────────────────────────┤
│ Chloroform               │
│ CAS: 67-66-3             │
└──────────────────────────┘
```

## Animation Sequences

### Page Entry Animation
```
Time    Effect
0ms     Page appears: opacity 0 → 1, y: -20 → 0
100ms   Left input panel slides in: x: -20 → 0
200ms   Right results panel slides in: x: 20 → 0
300ms   Cards stagger entrance
```

### Result Card Animation
```
Time    Effect
0ms     Main card appears with bounce
100ms   Attribute cards appear staggered (50ms apart)
500ms   Tags and text elements fade in
```

### Suggestion Dropdown
```
Time    Effect
0ms     Dropdown fades in: opacity 0 → 1, y: -10 → 0
300ms   Each suggestion highlights on hover
Exit:   Dropdown fades out: opacity 1 → 0, y: 0 → -10
```

## Dark Mode Appearance

### Light Mode
```
Background: White/Light gray
Text: Dark gray/Black
Cards: White with subtle shadows
Borders: Light gray (#e2e8f0)
Accents: Bright colors (emerald, cyan)
```

### Dark Mode
```
Background: Dark gray/Slate (#1e293b - #0f172a)
Text: White/Light gray
Cards: Slate-800 with subtle shadows
Borders: Slate-700 (#3f4651)
Accents: Bright colors (same, high contrast)
```

## Icon Mapping

```
Exposure Routes:
  Inhalation → Wind (🌬️)
  Skin Contact → Hand (🤚)
  Ingestion → Droplet (💧)

Risk Level:
  CRITICAL → AlertTriangle (⚠️)
  HIGH → AlertTriangle (⚠️)
  MODERATE → AlertCircle (ℹ️)
  LOW → CheckCircle (✓)

Actions:
  Search → Search (🔍)
  Reset → RotateCcw (↻)
  Loading → Loader with spinner

Other:
  Summary → AlertCircle (ℹ️)
  Organs → Target (🎯)
  Mechanisms → Flame (🔥)
  Exposure → Activity (📊)
```

## Spacing & Typography

### Typography
```
Headings:
  Page title: text-4xl md:text-5xl font-bold
  Section titles: text-xl font-bold
  Card titles: text-sm font-bold uppercase

Body:
  Main text: text-base leading-relaxed
  Small text: text-sm
  Tiny text: text-xs

Labels:
  Form labels: text-sm font-semibold
  Badges: text-sm font-bold
```

### Spacing
```
Page padding: p-6 (24px)
Card padding: p-4 to p-6
Gap between columns: lg:gap-6
Gap between sections: space-y-6
Button padding: py-3 px-4
Input padding: px-4 py-3
```

## Responsive Breakpoints

```
Mobile (< 640px):
  - Single column layout
  - Full-width cards
  - Stacked input fields
  - Touch-friendly buttons (py-3)

Tablet (640px - 1024px):
  - 2-column layout (form + results)
  - Medium padding
  - Flexible card sizing

Desktop (> 1024px):
  - 3-column grid (1:2 split)
  - Sticky left sidebar
  - Full space for rich content
  - Grid layouts for attribute cards
```

## Interaction States

### Button States
```
Normal:   bg-emerald-500 hover:from-emerald-600
Disabled: from-slate-400 disabled:to-slate-500
Active:   border-white/40 bg-white/20 backdrop-blur-sm

On Click: Slight scale animation (0.95)
On Hover: Slight elevation effect
```

### Input States
```
Normal:   bg-slate-50 border-slate-200
Focused:  ring-2 ring-emerald-500 outline-none
Filled:   bg-white dark:bg-slate-700
Error:    border-red-400 ring-red-300
```

### Card States
```
Normal:   shadow-md border-slate-100
Hover:    shadow-lg transition-all
Active:   scale-105 (slight zoom)
```

## Accessibility Colors (WCAG AA)

All colors meet WCAG AA contrast requirements:
- Text on background: 4.5:1 contrast minimum
- UI components: 3:1 contrast minimum
- All colors distinguishable for colorblind users

---

**Last Updated:** 2026-03-09
