
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { NewsArticle } from '../types';

interface NewsState {
    articles: NewsArticle[];
    loading: boolean;
    fetchArticles: () => Promise<void>;
}

export const useNewsStore = create<NewsState>((set) => ({
    articles: [],
    loading: false,
    fetchArticles: async () => {
        set({ loading: true });
        
        const { data, error } = await supabase
            .from('news_articles')
            .select('*')
            .order('published_at', { ascending: false });
            
        if (error) {
            console.error('Error fetching news:', error);
        } else {
            set({ articles: data as NewsArticle[] });
        }
        set({ loading: false });
    }
}));
