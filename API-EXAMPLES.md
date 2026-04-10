# API Examples & Testing Guide

Complete examples for using the UPSC AI API.

## Prerequisites

Server must be running:
```bash
npm start
```

## 🔍 Testing Tools

### Using curl (command line)
```bash
curl http://localhost:3000/api/today | jq
```

### Using Python
```python
import requests

response = requests.get('http://localhost:3000/api/today')
data = response.json()
print(data)
```

### Using JavaScript/Node.js
```javascript
const response = await fetch('http://localhost:3000/api/today');
const data = await response.json();
console.log(data);
```

### Using Postman
- Import collection from examples below
- Set base URL to `http://localhost:3000`
- Execute requests

## 📡 Endpoint Examples

### 1. Health Check

**Request:**
```bash
curl http://localhost:3000/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-04-08T10:30:00Z"
}
```

---

### 2. Get Today's Intelligence

**Request:**
```bash
curl http://localhost:3000/api/today | jq
```

**Response:**
```json
{
  "date": "2026-04-08",
  "plan": {
    "identified_topics": [
      "Climate Summit Results",
      "Budget Implementation"
    ],
    "priority_topics": [...],
    "processing_strategy": "..."
  },
  "readme": {
    "date": "2026-04-08",
    "version": "v1",
    "summary": "...",
    "high_priority_domains": [...]
  },
  "topics": [
    {
      "id": "env-001",
      "title": "Climate Summit Agreement",
      "category": "Environment & Climate",
      "upsc_relevance_score": 95,
      ...
    }
  ],
  "ui_output": {...}
}
```

---

### 3. Get All Topics

**Request:**
```bash
curl http://localhost:3000/api/topics | jq
```

**Response:**
```json
[
  {
    "id": "env-001",
    "title": "Climate Summit Agreement",
    "category": "Environment & Climate",
    "upsc_relevance_score": 95,
    "why_in_news": "Global agreement on emissions targets",
    "core_concept": "Climate policies and agreements",
    ...
  },
  {
    "id": "econ-002",
    "title": "Union Budget 2026",
    ...
  }
]
```

---

### 4. Get Specific Topic

**Request:**
```bash
curl http://localhost:3000/api/topic/env-001 | jq
```

**Response:**
```json
{
  "id": "env-001",
  "title": "Global Climate Summit Agreement on Emissions Targets",
  "category": "Environment & Climate",
  "upsc_relevance_score": 95,
  "why_in_news": "World leaders reached consensus on emissions targets",
  "core_concept": "International climate agreements, NDCs, and mechanisms",
  "explanation": "A landmark climate summit produced a binding agreement...",
  "prelims": {
    "key_facts": [
      "Binding emissions reduction targets by 2030",
      "45% reduction from 2020 baseline",
      "Climate finance mechanism: $100 billion/year",
      "Technology transfer for renewable energy"
    ],
    "mcq": {
      "question": "The recent global climate summit agreement sets binding emissions reduction targets for which year?",
      "options": ["2025", "2028", "2030", "2035"],
      "answer": "2030"
    }
  },
  "mains": {
    "gs_paper": "GS-III",
    "question": "Discuss the significance of the latest global climate agreement and its implications for India's renewable energy goals.",
    "answer_framework": {
      "intro": "Introduce the recent climate summit and binding agreement",
      "body": [
        "Key provisions: emissions targets, finance mechanism, technology transfer",
        "Difference from previous agreements (Paris, Kyoto)",
        "India's obligations and opportunities",
        "Implementation challenges and compliance mechanisms"
      ],
      "conclusion": "India's role in global climate action while meeting development needs"
    }
  },
  "revision_note_50_words": "Global climate summit established binding 2030 emission targets...",
  "sources": [
    {"name": "The Hindu", "url": "https://www.thehindu.com/..."}
  ],
  "metadata": {
    "date": "2026-04-08",
    "importance_tag": "high",
    "repeat_topic_probability": "high"
  }
}
```

---

### 5. Get History

**Request:**
```bash
curl http://localhost:3000/api/history | jq
```

**Response:**
```json
{
  "total": 3,
  "entries": [
    {
      "date": "2026-04-08",
      "plan": {...},
      "readme": {...},
      "topics": [...],
      "ui_output": {...}
    },
    {
      "date": "2026-04-07",
      "plan": {...},
      ...
    }
  ]
}
```

