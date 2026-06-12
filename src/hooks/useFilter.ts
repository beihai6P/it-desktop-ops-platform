import { useMemo } from 'react';

export function useFilter<T>(
  data: T[],
  searchQuery: string,
  filterFields: (keyof T)[],
  categoryField?: keyof T,
  activeCategory?: string | null
) {
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchesSearch = searchQuery
        ? filterFields.some((field) => {
            const value = item[field];
            if (typeof value === 'string') {
              return value.toLowerCase().includes(searchQuery.toLowerCase());
            }
            if (Array.isArray(value)) {
              return value.some((v) =>
                typeof v === 'string' && v.toLowerCase().includes(searchQuery.toLowerCase())
              );
            }
            return false;
          })
        : true;

      const matchesCategory =
        !categoryField || !activeCategory || activeCategory === '全部' || activeCategory === 'all'
          ? true
          : String(item[categoryField]) === activeCategory;

      return matchesSearch && matchesCategory;
    });
  }, [data, searchQuery, filterFields, categoryField, activeCategory]);

  return filteredData;
}
