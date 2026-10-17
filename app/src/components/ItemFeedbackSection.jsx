import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, MessageSquare, MessageSquarePlus, MapPin, Sparkles, ShieldCheck, ChevronDown } from 'lucide-react';
import { syncChannel } from '../utils/syncManager.js';

const ItemFeedbackSection = ({ itemId, altId, itemType = 'property', itemTitle = '' }) => {
  const navigate = useNavigate();
  const [feedbacks, setFeedbacks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(3);

  const typeLabels = {
    property: 'Individual House',
    land: 'Residential Plot / Land',
    project: 'Construction Project'
  };

  const currentLabel = typeLabels[itemType] || 'Property';

  const fetchItemFeedbacks = async () => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams();
      if (itemId) queryParams.set('item_id', String(itemId));
      if (altId) queryParams.set('alt_id', String(altId));
      if (itemType) queryParams.set('item_type', itemType);
      if (itemTitle) queryParams.set('item_title', itemTitle);

      const res = await fetch(`/api/feedback?${queryParams.toString()}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setFeedbacks(data);
      }
    } catch (err) {
      console.error('Failed to fetch item feedbacks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItemFeedbacks();

    const handleSync = () => {
      fetchItemFeedbacks();
    };

    window.addEventListener('sk_site_data_updated', handleSync);
    window.addEventListener('data_updated', handleSync);

    const handleStorage = (e) => {
      if (['sk_site_data_updated', 'data_updated'].includes(e.key)) {
        handleSync();
      }
    };
    window.addEventListener('storage', handleStorage);

    const handleBroadcast = (e) => {
      if (e?.data?.type === 'DATA_UPDATED') {
        handleSync();
      }
    };
    if (syncChannel) {
      syncChannel.addEventListener('message', handleBroadcast);
    }

    return () => {
      window.removeEventListener('sk_site_data_updated', handleSync);
      window.removeEventListener('data_updated', handleSync);
      window.removeEventListener('storage', handleStorage);
      if (syncChannel) {
        syncChannel.removeEventListener('message', handleBroadcast);
      }
    };
  }, [itemId, altId, itemType, itemTitle]);

  const handleRedirectToFeedback = () => {
    const params = new URLSearchParams();
    if (itemType) params.set('type', itemType);
    if (itemId) params.set('id', String(itemId));
    if (itemTitle) params.set('title', itemTitle);
    params.set('mode', 'give_feedback');

    // Also set specific keys so any URL format works seamlessly
    if (itemType === 'property' && itemId) params.set('property_id', String(itemId));
    if (itemType === 'land' && itemId) params.set('land_id', String(itemId));
    if (itemType === 'project' && itemId) params.set('project_id', String(itemId));

    navigate(`/feedback?${params.toString()}`);
  };

  const calculateAverageRating = () => {
    if (feedbacks.length === 0) return '0.0';
    const total = feedbacks.reduce((acc, f) => acc + (f.rating || 5), 0);
    return (total / feedbacks.length).toFixed(1);
  };

  const visibleFeedbacks = feedbacks.slice(0, visibleCount);

  return (
    <div className="gold-specular-card bg-[#121216] p-5 sm:p-6 rounded-3xl border border-white/15 shadow-xl space-y-4 relative overflow-hidden">
      {/* Top Header Row with Title, Ratings & Give Feedback Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-white/10 pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-1.5">
              <MessageSquare size={16} className="text-amber-400" /> Client Reviews & Feedback
            </h3>
            {feedbacks.length > 0 && (
              <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[9.5px] font-black px-2 py-0.5 rounded-full">
                {feedbacks.length}
              </span>
            )}
          </div>
          <p className="text-[10.5px] text-zinc-400 font-medium">
            Verified feedback for this {currentLabel.toLowerCase()}{itemId ? ` (#${itemId})` : ''}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {feedbacks.length > 0 && (
            <div className="flex items-center gap-1 bg-[#18181c] px-2.5 py-1 rounded-xl border border-zinc-800 text-[11px] shrink-0">
              <Star size={12} className="text-amber-400 fill-amber-400" />
              <span className="font-black text-white">{calculateAverageRating()}</span>
              <span className="text-[9.5px] text-zinc-400 font-bold border-l border-zinc-700 pl-1">
                / 5.0
              </span>
            </div>
          )}

          {/* Give Feedback Button in header - ONLY show when reviews exist (removes duplicate button for the first time / empty state) */}
          {feedbacks.length > 0 && (
            <button
              type="button"
              onClick={handleRedirectToFeedback}
              className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black px-3.5 py-1.5 rounded-xl text-[11px] uppercase tracking-wider shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              title={`Give feedback for this ${currentLabel.toLowerCase()}`}
            >
              <MessageSquarePlus size={13} />
              <span>Give Feedback</span>
            </button>
          )}
        </div>
      </div>

      {/* Review Content Display Area */}
      {isLoading ? (
        <div className="space-y-2.5">
          {[1, 2].map((n) => (
            <div key={n} className="bg-[#18181c]/70 p-3.5 rounded-2xl border border-zinc-800/80 animate-pulse space-y-2">
              <div className="w-36 h-3.5 bg-zinc-800 rounded" />
              <div className="w-full h-6 bg-zinc-800/40 rounded" />
            </div>
          ))}
        </div>
      ) : feedbacks.length === 0 ? (
        /* Empty State with single Call-To-Action (No duplicate button) */
        <div className="bg-[#18181c]/80 border border-zinc-800/80 rounded-2xl p-5 sm:p-6 text-center flex flex-col items-center justify-center space-y-2.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Sparkles size={18} />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
              No Reviews Yet For This {currentLabel}
            </h4>
            <p className="text-[11px] text-zinc-400 max-w-xs mx-auto">
              Have you inspected or purchased this {currentLabel.toLowerCase()}? Share your valuable experience!
            </p>
          </div>
          <button
            type="button"
            onClick={handleRedirectToFeedback}
            className="mt-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black px-4 py-2 rounded-xl text-xs uppercase tracking-wider shadow-md shadow-amber-500/25 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <MessageSquarePlus size={13} />
            <span>Be the First to Give Feedback</span>
          </button>
        </div>
      ) : (
        /* List of Feedbacks inside Y-Axis Scrolling Container */
        <div className="space-y-2.5">
          <div className="feedback-scroll-container max-h-[400px] overflow-y-auto space-y-2.5 pr-1 sm:pr-2">
            {visibleFeedbacks.map((item) => (
              <div
                key={item.id}
                className="bg-gradient-to-br from-[#16161b] to-[#101014] hover:from-[#1a1a22] hover:to-[#14141a] p-3.5 rounded-2xl border border-zinc-800/80 hover:border-amber-500/30 transition-all space-y-2 shadow-sm"
              >
                {/* Header: Name, Location, Rating Stars & Date */}
                <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-white/5 pb-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-extrabold text-xs text-white">
                      {item.client_name}
                    </span>
                    {item.location && (
                      <span className="text-[9px] font-bold text-zinc-300 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800 flex items-center gap-1">
                        <MapPin size={8} className="text-amber-400" />
                        {item.location}
                      </span>
                    )}
                    <span className="text-[9px] font-black uppercase text-amber-400/90 tracking-wider bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30 flex items-center gap-0.5">
                      <ShieldCheck size={9} /> Verified
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-0.5 text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={10}
                          className={i < (item.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-zinc-700'}
                        />
                      ))}
                      <span className="text-[9.5px] font-black text-amber-300 ml-1">
                        {item.rating || 5}/5
                      </span>
                    </div>

                    <div className="text-[9px] font-mono text-zinc-400 bg-[#09090b] px-1.5 py-0.5 rounded border border-zinc-800">
                      {item.created_at
                        ? new Date(item.created_at.includes('T') ? item.created_at : item.created_at.replace(' ', 'T') + 'Z').toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })
                        : 'Recently'}
                    </div>
                  </div>
                </div>

                {/* Message Body */}
                <div className="bg-[#09090b]/70 px-3 py-2 rounded-xl border border-white/5 text-[11.5px] text-zinc-200 font-medium leading-relaxed italic">
                  "{item.message}"
                </div>
              </div>
            ))}
          </div>

          {/* View More Button (Loads another 3 on every click) */}
          {visibleCount < feedbacks.length && (
            <div className="flex justify-center pt-1.5">
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + 3)}
                className="bg-[#18181c] hover:bg-amber-500 hover:text-black text-amber-400 font-black px-4 py-2 rounded-xl text-xs uppercase tracking-wider border border-amber-500/30 hover:border-amber-400 transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer group"
              >
                <span>View More Reviews</span>
                <span className="bg-amber-500/20 group-hover:bg-black/20 text-amber-300 group-hover:text-black px-1.5 py-0.5 rounded-full text-[9.5px] font-extrabold transition-colors">
                  +{Math.min(3, feedbacks.length - visibleCount)}
                </span>
                <ChevronDown size={13} className="group-hover:translate-y-0.5 transition-transform" />
              </button>
            </div>
          )}

          {visibleCount >= feedbacks.length && feedbacks.length > 3 && (
            <div className="text-center pt-1 text-[10.5px] text-zinc-400 font-medium">
              Showing all {feedbacks.length} reviews for this {currentLabel.toLowerCase()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ItemFeedbackSection;