---

### 6. Get Specific Date

**Request:**
```bash
curl http://localhost:3000/api/date/2026-04-07 | jq
```

**Response:**
```json
{
  "date": "2026-04-07",
  "plan": {...},
  "readme": {...},
  "topics": [...],
  "ui_output": {...}
}
```

**If date not found:**
```json
{
  "error": "No data available for 2026-04-07"
}
```

---

### 7. Get System Memory

**Request:**
```bash
curl http://localhost:3000/api/memory | jq
```

**Response:**
```json
{
  "date": "2026-04-08",
  "version": "v1",
  "summary": "Climate policy changes dominate news. Budget implementation shows sectoral shifts.",
  "high_priority_domains": [
    "Environment & Climate",
    "Economy & Reports",
    "International Relations",
    "Polity & Governance"
  ],
  "key_trends": [
    "Increasing focus on renewable energy transition",
    "Fiscal policy impact on growth",
    "Trade war escalations"
  ],
  "recurring_topics": [
    "Climate change mitigation",
    "Government spending efficiency",
    "Agricultural policy reforms"
  ],
  "static_focus_areas": [
    "Environment & Climate",
    "Polity & Governance",
    "Economy & Reports",
    "International Relations",
    "Science & Tech"
  ],
  "exam_strategy_notes": [
    "Climate policy is VERY HIGH priority",
    "Budget details essential for Mains GS-III",
    "Trade tensions require WTO understanding"
  ],
  "data_quality_notes": "High quality news sources, minimal noise"
}
```

---

### 8. Get Dashboard Data

**Request:**
```bash
curl http://localhost:3000/api/dashboard | jq
```

**Response:**
```json
{
  "hero_topics": [
    {
      "id": "env-001",
      "title": "Global Climate Summit Agreement on Emissions Targets",
      "category": "Environment & Climate",
      "score": 95,
      "summary": "Binding 2030 emissions targets agreed with $100B climate finance"
    },
    {
      "id": "econ-002",
      "title": "Union Budget 2026: Sectoral Allocation and Tax Changes",
      "category": "Economy & Reports",
      "score": 88,
      "summary": "Budget prioritizes infrastructure (22%) and social spending"
    }
  ],
  "topic_cards": [
    {
      "id": "env-001",
      "title": "Global Climate Summit Agreement",
      "category": "Environment & Climate",
      "score": 95
    }
  ]
}
```

---

### 9. Get Insights

**Request:**
```bash
curl http://localhost:3000/api/insights | jq
```

**Response:**
```json
{
  "high_priority_domains": [
    "Environment & Climate",
    "Economy & Reports",
    "International Relations"
  ],
  "key_trends": [
    "Renewable energy transition acceleration",
    "Fiscal consolidation with social spending",
    "Regional geopolitics intensifying"
  ],
  "recurring_topics": [
    "Climate policy frameworks",
    "Budget implementation",
    "Border management"
  ],
  "strategy_notes": [
    "Climate topics showing high repeat probability",
    "Budget details essential for Mains preparation",
    "Geopolitical awareness critical for GS-II"
  ]
}
```

---

## 🧪 Advanced Examples

### Filter High-Priority Topics

**JavaScript:**
```javascript
const response = await fetch('http://localhost:3000/api/topics');
const topics = await response.json();

const highPriority = topics.filter(t => t.metadata.importance_tag === 'high');
console.log(`Found ${highPriority.length} high-priority topics`);
highPriority.forEach(t => console.log(t.title));
```

### Extract MCQs

**Python:**
```python
import requests

response = requests.get('http://localhost:3000/api/topics')
topics = response.json()

mcqs = []
for topic in topics:
    if 'prelims' in topic and 'mcq' in topic['prelims']:
        mcqs.append({
            'topic': topic['title'],
            'question': topic['prelims']['mcq']['question'],
            'options': topic['prelims']['mcq']['options']
        })

for mcq in mcqs:
    print(f"\n{mcq['topic']}")
    print(f"Q: {mcq['question']}")
    for i, opt in enumerate(mcq['options'], 1):
        print(f"  {i}. {opt}")
```

### Get Mains Answer Frameworks

