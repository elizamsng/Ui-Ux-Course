import { useCallback, useEffect, useState } from 'react';
import { Globe } from 'lucide-react';
import { MARKET_INSTRUMENTS, formatInstrumentPrice } from './data/marketsData';
import { AssetCategory, CommunityIdea, MarketInstrument, MarketNewsItem } from './types/markets';
import { Header, MarketSectionTab } from './components/Header';
import { MarketSummarySection } from './components/MarketSummarySection';
import { StocksSection } from './components/StocksSection';
import { CommunityIdeasSection } from './components/CommunityIdeasSection';
import { MultiAssetGridSection } from './components/MultiAssetGridSection';
import { NewsAndCalendarSection } from './components/NewsAndCalendarSection';
import { PriceChangeText, TickerBadge } from './components/TickerBadge';
import {
  IdeaDetailModal,
  NewsReaderModal,
  SearchPaletteModal,
  SymbolChartModal,
  WatchlistDrawer,
} from './components/ModalsAndDrawers';

const DEFAULT_WATCHLIST = ['SPX', 'NVDA', 'BTCUSD', 'GC1!', 'US10Y'];

export default function App() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('tv_markets_theme') === 'dark';
  });

  const [activeTab, setActiveTab] = useState<MarketSectionTab>('overview');
  const [selectedSummarySymbol, setSelectedSummarySymbol] = useState<string>('SPX');
  const [inspectedInstrument, setInspectedInstrument] = useState<MarketInstrument | null>(null);
  const [selectedIdea, setSelectedIdea] = useState<CommunityIdea | null>(null);
  const [selectedNews, setSelectedNews] = useState<MarketNewsItem | null>(null);
  const [isWatchlistOpen, setIsWatchlistOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [watchlist, setWatchlist] = useState<string[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_WATCHLIST;
    try {
      const saved = localStorage.getItem('tv_markets_watchlist');
      return saved ? JSON.parse(saved) : DEFAULT_WATCHLIST;
    } catch {
      return DEFAULT_WATCHLIST;
    }
  });

  const [boostedIds, setBoostedIds] = useState<string[]>([]);

  // Sync dark mode class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('tv_markets_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('tv_markets_theme', 'light');
    }
  }, [isDark]);

  // Persist watchlist
  useEffect(() => {
    try {
      localStorage.setItem('tv_markets_watchlist', JSON.stringify(watchlist));
    } catch {
      // Ignore storage quota issues
    }
  }, [watchlist]);

  // Global keyboard shortcuts (Cmd/Ctrl+K for Search, Escape to close overlays)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsWatchlistOpen(false);
        setInspectedInstrument(null);
        setSelectedIdea(null);
        setSelectedNews(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleToggleWatchlist = useCallback((symbol: string) => {
    setWatchlist((prev) =>
      prev.includes(symbol) ? prev.filter((s) => s !== symbol) : [...prev, symbol]
    );
  }, []);

  const handleToggleBoost = useCallback((id: string) => {
    setBoostedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const handleSelectTab = useCallback((tab: MarketSectionTab) => {
    setActiveTab(tab);
    if (tab === 'overview') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const targetMap: Record<Exclude<MarketSectionTab, 'overview'>, string> = {
      stocks: 'stocks-section',
      crypto: 'crypto-section',
      futures: 'futures-section',
      forex: 'forex-section',
      bonds: 'bonds-section',
      calendar: 'calendar-section',
    };
    const el = document.getElementById(targetMap[tab]);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handleOpenTickerBySymbol = useCallback((symbol: string) => {
    const found = MARKET_INSTRUMENTS.find((item) => item.symbol === symbol);
    if (found) {
      setInspectedInstrument(found);
    }
  }, []);

  const focusedCategory: AssetCategory | null =
    activeTab === 'crypto' ||
    activeTab === 'futures' ||
    activeTab === 'forex' ||
    activeTab === 'bonds'
      ? activeTab
      : null;

  const worldIndices = MARKET_INSTRUMENTS.filter(
    (item) => item.category === 'indices' && item.region === 'World'
  );

  return (
    <div id="top" className="min-h-screen flex flex-col bg-white dark:bg-[#131722] text-[#131722] dark:text-[#D1D4DC]">
      <Header
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenWatchlist={() => setIsWatchlistOpen(true)}
        onOpenSuperchart={() => {
          const current =
            MARKET_INSTRUMENTS.find((i) => i.symbol === selectedSummarySymbol) ??
            MARKET_INSTRUMENTS[0];
          setInspectedInstrument(current);
        }}
        watchlistCount={watchlist.length}
        isDark={isDark}
        onToggleTheme={() => setIsDark((prev) => !prev)}
      />

      <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-6">
        {/* 1. Market Summary & Interactive Chart */}
        <MarketSummarySection
          instruments={MARKET_INSTRUMENTS}
          selectedSymbol={selectedSummarySymbol}
          onSelectSymbol={setSelectedSummarySymbol}
          onOpenFullChart={(inst) => setInspectedInstrument(inst)}
          watchlist={watchlist}
          onToggleWatchlist={handleToggleWatchlist}
        />

        {/* World Indices Strip */}
        <section
          aria-label="Global equity indices"
          className="pb-8"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-[#131722] dark:text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#2962FF]" />
              <span>Major world indices</span>
            </h2>
            <span className="text-xs text-[#787B86]">Europe &amp; Asia-Pacific</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {worldIndices.map((idx) => (
              <button
                key={idx.symbol}
                type="button"
                onClick={() => setInspectedInstrument(idx)}
                className="text-left p-3.5 rounded-lg border border-[#E0E3EB] dark:border-[#2A2E39] bg-[#F8FAFD] dark:bg-[#1E222D] hover:border-[#2962FF]/60 transition-colors flex items-center justify-between gap-3 cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <TickerBadge instrument={idx} size="sm" />
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-[#131722] dark:text-white truncate">
                      {idx.name}
                    </div>
                    <div className="text-[11px] font-mono text-[#787B86]">
                      {idx.symbol} · {idx.exchange}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[13px] font-mono-tabular font-semibold text-[#131722] dark:text-white">
                    {formatInstrumentPrice(idx.price, idx.decimals)}
                  </div>
                  <PriceChangeText
                    change={idx.change}
                    changePct={idx.changePct}
                    decimals={idx.decimals}
                    showAbs={false}
                    compact
                  />
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* 2. Stocks Screener & S&P 500 Sectors */}
        <StocksSection
          instruments={MARKET_INSTRUMENTS}
          onInspectInstrument={(inst) => setInspectedInstrument(inst)}
          watchlist={watchlist}
          onToggleWatchlist={handleToggleWatchlist}
        />

        {/* 3. Community Ideas */}
        <CommunityIdeasSection
          onSelectIdea={(idea) => setSelectedIdea(idea)}
          boostedIds={boostedIds}
          onToggleBoost={handleToggleBoost}
        />

        {/* 4. Crypto, Futures, Forex & Bonds */}
        <MultiAssetGridSection
          instruments={MARKET_INSTRUMENTS}
          onInspectInstrument={(inst) => setInspectedInstrument(inst)}
          watchlist={watchlist}
          onToggleWatchlist={handleToggleWatchlist}
          focusedCategory={focusedCategory}
        />

        {/* 5. Market News & Economic Calendar */}
        <NewsAndCalendarSection
          onSelectNews={(news) => setSelectedNews(news)}
          onSelectSymbolByTicker={handleOpenTickerBySymbol}
        />
      </main>

      {/* Clean Editorial Footer */}
      <footer className="border-t border-[#E0E3EB] dark:border-[#2A2E39] bg-[#F8FAFD] dark:bg-[#1E222D]">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#787B86]">
          <div className="flex flex-col gap-1">
            <span className="font-bold text-[#131722] dark:text-white text-sm">
              TradingView Markets
            </span>
            <span>
              Global market overview · Equities, crypto, futures, forex, and sovereign bonds.
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-5">
            <button
              type="button"
              onClick={() => handleSelectTab('stocks')}
              className="hover:text-[#131722] dark:hover:text-white transition-colors cursor-pointer"
            >
              Stock Screener
            </button>
            <button
              type="button"
              onClick={() => handleSelectTab('crypto')}
              className="hover:text-[#131722] dark:hover:text-white transition-colors cursor-pointer"
            >
              Crypto Markets
            </button>
            <button
              type="button"
              onClick={() => handleSelectTab('calendar')}
              className="hover:text-[#131722] dark:hover:text-white transition-colors cursor-pointer"
            >
              Economic Calendar
            </button>
            <button
              type="button"
              onClick={() => setIsWatchlistOpen(true)}
              className="hover:text-[#131722] dark:hover:text-white transition-colors cursor-pointer"
            >
              Watchlist
            </button>
          </div>
        </div>
      </footer>

      {/* Interactive Modals & Drawers */}
      <SymbolChartModal
        instrument={inspectedInstrument}
        onClose={() => setInspectedInstrument(null)}
        watchlist={watchlist}
        onToggleWatchlist={handleToggleWatchlist}
      />

      <IdeaDetailModal
        idea={selectedIdea}
        onClose={() => setSelectedIdea(null)}
        isBoosted={selectedIdea ? boostedIds.includes(selectedIdea.id) : false}
        onToggleBoost={handleToggleBoost}
        onOpenTicker={handleOpenTickerBySymbol}
      />

      <NewsReaderModal
        news={selectedNews}
        onClose={() => setSelectedNews(null)}
        onOpenTicker={handleOpenTickerBySymbol}
      />

      <WatchlistDrawer
        open={isWatchlistOpen}
        onClose={() => setIsWatchlistOpen(false)}
        instruments={MARKET_INSTRUMENTS}
        watchlist={watchlist}
        onToggleWatchlist={handleToggleWatchlist}
        onInspectInstrument={(inst) => setInspectedInstrument(inst)}
      />

      <SearchPaletteModal
        open={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        instruments={MARKET_INSTRUMENTS}
        onSelectInstrument={(inst) => setInspectedInstrument(inst)}
      />
    </div>
  );
}
