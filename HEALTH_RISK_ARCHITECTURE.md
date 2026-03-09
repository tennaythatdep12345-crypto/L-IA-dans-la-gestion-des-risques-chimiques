# Health Risk Assessment Module - Architecture Documentation

## System Overview

The **Health Risk Assessment Module** is a self-contained, independent subsystem designed to evaluate long-term health hazards of chemical substances. It operates completely separately from the existing Industrial Safety Analysis module.

```
┌─────────────────────────────────────────────────────────────┐
│                    CHEMICAL RISK SYSTEM                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────┐    ┌──────────────────────────┐   │
│  │  INDUSTRIAL SAFETY   │    │  HEALTH RISK ASSESSMENT  │   │
│  │  ANALYSIS MODULE     │    │  MODULE (NEW)            │   │
│  │  (Unchanged)         │    │ (Separate & Independent) │   │
│  ├──────────────────────┤    ├──────────────────────────┤   │
│  │ • Flammability       │    │ • Carcinogenicity        │   │
│  │ • Acute Toxicity     │    │ • Mutagenicity           │   │
│  │ • Incompatibility    │    │ • Genotoxicity           │   │
│  │ • 2-chemical analysis│    │ • Chronic Toxicity       │   │
│  │ • Reaction hazards   │    │ • Single chemical focus  │   │
│  │ • CSV data           │    │ • JSON mock data         │   │
│  │ • Backend API        │    │ • Frontend only          │   │
│  └──────────────────────┘    └──────────────────────────┘   │
│         ↓                              ↓                     │
│  ┌──────────────────────┐    ┌──────────────────────────┐   │
│  │  CSVs                │    │  healthRiskData.json     │   │
│  │  (substances,        │    │  (18 chemicals)          │   │
│  │   exposures,         │    │                          │   │
│  │   incompatibilities) │    │                          │   │
│  └──────────────────────┘    └──────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Module Components

### 1. HealthRiskModule.jsx (React Component)
**Type**: Functional Component with Hooks
**Size**: ~990 lines
**Dependencies**: 
- React, Framer Motion, Lucide React Icons
- healthRiskData.json
- healthRiskScoring.js

**Structure**:
```
HealthRiskModule
├── State Management
│   ├── searchInput
│   ├── exposureRoute
│   ├── exposureDuration
│   ├── isLoading
│   ├── result
│   ├── error
│   ├── suggestions
│   └── showSuggestions
├── Effects
│   └── useEffect (autocomplete suggestions)
├── Event Handlers
│   ├── handleSearch()
│   ├── handleSubmit()
│   ├── handleSuggestionClick()
│   └── handleReset()
└── Render
    ├── Header (title + description)
    ├── Left Panel (Input Form)
    │   ├── Search input with autocomplete
    │   ├── Exposure route selector
    │   ├── Exposure duration selector
    │   ├── Analyze & Reset buttons
    │   └── Info/Error messages
    └── Right Panel (Results)
        ├── Empty state / Results
        ├── Main risk card (score + badge)
        ├── 4x Health attributes grid
        ├── Exposure routes tags
        ├── Target organs tags
        ├── Mechanisms list
        ├── Health summary panel
        └── Classification info
```

### 2. healthRiskData.json (Data Layer)
**Type**: JSON mock database
**Size**: ~50KB
**Structure**:
```json
{
  "chemicals": [
    {
      "cas": "CAS number",
      "name": "Chemical name",
      "synonyms": ["syn1", "syn2"],
      "molecularFormula": "C6H6",
      "carcinogenicity": "high|medium|low",
      "mutagenicity": "high|medium|low",
      "genotoxicity": "high|medium|low",
      "chronicToxicity": "high|medium|low",
      "reproductiveToxicity": "high|medium|low",
      "exposureRoutes": ["inhalation", "skin", "ingestion"],
      "targetOrgans": ["organ1", "organ2"],
      "classification": "Group 1 (IARC)",
      "mechanisms": ["DNA damage", "oxidative stress"],
      "summary": "AI-generated text",
      "source": ["IARC", "GHS"]
    }
  ]
}
```

**Search Indexing**:
```javascript
// Builds searchable index on load
healthRiskData.index = Map(
  "benzene" → chemical_object,
  "71-43-2" → chemical_object,
  "benzol" → chemical_object,
  ...
)
```

### 3. healthRiskScoring.js (Business Logic)
**Type**: Utility module
**Size**: ~280 lines
**Exports**: 8 functions

**Function Flow**:
```
User Input (chemical + exposure context)
    ↓
