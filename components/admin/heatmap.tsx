'use client';

import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

/**
 * Тепловая карта загрузки мест за месяц:
 * строка — место, столбец — день, цвет — % занятости.
 */

export interface HeatmapData {
  spaces: Array<{ id: string; name: string }>;
  days: string[]; // «2025-05-12»
  /** matrix[spaceIndex][dayIndex] = 0..1 (0 = нет данных/закрыто) */
  values: number[][];
}

export function OccupancyHeatmap({ data }: { data: HeatmapData }) {
  return (
    <div className="overflow-x-auto">
      <table className="border-separate border-spacing-1">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 min-w-[140px] bg-card p-1 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Место
            </th>
            {data.days.map((day) => (
              <th
                key={day}
                className="p-1 text-center text-[10px] font-medium text-muted-foreground"
              >
                {format(new Date(`${day}T12:00:00`), 'd', { locale: ru })}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.spaces.map((space, spaceIndex) => (
            <tr key={space.id}>
              <td className="sticky left-0 z-10 max-w-[160px] truncate bg-card p-1 text-xs font-semibold">
                {space.name}
              </td>
              {data.days.map((day, dayIndex) => {
                const value = data.values[spaceIndex]?.[dayIndex] ?? 0;
                const alpha = value > 0 ? 0.22 + value * 0.68 : 0.08;
                return (
                  <td key={`${space.id}-${day}`} className="p-0">
                    <div
                      title={`${format(new Date(`${day}T12:00:00`), 'd MMMM', { locale: ru })} — ${Math.round(value * 100)}%`}
                      className="h-6 w-6 rounded-md border border-primary/15 transition-transform duration-200 hover:scale-110"
                      style={{
                        backgroundColor: `hsl(258 88% 72% / ${alpha.toFixed(2)})`,
                      }}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <span>Меньше</span>
        {[0.08, 0.3, 0.5, 0.72, 0.9].map((alpha) => (
          <span
            key={alpha}
            className="h-3 w-5 rounded-md border border-primary/15"
            style={{ backgroundColor: `hsl(258 88% 72% / ${alpha})` }}
          />
        ))}
        <span>Больше загружено</span>
      </div>
    </div>
  );
}
