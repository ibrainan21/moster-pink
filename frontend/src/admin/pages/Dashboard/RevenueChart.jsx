import { useState } from "react";
import styles from "./RevenueChart.module.css";

const formatPrice = (value) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value);

const formatDayLabel = (dateStr) =>
  new Date(`${dateStr}T00:00:00`).toLocaleDateString("es-MX", { day: "numeric", month: "short" });

/**
 * RevenueChart
 * Gráfica de barras simple en SVG puro -- este proyecto no tiene una
 * librería de gráficas instalada (recharts, chart.js, etc.) y agregar una
 * dependencia nueva solo para 14 barras no vale la pena, así que se dibuja
 * a mano. `data` es un array de { date, revenue, orders } ya con huecos
 * rellenados (ver dashboard.repository.getRevenueByDay).
 */
function RevenueChart({ data }) {
  const [hoverIndex, setHoverIndex] = useState(null);

  const max = Math.max(1, ...data.map((d) => d.revenue));
  const width = 700;
  const height = 220;
  const barGap = 6;
  const barWidth = data.length ? width / data.length - barGap : 0;

  if (!data.length || data.every((d) => d.revenue === 0)) {
    return <p className={styles.empty}>Todavía no hay ventas registradas en este periodo.</p>;
  }

  return (
    <div className={styles.wrapper}>
      <svg viewBox={`0 0 ${width} ${height + 30}`} className={styles.svg} preserveAspectRatio="none">
        {data.map((d, i) => {
          const barHeight = Math.max(2, (d.revenue / max) * height);
          const x = i * (barWidth + barGap);
          const y = height - barHeight;
          const isHovered = hoverIndex === i;

          return (
            <g
              key={d.date}
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
            >
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={4}
                fill={isHovered ? "#ff5c93" : "#ffc2d9"}
              />
              <rect x={x} y={0} width={barWidth} height={height} fill="transparent" />
              {i % 2 === 0 && (
                <text
                  x={x + barWidth / 2}
                  y={height + 20}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#999"
                >
                  {formatDayLabel(d.date)}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {hoverIndex !== null && (
        <div className={styles.tooltip}>
          <strong>{formatDayLabel(data[hoverIndex].date)}</strong>
          <span>{formatPrice(data[hoverIndex].revenue)}</span>
          <span className={styles.tooltipOrders}>{data[hoverIndex].orders} pedidos</span>
        </div>
      )}
    </div>
  );
}

export default RevenueChart;