calculateHealthRiskScore(chemical, context)
    ├→ calculateBaseScore(chemical)
    │   ├→ sum(carcinogenicity weight)
    │   ├→ sum(mutagenicity weight)
    │   ├→ sum(genotoxicity weight)
    │   └→ sum(chronicToxicity weight)
    │   = baseScore (0-100)
    │
    └→ adjustScoreByExposure(baseScore, context, chemical)
        ├→ Check exposure route match
        ├→ Apply exposure adjustments
        ├→ Apply duration adjustments
        └→ Clamp to 0-100
        = finalScore
    ↓
getRiskLevel(finalScore)
    ├→ CRITICAL: 76-100 (Red)
    ├→ HIGH: 51-75 (Orange)
    ├→ MODERATE: 26-50 (Amber)
    └→ LOW: 0-25 (Green)
    ↓
generateHealthSummary(chemical, finalScore)
    ├→ Extract main hazards
    ├→ Determine exposure text
    └→ Format summary paragraph
```

## Data Flow Diagram

```
┌──────────────────┐
│  User Input      │
│  • Chemical name │
│  • CAS number    │
│  • Route         │
│  • Duration      │
└────────┬─────────┘
         │
         ↓
┌──────────────────────────────┐
│  handleSearch()              │
│  • Validate input            │
│  • Query searchIndex         │
│  • Show loading state        │
└────────┬─────────────────────┘
         │
         ├─────────→ [Not found] → Show error
         │
         ├─────────→ [Not found] → Clear results
         │
         └─────────→ [Found]
                       ↓
         ┌──────────────────────────┐
         │ calculateHealthRiskScore │
         │ • Send chemical + context│
         └────────┬─────────────────┘
                  │
                  ↓
         ┌────────────────────────┐
         │ Get risk level badge   │
         │ • Color scheme         │
         │ • Label & description  │
         └────────┬───────────────┘
                  │
                  ↓
         ┌────────────────────────┐
         │ generateHealthSummary  │
         │ • Extract hazards      │
         │ • Format text          │
         └────────┬───────────────┘
                  │
                  ↓
         ┌────────────────────────┐
         │ Set result state       │
         │ • Display 8 cards      │
         │ • Trigger animations   │
         └────────────────────────┘
```

## UI Component Hierarchy

```
HealthRiskModule (Page)
├── Header Section
│   ├── Title
│   └── Description
│
├── Main Grid (grid-cols-1 lg:grid-cols-3)
│
├── Left Panel (lg:col-span-1)
│   └── Input Form Card
│       ├── Search Input Group
│       │   ├── Input field
│       │   ├── Clear button
│       │   └── Autocomplete dropdown
│       ├── Exposure Route Select
│       ├── Exposure Duration Select
│       ├── Button Group
│       │   ├── Analyze button
│       │   └── Reset button
│       ├── Error Message (conditional)
│       └── Info Box (conditional)
│
└── Right Panel (lg:col-span-2)
    ├── Empty State (conditional)
    │   ├── Icon
    │   ├── Text
    │   └── Help message
    │
    └── Results Container (conditional)
        ├── Main Risk Card (gradient bg + score)
        ├── Health Attributes Grid (2 cols)
        │   ├── Carcinogenicity card
        │   ├── Mutagenicity card
        │   ├── Genotoxicity card
        │   └── Chronic Toxicity card
        ├── Exposure Routes Card
        │   └── Route tags (with icons)
        ├── Target Organs Card
        │   └── Organ tags (with colors)
        ├── Mechanisms Card
        │   └── Mechanism list
        ├── Health Summary Card
        │   └── AI summary text
        └── Classification Card
            ├── Classification badge
            └── Source tags
```

## State Management

### Local Component State
```javascript
const [searchInput, setSearchInput] = useState('');
const [exposureRoute, setExposureRoute] = useState('inhalation');
const [exposureDuration, setExposureDuration] = useState('chronic');
const [isLoading, setIsLoading] = useState(false);
const [result, setResult] = useState(null);
const [error, setError] = useState(null);
const [suggestions, setSuggestions] = useState([]);
const [showSuggestions, setShowSuggestions] = useState(false);
```

### Data Flow State
1. **Input State**: User fills form
2. **Suggestions State**: Autocomplete options
3. **Loading State**: Analysis in progress
4. **Result State**: Complete analysis
5. **Error State**: User-facing error message

## Styling Architecture

### Tailwind CSS Integration
```
Color System:
├── Risk Levels
│   ├── CRITICAL: from-red-500 to-red-600
│   ├── HIGH: from-orange-500 to-amber-500
│   ├── MODERATE: from-amber-500 to-amber-600
│   └── LOW: from-emerald-500 to-green-500
│
├── Attribute Colors
│   ├── High: bg-red-100, text-red-800
│   ├── Medium: bg-amber-100, text-amber-800
│   └── Low: bg-green-100, text-green-800
│
├── Organ Colors
│   ├── Liver: bg-purple-100, text-purple-800
│   ├── Kidney: bg-blue-100, text-blue-800
│   ├── Lungs: bg-cyan-100, text-cyan-800
│   ├── Blood: bg-red-100, text-red-800
│   ├── Nervous: bg-pink-100, text-pink-800
│   ├── Respiratory: bg-indigo-100, text-indigo-800
│   └── Reproductive: bg-fuchsia-100, text-fuchsia-800
│
└── Dark Mode
    └── dark: prefix for all colors
