import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useSupabaseSync<T extends { id: string }>(tableName: string) {
  const cacheKey = `financekit_cache_${tableName}`;
  
  // Initial state from LocalStorage for instant load
  const [data, setData] = useState<T[]>(() => {
    const saved = localStorage.getItem(cacheKey);
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(true);

  // Load initial data from Supabase
  useEffect(() => {
    const fetch = async () => {
      try {
        const { data: remoteData, error } = await supabase.from(tableName).select('*');
        if (error) {
           console.error('Error fetching', tableName, error);
        } else if (remoteData && remoteData.length > 0) {
           setData(remoteData as T[]);
           localStorage.setItem(cacheKey, JSON.stringify(remoteData));
        }
      } catch (err) {
        console.error('Network error during Supabase fetch', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [tableName]);

  // Real-time Subscription
  useEffect(() => {
    const channel = supabase
      .channel(`realtime_${tableName}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setData(prev => [...prev, payload.new as T]);
        } else if (payload.eventType === 'UPDATE') {
          setData(prev => prev.map(item => item.id === payload.new.id ? (payload.new as T) : item));
        } else if (payload.eventType === 'DELETE') {
          setData(prev => prev.filter(item => item.id === payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableName]);

  const updateData: React.Dispatch<React.SetStateAction<T[]>> = (action) => {
    setData((prev) => {
      const next = typeof action === 'function' ? (action as any)(prev) : action;
      localStorage.setItem(cacheKey, JSON.stringify(next));
      
      // For bulk updates (like clear all or adding multiple records)
      supabase.from(tableName).upsert(next).then(({error}) => {
         if (error) console.error('Supabase sync error', error);
      });
      
      return next;
    });
  };

  return [data, updateData, loading] as const;
}
