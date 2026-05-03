// ============================================================================
// MARKETS PAGE
// ============================================================================
// Main page displaying all active prediction markets with search and filtering

import { useState, useRef, useEffect, useMemo } from 'react';

/**
 * Markets Page Component
 * Displays a grid of active prediction markets with search, category filtering,
 * and statistics dashboard
 */
export default function MarketsPage() {
  // State management
  const [searchQuery, setSearchQuery] = useState("");  // Search input value
  const [selectedCategory, setSelectedCategory] = useState("all");  // Selected category filter
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);  // Search suggestions visibility
  const searchRef = useRef(null);  // Reference for click-outside detection

  // Fetch all markets from the database
  const { data: markets, isLoading } = useQuery({
    queryKey: ['markets'],
    queryFn: () => base44.entities.Market.list('-created_date'),  // Sort by newest first
    initialData: [],
  });

  // Filter markets based on search query and category
  const filteredMarkets = markets.filter(market => {
    const matchesSearch = market.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      market.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || market.category === selectedCategory;
    return matchesSearch && matchesCategory && market.status === "active";
  });

  // Generate search suggestions based on current query (memoized for performance)
  const searchSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const suggestions = markets
      .filter(market =>
        market.status === "active" && (
          market.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          market.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          market.category.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
      .slice(0, 5)  // Limit to 5 suggestions
      .map(market => ({
        id: market.id,
        title: market.title,
        category: market.category
      }));

    return suggestions;
  }, [searchQuery, markets]);

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle search input changes
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setShowSearchDropdown(e.target.value.length > 0);
  };

  // Handle clicking on a search suggestion
  const handleSuggestionClick = (marketId) => {
    setShowSearchDropdown(false);
    const market = markets.find(m => m.id === marketId);
    if (market) {
      setSearchQuery(market.title);
    }
  };

  // Available market categories
  const categories = [
    { value: "all", label: "All Markets" },
    { value: "politics", label: "Politics" },
    { value: "sports", label: "Sports" },
    { value: "finance", label: "Finance" },
    { value: "technology", label: "Technology" },
    { value: "crypto", label: "Crypto" },
    { value: "entertainment", label: "Entertainment" },
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-7xl mx-auto p-6 lg:p-8">
        {/* Hero Section */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/20">
              <TrendingUp className="w-7 h-7 text-slate-950" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-yellow-400 tracking-tight">Prediction Markets</h1>
              <p className="text-slate-400 mt-1">Trade on the outcomes of real-world events</p>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium mb-1">Active Markets</p>
                  <p className="text-3xl font-bold text-yellow-400">{markets.filter(m => m.status === "active").length}</p>
                </div>
                <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-indigo-400" />
                </div>
              </div>
            </div>
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium mb-1">Total Volume</p>
                  <p className="text-3xl font-bold text-yellow-400">
                    ${markets.reduce((sum, m) => sum + (m.total_volume || 0), 0).toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-yellow-400" />
                </div>
              </div>
            </div>
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium mb-1">Closing Soon</p>
                  <p className="text-3xl font-bold text-yellow-400">
                    {markets.filter(m => m.status === "active" && m.close_date).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8 space-y-4">
          <div className="relative" ref={searchRef}>
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 z-10" />
            <Input
              placeholder="Search markets..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => searchQuery.length > 0 && setShowSearchDropdown(true)}
              className="pl-12 bg-slate-900/50 border-slate-800 text-white placeholder:text-slate-500 h-12 rounded-xl focus:ring-2 focus:ring-yellow-500/20"
            />

            {/* Search Dropdown */}
            {showSearchDropdown && searchSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-xl shadow-2xl shadow-black/50 z-50 overflow-hidden">
                <div className="p-2">
                  <div className="text-xs text-slate-500 px-3 py-2 font-medium">Search Results</div>
                  {searchSuggestions.map((suggestion) => (
                    <Link
                      key={suggestion.id}
                      to={createPageUrl(`MarketDetails?id=${suggestion.id}`)}
                      onClick={() => handleSuggestionClick(suggestion.id)}
                      className="block px-3 py-3 hover:bg-slate-800/50 rounded-lg transition-colors cursor-pointer group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium group-hover:text-yellow-400 transition-colors line-clamp-1">
                            {suggestion.title}
                          </p>
                          <p className="text-xs text-slate-400 mt-1 capitalize">{suggestion.category}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-yellow-400 transition-colors flex-shrink-0 mt-1" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="bg-slate-900/50 border border-slate-800 p-1 h-auto flex-wrap">
              {categories.map(cat => (
                <TabsTrigger
                  key={cat.value}
                  value={cat.value}
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-yellow-600 data-[state=active]:text-slate-950 text-slate-300 rounded-lg px-4 py-2"
                >
                  {cat.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Markets Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-80 bg-slate-900/50 border border-slate-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredMarkets.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Filter className="w-8 h-8 text-slate-600" />
            </div>
            <h3 className="text-xl font-semibold text-yellow-400 mb-2">No markets found</h3>
            <p className="text-slate-400">Try adjusting your filters or search query</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            {filteredMarkets.map(market => (
              <Link key={market.id} to={createPageUrl(`MarketDetails?id=${market.id}`)}>
                <MarketCard market={market} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
