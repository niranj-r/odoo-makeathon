import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * Animated SVG Sparkline with Gradient Fill Area
 */
const AnimatedSparkline = ({ data = [], isPositive = true, id = 'spark' }) => {
  if (!data || data.length < 2) return null;

  const width = 84;
  const height = 32;
  const padding = 3;

  const values = data.map((d) => d.val);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values.map((val, idx) => {
    const x = padding + (idx / (values.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((val - min) / range) * (height - 2 * padding);
    return { x: Number(x.toFixed(1)), y: Number(y.toFixed(1)) };
  });

  const lineD = `M ${points.map((p) => `${p.x},${p.y}`).join(' L ')}`;
  const areaD = `${lineD} L ${points[points.length - 1].x},${height} L ${points[0].x},${height} Z`;

  const strokeColor = isPositive ? '#2563EB' : '#F59E0B';
  const gradId = `spark-grad-${id}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
        </linearGradient>
      </defs>

      {/* Area Fill */}
      <path d={areaD} fill={`url(#${gradId})`} />

      {/* Curve Stroke */}
      <path
        d={lineD}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* End point dot */}
      {points.length > 0 && (
        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r="2.5"
          fill={strokeColor}
        />
      )}
    </svg>
  );
};

/**
 * SmartKpiCard
 * High-performance enterprise KPI summary card with trend comparison and animated SVG sparkline.
 *
 * @param {Object} props
 * @param {string} props.title
 * @param {string|number} props.value
 * @param {string} [props.change]
 * @param {'positive'|'negative'|'neutral'} [props.changeType='positive']
 * @param {string} [props.changePeriod]
 * @param {React.ComponentType} [props.icon]
 * @param {Array} [props.sparklineData]
 * @param {boolean} [props.isLiveUpdating=false]
 */
export const SmartKpiCard = ({
  id,
  title,
  value,
  change,
  changeType = 'positive',
  changePeriod = 'vs previous period',
  icon: Icon,
  sparklineData = [],
  isLiveUpdating = false,
}) => {
  const [highlight, setHighlight] = useState(false);
  const prevValueRef = useRef(value);

  // Smooth pulse highlight when value changes dynamically (Supabase Realtime)
  useEffect(() => {
    if (prevValueRef.current !== value) {
      setHighlight(true);
      const timer = setTimeout(() => setHighlight(false), 1200);
      prevValueRef.current = value;
      return () => clearTimeout(timer);
    }
  }, [value]);

  const isPositive = changeType === 'positive';
  const isNegative = changeType === 'negative';

  const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;

  return (
    <div
      className={`bg-white dark:bg-slate-900 border ${
        highlight
          ? 'border-blue-500 ring-2 ring-blue-500/20'
          : 'border-slate-200 dark:border-slate-800'
      } rounded-xl p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 flex flex-col justify-between`}
    >
      {/* Top Header: Title + Icon */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Icon size={17} className="stroke-[2]" />
          </div>
        )}
      </div>

      {/* Main Metric Value and Sparkline Row */}
      <div className="mt-3 flex items-end justify-between">
        <div>
          <div
            className={`text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 transition-colors duration-300 ${
              highlight ? 'text-blue-600 dark:text-blue-400 scale-[1.02]' : ''
            }`}
          >
            {value}
          </div>

          {/* Trend & Comparison */}
          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
            {change && (
              <span
                className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                  isPositive
                    ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/60'
                    : isNegative
                    ? 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border border-amber-200/60 dark:border-amber-800/60'
                    : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <TrendIcon size={12} className="stroke-[2.5]" />
                {change}
              </span>
            )}

            {changePeriod && (
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate">
                {changePeriod}
              </span>
            )}
          </div>
        </div>

        {/* Pure SVG Animated Sparkline */}
        {sparklineData && sparklineData.length > 1 && (
          <div className="mb-0.5 shrink-0 pl-2">
            <AnimatedSparkline
              id={id || title?.replace(/\s+/g, '-').toLowerCase()}
              data={sparklineData}
              isPositive={isPositive}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartKpiCard;

