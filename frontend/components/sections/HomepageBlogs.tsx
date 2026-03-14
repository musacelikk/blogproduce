'use client';

import { useState, useEffect, useCallback } from 'react';
import { ExampleBlogsCarousel } from './ExampleBlogsCarousel';
import { getPublicPosts, getHomepagePosts, type Post } from '@/lib/api';

export function HomepageBlogs() {
  const [blogs, setBlogs] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBlogs = useCallback(async () => {
    try {
      setLoading(true);
      const homepagePostIds = await getHomepagePosts();
      if (homepagePostIds && homepagePostIds.length > 0) {
        const posts = await getPublicPosts(10, homepagePostIds);
        setBlogs(posts);
      } else {
        setBlogs([]);
      }
    } catch (error) {
      console.error('Failed to fetch homepage blogs:', error);
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBlogs();
  }, [loadBlogs]);

  // Refresh blogs when window gets focus (in case admin updated homepage posts)
  useEffect(() => {
    const handleFocus = () => {
      loadBlogs();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadBlogs]);

  if (loading) {
    return null;
  }

  if (blogs.length === 0) {
    return null;
  }

  return <ExampleBlogsCarousel blogs={blogs} />;
}

