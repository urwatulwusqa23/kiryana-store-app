import {
  Apple, Carrot, Milk, Croissant, Coffee, Cookie, Beef, Fish,
  Wheat, Sparkles, Egg, IceCream2, Candy, Salad,
} from 'lucide-react'

// Grocery items don't have a real category field in the backend — this is a lightweight
// keyword classifier purely for giving the storefront grid visual variety (icon + color
// per product) instead of one flat gray box with a generic package icon for everything.
const CATEGORIES = [
  { key: 'produce',  icon: Carrot,    color: '#4c7a41', bg: '#eaf3e6', match: /rice|carrot|potato|onion|vegetable|tomato|pea|garlic|ginger|lentil|chickpea|salad|greens/i },
  { key: 'fruit',     icon: Apple,     color: '#c1392b', bg: '#faece9', match: /apple|banana|mango|orange|grape|fruit|lemon|cherry/i },
  { key: 'dairy',     icon: Milk,      color: '#4a7d94', bg: '#e8f1f4', match: /milk|yogurt|cheese|butter|cream|dahi/i },
  { key: 'bakery',    icon: Croissant, color: '#e0a72c', bg: '#fbf1dc', match: /bread|bun|croissant|cake|flour|bakery/i },
  { key: 'egg',       icon: Egg,       color: '#9a8a68', bg: '#f4efe4', match: /egg/i },
  { key: 'beverage',  icon: Coffee,    color: '#6e5f45', bg: '#f0e8da', match: /tea|coffee|juice|drink|water|soda|cola/i },
  { key: 'snack',     icon: Cookie,    color: '#d17a2e', bg: '#fbe9d8', match: /biscuit|cookie|chip|snack|namkeen|chana/i },
  { key: 'sweet',     icon: Candy,     color: '#8a5c8a', bg: '#f3e8f3', match: /candy|chocolate|sweet|mithai|toffee/i },
  { key: 'frozen',    icon: IceCream2, color: '#4a7d94', bg: '#e8f1f4', match: /ice cream|frozen/i },
  { key: 'meat',      icon: Beef,      color: '#c1392b', bg: '#faece9', match: /beef|mutton|chicken|meat|sausage/i },
  { key: 'fish',      icon: Fish,      color: '#4a7d94', bg: '#e8f1f4', match: /fish|seafood|prawn/i },
  { key: 'grain',     icon: Wheat,     color: '#e0a72c', bg: '#fbf1dc', match: /wheat|sugar|salt|spice|masala|oil|ghee|atta/i },
]

const FALLBACK = { key: 'other', icon: Sparkles, color: '#8a6a4a', bg: '#f4efe4' }

export function categorize(name = '') {
  const found = CATEGORIES.find(c => c.match.test(name))
  return found || FALLBACK
}
