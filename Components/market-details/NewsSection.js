// ============================================================================
// NEWS SECTION COMPONENT
// ============================================================================
// Displays AI-generated news articles related to a market

/**
 * News Section Component
 * Uses LLM to fetch and display recent news articles relevant to the market
 * Helps users stay informed about factors that might affect outcomes
 * @param {Object} props - Component props
 * @param {string} props.searchQuery - Search keywords for finding relevant news
 */
export default function NewsSection({ searchQuery }) {
  const [news, setNews] = useState([]);  // Stores fetched news articles
  const [loading, setLoading] = useState(false);  // Loading state

  /**
   * Fetch news articles using LLM with internet context
   * Runs when searchQuery changes
   */
  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      try {
        // Use LLM to find and format recent news articles
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `Find the latest news and updates about: ${searchQuery}.
          Provide 5 recent news items with title, brief description, source, and a realistic date within the last week.`,
          add_context_from_internet: true,  // Enable web search for current news
          response_json_schema: {
            type: "object",
            properties: {
              news_items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    source: { type: "string" },
                    date: { type: "string" },
                    url: { type: "string" }
                  }
                }
              }
            }
          }
        });
        setNews(result.news_items || []);
      } catch (error) {
        console.error("Error fetching news:", error);
      }
      setLoading(false);
    };

    if (searchQuery) {
      fetchNews();
    }
  }, [searchQuery]);

  if (loading) {
    return (
      <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800 p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Newspaper className="w-5 h-5 text-yellow-400" />
        <h3 className="text-lg font-bold text-yellow-400">Latest News & Updates</h3>
      </div>

      <div className="space-y-4">
        {news.length === 0 ? (
          <p className="text-slate-400 text-center py-8">No news available</p>
        ) : (
          news.map((item, index) => (
            <div
              key={index}
              className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 hover:border-yellow-500/50 transition-all duration-200 group"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <h4 className="font-semibold text-white group-hover:text-yellow-400 transition-colors line-clamp-2">
                  {item.title}
                </h4>
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-yellow-400 hover:text-yellow-300 flex-shrink-0"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
              <p className="text-sm text-slate-300 mb-3 line-clamp-2">{item.description}</p>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{item.source}</span>
                <span>{item.date}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
