// ============================================================================
// LAYOUT COMPONENT
// ============================================================================
// Main application layout with sidebar navigation and responsive design

// Navigation menu items configuration
const navigationItems = [
  {
    title: "Markets",
    url: createPageUrl("Markets"),
    icon: TrendingUp,
  },
  {
    title: "Portfolio",
    url: createPageUrl("Portfolio"),
    icon: Wallet,
  },
  {
    title: "Analytics",
    url: createPageUrl("Markets"),
    icon: BarChart3,
  },
];

/**
 * Sidebar content component with navigation and user profile
 * Handles user authentication state and logout functionality
 */
function SidebarContent_() {
  const location = useLocation();  // Get current route location
  const [user, setUser] = React.useState(null);  // Store authenticated user data
  const { setOpen } = useSidebar();  // Control sidebar open/close state

  // Fetch current user on component mount
  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => { });
  }, []);

  // Handle user logout
  const handleLogout = () => {
    base44.auth.logout();
  };

  return (
    <Sidebar
      className="border-r border-amber-900/30 bg-gradient-to-b from-amber-600 via-amber-700 to-yellow-700 backdrop-blur-xl"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      collapsible="offcanvas"
    >
      <SidebarHeader className="border-b border-amber-900/30 p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/50">
            <TrendingUp className="w-6 h-6 text-white font-bold" />
          </div>
          <div>
            <h2 className="font-bold text-xl text-yellow-400 tracking-tight">Samsa</h2>
            <p className="text-xs text-amber-100 font-medium">Prediction Markets</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-3">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-amber-100 uppercase tracking-wider px-3 py-3">
            Navigate
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className={`hover:bg-amber-800/50 transition-all duration-200 rounded-xl mb-1 ${location.pathname === item.url
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white border border-indigo-500/50 shadow-lg shadow-indigo-900/30'
                      : 'text-amber-50'
                      }`}
                  >
                    <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-amber-900/30 p-4">
        {user ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 px-2">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-full flex items-center justify-center shadow-lg shadow-indigo-900/30">
                <span className="text-white font-semibold text-sm">
                  {user.full_name?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm truncate">{user.full_name || 'User'}</p>
                <p className="text-xs text-amber-100 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-amber-50 hover:text-white hover:bg-amber-800/50 rounded-lg transition-colors duration-200"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        ) : null}
      </SidebarFooter>
    </Sidebar>
  );
}

/**
 * Main Layout Component
 * Wraps all pages with sidebar navigation and responsive header
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Page content to render
 * @param {string} props.currentPageName - Name of the current page (unused but available)
 */
export default function Layout({ children, currentPageName }) {
  return (
    <SidebarProvider defaultOpen={false}>
      {/* CSS custom properties for theming */}
      <style>{`
        :root {
          --primary: 220 70% 15%;
          --primary-foreground: 48 100% 96%;
          --accent: 38 92% 50%;
          --accent-foreground: 48 100% 96%;
        }
      `}</style>

      <div className="min-h-screen flex w-full bg-slate-950">
        {/* Collapsible sidebar navigation */}
        <SidebarContent_ />

        {/* Main content area */}
        <main className="flex-1 flex flex-col">
          {/* Mobile header with sidebar trigger (hidden on large screens) */}
          <header className="bg-slate-950/30 backdrop-blur-xl border-b border-slate-800 px-6 py-4 lg:hidden">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-slate-800 p-2 rounded-lg transition-colors duration-200 text-white" />
              <h1 className="text-xl font-bold text-yellow-400">Samsa</h1>
            </div>
          </header>

          {/* Page content container with scroll */}
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}