```

### Responsive Design
```
Mobile (< 640px): 
  └── flex-col (single column)

Tablet (640px - 1024px):
  └── lg:grid-cols-2 (2 columns)

Desktop (> 1024px):
  └── lg:grid-cols-3 (3 columns, 1:2 split)
```

## Animation System

### Framer Motion Animations
```javascript
// Page entrance
<motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} />

// Card stagger
<motion.div 
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.1 * index }}
/>

// Suggestion dropdown
<motion.div
  initial={{ opacity: 0, y: -10 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -10 }}
/>

// Results with pending state
<AnimatePresence mode="wait">
  {!result ? <EmptyState /> : <ResultsCards />}
</AnimatePresence>
```

## Error Handling

```javascript
// User errors:
├── Empty search → "Please enter a chemical name or CAS number"
├── Not found → "'{query}' not found in the health risk database."
└── (Network errors handled in future backend integration)

// Display:
├── Red background with icon
├── Clear message text
└── Dismissible via clear button
```

## Performance Characteristics

| Metric | Value | Notes |
|--------|-------|-------|
| Load Time | <100ms | No API calls |
| Search Time | ~600ms | With simulated delay |
| Memory | ~50KB data | JSON in memory |
| Bundle | +150KB | Component + data |
| Interactions | Instant | No server latency |

**Optimization Opportunities**:
- Remove simulated delay (600ms → 0ms)
- Virtualize long suggestion lists
- Lazy load component on first click
- Compress JSON data

## Security Considerations

1. **Input Validation**: All inputs trimmed/normalized
2. **XSS Prevention**: No eval, innerHTML, or dangerouslySetInnerHTML
3. **Data**: No sensitive data, mock only
4. **No External Requests**: All local, no API calls
5. **Future**: Validate backend responses when integrated

## Scalability

**Current**: 18 chemicals, ~50KB
**Scalable To**: 
- 1000+ chemicals: ~3MB (comfortable)
- 10000+ chemicals: Backend database recommended
- Real-time updates: WebSocket recommended

**Expansion Strategy**:
1. Keep chemicals in JSON for <1000 items
2. Move to backend database for >1000 items
3. Implement caching layer at frontend
4. Add pagination/lazy loading for suggestions

## Accessibility Features

- Semantic HTML structure
- ARIA labels on buttons
- Keyboard navigation support
- High contrast colors
- Clear focus states
- Form labels with `htmlFor`
- Error messages associated with inputs
- Icon + text for better UX

## Testing Strategy

### Unit Tests Needed
```javascript
// healthRiskScoring.test.js
✓ calculateBaseScore()
✓ adjustScoreByExposure()
✓ calculateHealthRiskScore()
✓ getRiskLevel()
✓ generateHealthSummary()

// HealthRiskModule.test.jsx
✓ Component renders
✓ Search functionality
✓ Autocomplete filtering
✓ Score calculation
✓ Error states
✓ Dark mode toggle
```

### Integration Tests
```javascript
// Full workflow
✓ Load module
✓ Search known chemical
✓ Search unknown chemical
✓ Change exposure context
✓ Results display correctly
```

## Documentation Map

```
/
├── HEALTH_RISK_INTEGRATION.md      (This file - Setup guide)
├── HEALTH_RISK_ARCHITECTURE.md     (This file - Technical details)
├── src/
│   ├── components/
│   │   ├── HealthRiskModule.jsx    (Code comments inline)
│   │   └── Header.jsx              (Updated with Health nav)
│   ├── data/
│   │   └── healthRiskData.json     (Commented structure)
│   ├── utils/
│   │   └── healthRiskScoring.js    (Detailed JSDoc comments)
│   └── App.jsx                     (Import + routing comments)
└── HEALTH_RISK_SAMPLE_DATA.md     (Data format guide)
```

## Deployment Checklist

- [ ] All files in correct locations
- [ ] Imports working (no 404 errors)
- [ ] Dark mode tested
- [ ] Mobile responsive tested
- [ ] Search autocomplete working
- [ ] Risk scores calculated correctly
- [ ] No console errors
- [ ] Industrial module still works
- [ ] Build passes without warnings
- [ ] Bundle size acceptable
- [ ] Production build tested

---

**Document Version**: 1.0
**Last Updated**: 2026-03-09
**Status**: Complete