**JavaScript:**
```javascript
const response = await fetch('http://localhost:3000/api/topics');
const topics = await response.json();

topics.forEach(topic => {
  if (topic.mains) {
    console.log(`\n📝 ${topic.title}`);
    console.log(`Paper: ${topic.mains.gs_paper}`);
    console.log(`Q: ${topic.mains.question}`);
    console.log('Answer Structure:');
    console.log(`  • Intro: ${topic.mains.answer_framework.intro}`);
    topic.mains.answer_framework.body.forEach((point, i) => {
      console.log(`  • Point ${i+1}: ${point}`);
    });
  }
});
```

### Compare Trends Across Dates

**Python:**
```python
import requests
from collections import Counter

response = requests.get('http://localhost:3000/api/history')
history = response.json()

all_categories = []
for entry in history['entries']:
  for topic in entry.get('topics', []):
    all_categories.append(topic['category'])

trends = Counter(all_categories)
print("Topic Category Frequency:")
for category, count in trends.most_common():
  print(f"  {category}: {count}")
```

### Export to CSV

**Python:**
```python
import requests
import csv

response = requests.get('http://localhost:3000/api/topics')
topics = response.json()

with open('topics.csv', 'w', newline='') as f:
  writer = csv.DictWriter(f, fieldnames=['id', 'title', 'category', 'relevance', 'importance'])
  writer.writeheader()
  for topic in topics:
    writer.writerow({
      'id': topic['id'],
      'title': topic['title'],
      'category': topic['category'],
      'relevance': topic['upsc_relevance_score'],
      'importance': topic['metadata']['importance_tag']
    })

print("Exported to topics.csv")
```

---

## ⚙️ Using with Frontend

### React Example

```jsx
import { useEffect, useState } from 'react';

function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3000/api/today')
      .then(r => r.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => console.error(err));
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>UPSC Intelligence</h1>
      <h2>Plan</h2>
      <p>{data.plan.processing_strategy}</p>
      
      <h2>Topics ({data.topics.length})</h2>
      {data.topics.map(topic => (
        <div key={topic.id}>
          <h3>{topic.title}</h3>
          <p>Relevance: {topic.upsc_relevance_score}/100</p>
          <p>{topic.explanation}</p>
        </div>
      ))}
    </div>
  );
}

export default Dashboard;
```

### Vue Example

```vue
<template>
  <div>
    <h1>UPSC Intelligence Dashboard</h1>
    <div v-if="loading">Loading...</div>
    <div v-else>
      <div class="topics">
        <div v-for="topic in data.topics" :key="topic.id" class="topic-card">
          <h3>{{ topic.title }}</h3>
          <p class="category">{{ topic.category }}</p>
          <p class="score">Relevance: {{ topic.upsc_relevance_score }}/100</p>
          <p>{{ topic.explanation }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      data: null,
      loading: true
    };
  },
  mounted() {
    fetch('http://localhost:3000/api/today')
      .then(r => r.json())
      .then(data => {
        this.data = data;
        this.loading = false;
      });
  }
};
</script>
```

---

## 🔧 Common Use Cases

### Get Study Plan for the Day
```bash
curl http://localhost:3000/api/today | jq '.topics[] | {title, category, explanation}'
```

### List All Topics by Category
```bash
curl http://localhost:3000/api/topics | jq 'group_by(.category)'
```

### Get All MCQs
```bash
curl http://localhost:3000/api/topics | jq '.[] | select(.prelims.mcq) | {title: .title, mcq: .prelims.mcq}'
```

### Check System Health
```bash
curl -s http://localhost:3000/health && echo "✓ API is running"
```

---

## 📊 Performance Tips

1. **Cache responses** - Store API results locally
2. **Paginate** - For large result sets, fetch by date
3. **Select fields** - Use `jq` to extract only needed data
4. **Schedule requests** - Don't hammer API constantly

```javascript
// Example caching
const cache = new Map();

async function getTopics() {
  const cacheKey = 'topics';
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }
  const data = await fetch('http://localhost:3000/api/topics').then(r => r.json());
  cache.set(cacheKey, data);
  
  // Clear cache after 1 hour
  setTimeout(() => cache.delete(cacheKey), 3600000);
  return data;
}
```

---

## 🆘 Error Handling

```javascript
async function fetchTopics() {
  try {
    const response = await fetch('http://localhost:3000/api/topics');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch topics:', error);
    return [];
  }
}
```

---

Ready to integrate! Choose your stack and follow the examples above.
