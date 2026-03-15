'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, Code, Key, Globe, Copy, Check, Terminal, ChevronDown, ChevronUp,
  AlertCircle, Info, ExternalLink, Play, FileText, Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { auth } from '@/lib/auth';
import { 
  getWorkspaces, 
  type Workspace,
  createWorkspaceApiKey,
  listWorkspaceApiKeys,
  revokeWorkspaceApiKey,
  type ApiKey,
  type CreateApiKeyRequest
} from '@/lib/api';
import { useRouter } from 'next/navigation';

// Production URL: https://api.blogenerate.com
// Development için .env.local'de NEXT_PUBLIC_API_URL=http://localhost:3001 set edin
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.blogenerate.com';

// Code examples for Blog Listing & Management
const listPostsExample = `// Blog Listing & Management API
const API_KEY = 'YOUR_API_KEY';

// List posts with cursor-based pagination (recommended)
async function listPosts(cursor = null) {
  const params = new URLSearchParams({
    status: 'published',
    limit: '50'
  });
  
  if (cursor) {
    params.append('cursor', cursor);
  }

  const response = await fetch('${API_BASE_URL}/v1/api/blog?' + params, {
    headers: {
      'Authorization': 'Bearer ' + API_KEY
    }
  });

  const result = await response.json();
  
  if (result.success) {
    console.log('Posts:', result.data.length);
    result.data.forEach(post => {
      console.log('Title:', post.title);
      console.log('Slug:', post.slug);
      console.log('Published:', post.publishedAt);
    });
    
    // Check if there are more posts
    if (result.meta.has_more) {
      console.log('Next cursor:', result.meta.next_cursor);
    }
  }
  
  return result;
}

// Get all posts with automatic pagination
async function getAllPosts(status = 'published') {
  const allPosts = [];
  let cursor = null;
  let hasMore = true;
  
  while (hasMore) {
    const result = await listPosts(cursor);
    if (result.success && result.data) {
      allPosts.push(...result.data);
      hasMore = result.meta?.has_more ?? false;
      cursor = result.meta?.next_cursor;
      if (!cursor && !hasMore) break;
    } else {
      break;
    }
  }
  
  return allPosts;
}

// Get post by ID (includes full content)
// format: 'json' | 'md' | 'html' — content alanının formatı; content_html her zaman döner
async function getPostById(postId, format = 'json') {
  const q = format ? '?' + new URLSearchParams({ format }).toString() : '';
  const response = await fetch('${API_BASE_URL}/v1/api/blog/' + postId + q, {
    headers: { 'Authorization': 'Bearer ' + API_KEY }
  });

  const result = await response.json();
  if (result.success) {
    const post = result.data;
    console.log('Title:', post.title);
    // Sitede göstermek için content_html kullanın (JSON görünmez)
    console.log('HTML:', post.content_html);
    console.log('Content (requested format):', post.content);
    console.log('ContentFormat:', post.contentFormat);
  }
  return result.data;
}

// Get post by slug — format: 'json' | 'md' | 'html' (opsiyonel)
async function getPostBySlug(slug, format) {
  const q = format ? '?' + new URLSearchParams({ format }).toString() : '';
  const response = await fetch('${API_BASE_URL}/v1/api/blog/slug/' + slug + q, {
    headers: { 'Authorization': 'Bearer ' + API_KEY }
  });
  const result = await response.json();
  return result.data;
}

// Usage example
(async () => {
  // First page (no cursor)
  const firstPage = await listPosts();
  console.log('First page:', firstPage.data.length, 'posts');
  
  // Next page (if available)
  if (firstPage.meta?.has_more) {
    const nextPage = await listPosts(firstPage.meta.next_cursor);
    console.log('Next page:', nextPage.data.length, 'posts');
  }
  
  // Get all posts automatically
  const allPosts = await getAllPosts('published');
  console.log('Total posts:', allPosts.length);
})();

// Publish a draft post
async function publishPost(postId) {
  const response = await fetch('${API_BASE_URL}/posts/' + postId + '/publish', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_JWT_TOKEN', // Note: JWT token for dashboard auth
      'Content-Type': 'application/json'
    }
  });

  const result = await response.json();
  console.log('Published:', result.data.slug);
  return result.data;
}`;

const hmacAuthExample = `// HMAC Authentication (Read-only, no API key needed)
const crypto = require('crypto');

const CLIENT_ID = 'bg_client_xxxxx';
const CLIENT_SECRET = 'bg_secret_xxxxx';

function generateHMACSignature(body, timestamp, secret) {
  const message = body + timestamp;
  return crypto
    .createHmac('sha256', secret)
    .update(message)
    .digest('hex');
}

async function listPostsWithHMAC() {
  const body = ''; // Empty for GET requests
  const timestamp = Date.now().toString();
  const signature = generateHMACSignature(body, timestamp, CLIENT_SECRET);

  const response = await fetch('${API_BASE_URL}/v1/api/blog', {
    method: 'GET',
    headers: {
      'X-Client-Id': CLIENT_ID,
      'X-Signature': signature,
      'X-Timestamp': timestamp
    }
  });

  const result = await response.json();
  console.log('Posts:', result.data);
  return result.data;
}

// Note: HMAC auth is read-only
// ✅ Allowed: GET requests (list, get by ID/slug)
// ❌ Not allowed: POST, PATCH, DELETE (create, update, delete)`;

const pythonExample = `# Python - Blog Listing & Management API
import requests

API_KEY = 'YOUR_API_KEY'
BASE_URL = '${API_BASE_URL}'

def list_posts(status='published', limit=50, cursor=None):
    """List blog posts with cursor pagination"""
    params = {
        'status': status,
        'limit': limit
    }
    if cursor:
        params['cursor'] = cursor
    
    headers = {'Authorization': f'Bearer {API_KEY}'}
    
    response = requests.get(
        f'{BASE_URL}/v1/api/blog',
        params=params,
        headers=headers
    )
    
    result = response.json()
    
    if result['success']:
        posts = result['data']
        print(f"Found {len(posts)} posts")
        
        for post in posts:
            print(f"Title: {post['title']}")
            print(f"Slug: {post['slug']}")
            print(f"Status: {post['status']}")
        
        if result['meta']['has_more']:
            print(f"Next cursor: {result['meta']['next_cursor']}")
    
    return result

def get_post_by_id(post_id):
    """Get a single post by ID"""
    headers = {'Authorization': f'Bearer {API_KEY}'}
    
    response = requests.get(
        f'{BASE_URL}/v1/api/blog/{post_id}',
        headers=headers
    )
    
    result = response.json()
    
    if result['success']:
        post = result['data']
        print(f"Title: {post['title']}")
        print(f"Content: {post['content_markdown'][:200]}...")
        print(f"SEO: {post['seo']}")
    
    return result['data']

def get_post_by_slug(slug):
    """Get a single post by slug"""
    headers = {'Authorization': f'Bearer {API_KEY}'}
    
    response = requests.get(
        f'{BASE_URL}/v1/api/blog/slug/{slug}',
        headers=headers
    )
    
    result = response.json()
    return result['data']

def publish_post(post_id, jwt_token):
    """Publish a draft post (requires JWT token from dashboard)"""
    headers = {
        'Authorization': f'Bearer {jwt_token}',
        'Content-Type': 'application/json'
    }
    
    response = requests.post(
        f'{BASE_URL}/posts/{post_id}/publish',
        headers=headers
    )
    
    result = response.json()
    print(f"Published: {result['data']['slug']}")
    return result['data']

# Usage
if __name__ == '__main__':
    # List published posts (API key workspace'e bağlı, workspace slug gerekmez)
    result = list_posts(status='published', limit=10)
    
    # Get single post by ID
    if result['data']:
        post = get_post_by_id(result['data'][0]['id'])
        print(f"Post content: {post['content_markdown'][:200]}...")
    
    # Get single post by slug
    post_by_slug = get_post_by_slug('my-post-slug')
    print(f"Post by slug: {post_by_slug['title']}")`;

const curlAllExample = `# cURL Examples - Complete API Reference

# Base URL: https://api.blogenerate.com

# ============================================
# 1. BLOG LISTING & RETRIEVAL
# ============================================

# List posts (cursor-based pagination, recommended)
curl -X GET "https://api.blogenerate.com/v1/api/blog?status=published&limit=50&cursor=NEXT_CURSOR" \\
  -H "Authorization: Bearer YOUR_API_KEY"

# Get post by ID (full content)
curl -X GET "https://api.blogenerate.com/v1/api/blog/POST_ID" \\
  -H "Authorization: Bearer YOUR_API_KEY"

# Get post by slug
curl -X GET "https://api.blogenerate.com/v1/api/blog/slug/BLOG_SLUG" \\
  -H "Authorization: Bearer YOUR_API_KEY"

# ============================================
# 2. POST MANAGEMENT
# ============================================

# Publish a draft post (requires JWT token from dashboard)
curl -X POST "https://api.blogenerate.com/posts/POST_ID/publish" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json"

`;

const nextjsIsrExample = `// Next.js ISR Integration Example
// app/blog/[slug]/page.tsx

// Sayfa/segment ISR: Bu route en fazla 60 saniyede bir yeniden oluşturulur (opsiyonel)
export const revalidate = 60;

const API_BASE = process.env.NEXT_PUBLIC_API_URL;
const API_KEY = process.env.BLOG_API_KEY; // API key from environment (workspace'e bağlı)

// Fetch post data (Server Component)
// Note: API key workspace'e bağlı olduğu için workspace slug gerekmez
async function getPost(slug: string) {
  const res = await fetch(API_BASE + '/v1/api/blog/slug/' + slug, {
    headers: {
      'Authorization': 'Bearer ' + API_KEY
    },
    next: { revalidate: 3600 } // Revalidate every hour
  });

  if (!res.ok) return null;
  const result = await res.json();
  return result.data;
}

// List all posts for static params (with cursor-based pagination)
async function getAllPosts() {
  const allPosts: any[] = [];
  let cursor: string | null = null;
  let hasMore = true;

  while (hasMore) {
    const params = new URLSearchParams({
      status: 'published',
      limit: '100' // Fetch 100 at a time
    });
    
    if (cursor) {
      params.append('cursor', cursor);
    }

    const url = API_BASE + '/v1/api/blog?' + params.toString();
    const res = await fetch(url, {
      headers: {
        'Authorization': 'Bearer ' + API_KEY
      },
      next: { revalidate: 3600 }
    });

    if (!res.ok) break;
    
    const result = await res.json();
    allPosts.push(...result.data);
    
    // Check if there are more posts
    hasMore = result.meta?.has_more || false;
    cursor = result.meta?.next_cursor || null;
  }

  return allPosts;
}

// Generate static params for ISR
export async function generateStaticParams() {
  const posts = await getAllPosts();
  
  return posts.map((post: any) => ({
    slug: post.slug
  }));
}

// Page component
export default async function BlogPost({
  params
}: {
  params: { slug: string }
}) {
  const post = await getPost(params.slug);

  if (!post) {
    // Handle not found case
    return null;
  }

  return (
    <article>
      <h1>{post.title}</h1>
      {post.cover_image_url && (
        <img src={post.cover_image_url} alt={post.title} />
      )}
      {/* Mutlaka content_html kullanın; content kullanmayın (ham metin/JSON görünür) */}
      <div dangerouslySetInnerHTML={{ __html: post.content_html ?? '' }} />
      
      {/* SEO Schema */}
      {post.schema_jsonld && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(post.schema_jsonld)
          }}
        />
      )}
    </article>
  );
}

// Generate metadata for SEO
export async function generateMetadata({
  params
}: {
  params: { slug: string }
}) {
  const post = await getPost(params.slug);

  if (!post) return {};

  return {
    title: post.seo?.metaTitle || post.title,
    description: post.seo?.metaDescription || post.excerpt,
    openGraph: {
      title: post.seo?.ogTitle || post.title,
      description: post.seo?.ogDescription || post.excerpt,
      images: [post.cover_image_url]
    }
  };
}`;

export default function ApiDocsPage() {
  const [copied, setCopied] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['basics']));
  const [selectedExample, setSelectedExample] = useState<'list' | 'hmac' | 'python' | 'curl' | 'nextjs'>('list');
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('');
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [showCreateKeyModal, setShowCreateKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [isCreatingKey, setIsCreatingKey] = useState(false);
  const [createdKey, setCreatedKey] = useState<any | null>(null);
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);
  const [autoCloseTimer, setAutoCloseTimer] = useState<NodeJS.Timeout | null>(null);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  const loadWorkspaces = useCallback(async () => {
    try {
      const data = await getWorkspaces();
      setWorkspaces(data);
      if (data.length > 0 && !selectedWorkspace) {
        setSelectedWorkspace(data[0].id);
      }
    } catch (error) {
      console.error('Workspace yüklenemedi:', error);
    }
  }, [selectedWorkspace]);

  useEffect(() => {
    setMounted(true);
    loadWorkspaces();
  }, [loadWorkspaces]);

  useEffect(() => {
    if (selectedWorkspace) {
      loadApiKeys(selectedWorkspace);
    }
  }, [selectedWorkspace]);

  // Auto-close modal after 5 minutes when key is created
  useEffect(() => {
    if (createdKey && createdKey.apiKey) {
      const timer = setTimeout(() => {
        setShowCreateKeyModal(false);
        setCreatedKey(null);
        setNewKeyName('');
      }, 5 * 60 * 1000); // 5 minutes

      setAutoCloseTimer(timer);

      return () => {
        if (timer) clearTimeout(timer);
      };
    }
  }, [createdKey]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autoCloseTimer) {
        clearTimeout(autoCloseTimer);
      }
    };
  }, [autoCloseTimer]);

  const loadApiKeys = async (workspaceId: string) => {
    try {
      setIsLoadingKeys(true);
      const keys = await listWorkspaceApiKeys(workspaceId);
      setApiKeys(keys);
    } catch (error) {
      console.error('API key\'ler yüklenemedi:', error);
    } finally {
      setIsLoadingKeys(false);
    }
  };

  const handleSaveKeyName = () => {
    // Save key name to localStorage for persistence
    if (newKeyName.trim()) {
      localStorage.setItem('apiKeyName', newKeyName);
    }
  };

  const handleCreateKey = async () => {
    if (!selectedWorkspace) {
      alert('Lütfen bir workspace seçin');
      return;
    }

    try {
      setIsCreatingKey(true);
      const data: CreateApiKeyRequest = {
        name: newKeyName || undefined,
      };
      const newKey = await createWorkspaceApiKey(selectedWorkspace, data);
      setCreatedKey(newKey);
      setNewKeyName('');
      localStorage.removeItem('apiKeyName');
      await loadApiKeys(selectedWorkspace);
    } catch (error) {
      alert('API key oluşturulamadı: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'));
    } finally {
      setIsCreatingKey(false);
    }
  };

  const handleCloseModal = () => {
    setShowCreateKeyModal(false);
    setCreatedKey(null);
    setNewKeyName('');
    if (autoCloseTimer) {
      clearTimeout(autoCloseTimer);
      setAutoCloseTimer(null);
    }
    localStorage.removeItem('apiKeyName');
  };

  const handleRevokeKey = async (keyId: string) => {
    if (!selectedWorkspace) return;
    if (!confirm('Bu API key\'i iptal etmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
      return;
    }

    try {
      await revokeWorkspaceApiKey(selectedWorkspace, keyId);
      await loadApiKeys(selectedWorkspace);
    } catch (error) {
      alert('API key iptal edilemedi: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'));
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const user = mounted ? auth.getUser() : null;

  const highlightCode = (code: string, lang: string): string => {
    // Escape HTML first
    let result = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    if (lang === 'python') {
      // Python highlighting
      // First, protect strings
      const stringPlaceholders: string[] = [];
      result = result.replace(/(['"`])((?:(?!\1)[^\\]|\\.)*?)\1/g, (match) => {
        const placeholder = `__STRING_${stringPlaceholders.length}__`;
        stringPlaceholders.push(match);
        return placeholder;
      });

      // Highlight comments
      result = result.replace(/#(.*)$/gm, '<span style="color: #6a9955">#$1</span>');

      // Highlight keywords
      const pyKeywords = ['def', 'async', 'await', 'import', 'from', 'if', 'elif', 'else', 'for', 'while', 'return', 'True', 'False', 'None', 'and', 'or', 'not', 'in', 'is', 'try', 'except', 'finally', 'with', 'as', 'class', 'pass', 'break', 'continue', 'yield', 'lambda', 'print', 'int', 'str', 'time', 'sleep'];
      pyKeywords.forEach(kw => {
        result = result.replace(new RegExp(`\\b${kw}\\b(?![^<]*>)`, 'g'), `<span style="color: #569cd6">${kw}</span>`);
      });

      // Highlight function definitions
      result = result.replace(/\bdef\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g, (match, funcName) => {
        return match.replace(funcName, `<span style="color: #dcdcaa">${funcName}</span>`);
      });

      // Highlight function calls
      result = result.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g, (match, funcName) => {
        if (!pyKeywords.includes(funcName) && !match.includes('<span')) {
          return `<span style="color: #dcdcaa">${funcName}</span>(`;
        }
        return match;
      });

      // Restore strings with highlighting
      stringPlaceholders.forEach((str, idx) => {
        result = result.replace(`__STRING_${idx}__`, `<span style="color: #ce9178">${str}</span>`);
      });

    } else if (lang === 'bash' || lang === 'curl') {
      // cURL/Bash highlighting
      // First, protect strings
      const stringPlaceholders: string[] = [];
      result = result.replace(/(['"])((?:(?!\1)[^\\]|\\.)*?)\1/g, (match) => {
        const placeholder = `__STRING_${stringPlaceholders.length}__`;
        stringPlaceholders.push(match);
        return placeholder;
      });

      // Highlight comments
      result = result.replace(/#(.*)$/gm, '<span style="color: #6a9955">#$1</span>');

      // Highlight curl command and HTTP methods
      result = result.replace(/\bcurl\b(?![^<]*>)/g, '<span style="color: #4ec9b0">curl</span>');
      result = result.replace(/\b-X\s+(GET|POST|PATCH|DELETE|PUT)\b(?![^<]*>)/g, (match, method) => {
        return `-X <span style="color: #4ec9b0">${method}</span>`;
      });
      result = result.replace(/\b-H\s+(['"]?)([^:]+):\s*([^'"]+)(\1)(?![^<]*>)/g, (match, quote, header, value, closeQuote) => {
        return `-H ${quote}<span style="color: #569cd6">${header}</span>: ${value}${closeQuote}`;
      });

      // Restore strings with highlighting
      stringPlaceholders.forEach((str, idx) => {
        result = result.replace(`__STRING_${idx}__`, `<span style="color: #ce9178">${str}</span>`);
      });

    } else if (lang === 'typescript' || lang === 'nextjs') {
      // TypeScript/Next.js highlighting
      // First, protect strings and template literals
      const stringPlaceholders: string[] = [];
      result = result.replace(/(['"`])((?:(?!\1)[^\\]|\\.)*?)\1/g, (match) => {
        const placeholder = `__STRING_${stringPlaceholders.length}__`;
        stringPlaceholders.push(match);
        return placeholder;
      });

      // Protect comments
      const commentPlaceholders: string[] = [];
      result = result.replace(/\/\/(.*)$/gm, (match) => {
        const placeholder = `__COMMENT_SLASH_${commentPlaceholders.length}__`;
        commentPlaceholders.push(match);
        return placeholder;
      });
      result = result.replace(/\/\*([\s\S]*?)\*\//g, (match) => {
        const placeholder = `__COMMENT_BLOCK_${commentPlaceholders.length}__`;
        commentPlaceholders.push(match);
        return placeholder;
      });

      // Highlight keywords
      const tsKeywords = ['const', 'let', 'var', 'function', 'async', 'await', 'export', 'import', 'from', 'if', 'else', 'for', 'while', 'return', 'class', 'interface', 'type', 'extends', 'implements', 'public', 'private', 'protected', 'static', 'readonly', 'true', 'false', 'null', 'undefined', 'this', 'new', 'typeof', 'keyof', 'any', 'string', 'number', 'boolean', 'void', 'never'];
      tsKeywords.forEach(kw => {
        result = result.replace(new RegExp(`\\b${kw}\\b(?![^<]*>)`, 'g'), `<span style="color: #c586c0">${kw}</span>`);
      });

      // Highlight types
      result = result.replace(/:\s*([a-zA-Z_][a-zA-Z0-9_<>\[\]|& ]+?)(?=[,;\)\{=\s])/g, (match) => {
        if (!match.includes('<span')) {
          return match.replace(/(:\s*)(.+)/, '$1<span style="color: #4ec9b0">$2</span>');
        }
        return match;
      });

      // Highlight JSX tags
      result = result.replace(/&lt;(\/?)([a-zA-Z][a-zA-Z0-9]*)/g, '&lt;$1<span style="color: #d7ba7d">$2</span>');

      // Restore comments
      commentPlaceholders.forEach((comment, idx) => {
        if (comment.startsWith('//')) {
          result = result.replace(`__COMMENT_SLASH_${idx}__`, `<span style="color: #6a9955">${comment}</span>`);
        } else {
          result = result.replace(`__COMMENT_BLOCK_${idx}__`, `<span style="color: #6a9955">${comment}</span>`);
        }
      });

      // Highlight function calls
      result = result.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\()/g, (match, func) => {
        if (!tsKeywords.includes(func) && !match.includes('<span')) {
          return `<span style="color: #dcdcaa">${func}</span> `;
        }
        return match;
      });

      // Restore strings with highlighting
      stringPlaceholders.forEach((str, idx) => {
        result = result.replace(`__STRING_${idx}__`, `<span style="color: #ce9178">${str}</span>`);
      });

    } else {
      // JavaScript highlighting
      // First, protect strings and template literals
      const stringPlaceholders: string[] = [];
      result = result.replace(/(['"`])((?:(?!\1)[^\\]|\\.)*?)\1/g, (match) => {
        const placeholder = `__STRING_${stringPlaceholders.length}__`;
        stringPlaceholders.push(match);
        return placeholder;
      });

      // Protect comments
      const commentPlaceholders: string[] = [];
      result = result.replace(/\/\/(.*)$/gm, (match) => {
        const placeholder = `__COMMENT_${commentPlaceholders.length}__`;
        commentPlaceholders.push(match);
        return placeholder;
      });

      // Highlight keywords
      const jsKeywords = ['const', 'let', 'var', 'function', 'async', 'await', 'export', 'import', 'from', 'if', 'else', 'for', 'while', 'return', 'class', 'extends', 'true', 'false', 'null', 'undefined', 'this', 'new', 'typeof'];
      jsKeywords.forEach(kw => {
        result = result.replace(new RegExp(`\\b${kw}\\b(?![^<]*>)`, 'g'), `<span style="color: #569cd6">${kw}</span>`);
      });

      // Highlight built-ins
      result = result.replace(/\b(console|JSON|Date|Math|Object|Array|String|Number|Boolean|fetch|process|env|now|stringify|log)\b(?![^<]*>)/g, '<span style="color: #4ec9b0">$1</span>');

      // Highlight numbers
      result = result.replace(/\b(\d+)\b(?![^<]*>)/g, '<span style="color: #b5cea8">$1</span>');

      // Restore comments
      commentPlaceholders.forEach((comment, idx) => {
        result = result.replace(`__COMMENT_${idx}__`, `<span style="color: #6a9955">${comment}</span>`);
      });

      // Highlight function calls
      result = result.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\()/g, (match, func) => {
        if (!jsKeywords.includes(func) && !match.includes('<span') && !['console', 'JSON', 'Date', 'Math', 'Object', 'Array', 'String', 'Number', 'Boolean', 'fetch', 'process', 'env', 'now', 'stringify', 'log'].includes(func)) {
          return `<span style="color: #dcdcaa">${func}</span> `;
        }
        return match;
      });

      // Restore strings with highlighting
      stringPlaceholders.forEach((str, idx) => {
        result = result.replace(`__STRING_${idx}__`, `<span style="color: #ce9178">${str}</span>`);
      });
    }

    return result;
  };

  const getExampleCode = () => {
    switch (selectedExample) {
      case 'list': return listPostsExample;
      case 'hmac': return hmacAuthExample;
      case 'python': return pythonExample;
      case 'curl': return curlAllExample;
      case 'nextjs': return nextjsIsrExample;
      default: return listPostsExample;
    }
  };


  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="space-y-5 max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="bg-white rounded-xl p-4 md:p-6 border border-[var(--border)]">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

    return (
    <div className="space-y-5 max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
      {/* Professional Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-br from-[#203eec] via-[#1a32cc] to-[#1D4ED8] rounded-xl p-4 md:p-6 lg:p-8 border border-blue-300 shadow-lg"
      >
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="p-2 md:p-3 bg-white/20 rounded-lg backdrop-blur-sm flex-shrink-0">
              <BookOpen className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </div>
            <div>
              <h1
                className="text-2xl md:text-3xl font-bold text-white mb-2"
                style={{
                  fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
                }}
              >
                API Dokümantasyonu
              </h1>
              <div className="flex flex-wrap items-center gap-2 md:gap-3">
                <span className="px-2 md:px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium text-white">
                  v1.0.0
                </span>
                <span className="px-2 md:px-3 py-1 bg-green-500/20 backdrop-blur-sm rounded-full text-xs font-medium text-green-100">
                  Üretime Hazır
                </span>
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('/API_DOCUMENTATION.md', '_blank')}
            className="bg-white/10 hover:bg-white/20 border-white/30 text-white backdrop-blur-sm w-full md:w-auto"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Tam Dokümantasyon</span>
            <span className="sm:hidden">Dokümantasyon</span>
          </Button>
        </div>
        <p
          className="text-sm md:text-base text-blue-50 leading-relaxed max-w-3xl"
          style={{
            fontFamily: 'var(--font-sans), "Inter", sans-serif',
          }}
        >
          Yayınlanmış blog yazılarınızı çekmek ve yönetmek için RESTful API. Blog içeriklerinizi uygulamalarınıza, sitelerinize ve otomasyon sistemlerinize kolayca entegre edin.
        </p>
        <div className="mt-4 md:mt-6 flex flex-wrap gap-2 md:gap-4">
          <div className="flex items-center gap-2 text-sm text-blue-100">
            <Check className="w-4 h-4" />
            <span>RESTful API</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-blue-100">
            <Check className="w-4 h-4" />
            <span>JSON Yanıtlar</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-blue-100">
            <Check className="w-4 h-4" />
            <span>Bearer Token Kimlik Doğrulama</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-blue-100">
            <Check className="w-4 h-4" />
            <span>Blog Yönetimi</span>
          </div>
        </div>
      </motion.div>

      {/* Quick Start Guide */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-white rounded-xl p-4 md:p-6 border border-[var(--border)] shadow-sm"
      >
        <div className="flex items-center gap-2 md:gap-3 mb-4">
          <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
            <Play className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
          </div>
          <h2
            className="text-lg md:text-xl font-semibold text-foreground"
            style={{
              fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
            }}
          >
            Hızlı Başlangıç Rehberi
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-[var(--secondary)] rounded-lg border border-[var(--border)]">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-[#203eec] text-white text-xs font-bold flex items-center justify-center">1</span>
              <span className="text-sm font-medium text-foreground">API Key Alın</span>
            </div>
            <p className="text-xs text-muted-foreground">Aşağıdaki workspace&apos;inizden bir API key oluşturun</p>
          </div>
          <div className="p-4 bg-[var(--secondary)] rounded-lg border border-[var(--border)]">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-[#203eec] text-white text-xs font-bold flex items-center justify-center">2</span>
              <span className="text-sm font-medium text-foreground">İstek Gönderin</span>
            </div>
            <p className="text-xs text-muted-foreground">Kod örneklerini kullanarak ilk API çağrınızı yapın</p>
          </div>
          <div className="p-4 bg-[var(--secondary)] rounded-lg border border-[var(--border)]">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-[#203eec] text-white text-xs font-bold flex items-center justify-center">3</span>
              <span className="text-sm font-medium text-foreground">Yanıtı İşleyin</span>
            </div>
            <p className="text-xs text-muted-foreground">Oluşturulan blog içeriğini ve SEO verilerini işleyin</p>
          </div>
        </div>
      </motion.div>

      {/* API Key Management Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="bg-white rounded-xl p-4 md:p-6 border border-[var(--border)] shadow-sm"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0 mb-4 md:mb-6">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
          <Key className="w-4 h-4 md:w-5 md:h-5 text-[#203eec]" />
            </div>
            <div>
          <h2
                className="text-lg md:text-xl font-semibold text-foreground"
            style={{
              fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
            }}
          >
                API Key Management
          </h2>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">
                Programatik erişim için API key&apos;leri oluşturun ve yönetin
              </p>
        </div>
          </div>
        </div>
        
        {/* How to Get API Key Guide - Simplified */}
        <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 mb-3">
            <Check className="w-5 h-5 text-green-600" />
            <h3
              className="text-base font-semibold text-foreground"
              style={{
                fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
              }}
            >
              Sadece 2 Adımda Başlayın
            </h3>
          </div>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-base font-bold">
              1
            </div>
            <div>
                <p className="text-sm font-semibold text-foreground mb-1">Workspace Seçin</p>
                <p className="text-sm text-muted-foreground">Aşağıdan workspace&apos;inizi seçin.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-base font-bold">
              2
            </div>
            <div>
                <p className="text-sm font-semibold text-foreground mb-1">API Key Alın ve Kullanın</p>
                <p className="text-sm text-muted-foreground">&quot;Generate API Key&quot; butonuna tıklayın, key&apos;i kopyalayın ve kod örneklerindeki <code className="bg-white px-1 rounded text-xs">YOUR_API_KEY</code> yerine yapıştırın. Hepsi bu kadar! 🎉</p>
            </div>
          </div>
        </div>
        </div>

        {/* Workspace Selection & Key Management UI */}
        <div className="mt-6">
          {/* Workspace Selection */}
          {workspaces.length > 0 ? (
            <>
            <div className="mb-4">
            <label className="text-sm font-medium text-foreground mb-2 block">
              Workspace Seçin:
            </label>
            <select
              value={selectedWorkspace}
              onChange={(e) => setSelectedWorkspace(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#203eec]"
            >
              {workspaces.map((ws) => (
                <option key={ws.id} value={ws.id}>{ws.name}</option>
              ))}
            </select>
          </div>

              {/* Workspace Info - Simplified */}
              {selectedWorkspace && (
                <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-[#203eec]" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {workspaces.find(w => w.id === selectedWorkspace)?.name || 'Workspace'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        API key oluşturduğunuzda tüm ayarlar otomatik yapılacak
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
        ) : (
          <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900 mb-2">
                  API Key oluşturmak için önce bir workspace&apos;e ihtiyacınız var
                </p>
                <p className="text-xs text-blue-800 mb-3">
                  Workspace, bloglarınızı organize etmek ve API key&apos;lerinizi yönetmek için kullanılır.
                </p>
                <Button
                  onClick={() => router.push('/dashboard/workspaces')}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm"
                  size="sm"
                >
                  Workspace Oluştur →
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Generate API Key Button */}
        {selectedWorkspace && (
          <Button
            onClick={() => {
              const savedName = localStorage.getItem('apiKeyName');
              if (savedName) {
                setNewKeyName(savedName);
              }
              setShowCreateKeyModal(true);
            }}
            className="w-full mb-4 bg-[#203eec] hover:bg-[#1a32cc] text-white"
          >
            Generate API Key
          </Button>
        )}

        {/* Create Key Modal */}
        {showCreateKeyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl p-4 md:p-6 max-w-md w-full shadow-2xl border border-[var(--border)] max-h-[90vh] overflow-y-auto">
              {!createdKey || !createdKey.apiKey ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3
                      className="text-xl font-semibold text-foreground"
                      style={{
                        fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
                      }}
                    >
                      Generate API Key
                    </h3>
                    <button
                      onClick={handleCloseModal}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Key Name (Optional):
                      </label>
                      <Input
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        placeholder="Örn: Production API Key"
                        className="w-full"
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSaveKeyName}
                        variant="outline"
                        className="flex-1 border-[var(--border)] hover:border-[#203eec] hover:text-[#203eec]"
                      >
                        Kaydet
                      </Button>
                      <Button
                        onClick={handleCreateKey}
                        disabled={isCreatingKey}
                        className="flex-1 bg-[#203eec] hover:bg-[#1a32cc] text-white"
                      >
                        {isCreatingKey ? 'Oluşturuluyor...' : 'Oluştur'}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <Check className="w-5 h-5 text-green-600" />
                    <h3 className="text-xl font-semibold text-green-900">
                      API Key Created Successfully!
                    </h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-green-800 mb-1 block">API Key:</label>
        <div className="flex items-center gap-2">
                        <code className="flex-1 px-3 py-2 bg-[var(--secondary)] border border-green-200 rounded text-sm font-mono text-foreground break-all">
                          {createdKey.apiKey}
          </code>
          <Button
            variant="outline"
            size="sm"
                          onClick={() => handleCopy(createdKey.apiKey!, 'new-key')}
                          className="border-green-300 hover:border-green-500"
          >
                          {copied === 'new-key' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
                    </div>
                    
                    {createdKey.clientId && (
                      <div>
                        <label className="text-xs font-medium text-green-800 mb-1 block">Client ID:</label>
                        <code className="block px-3 py-2 bg-[var(--secondary)] border border-green-200 rounded text-sm font-mono text-foreground">
                          {createdKey.clientId}
                        </code>
                      </div>
                    )}
                    
                    {createdKey.clientSecret && (
                      <div>
                        <label className="text-xs font-medium text-green-800 mb-1 block">Client Secret:</label>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 px-3 py-2 bg-[var(--secondary)] border border-green-200 rounded text-sm font-mono text-foreground break-all">
                            {createdKey.clientSecret}
                          </code>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopy(createdKey.clientSecret!, 'new-secret')}
                            className="border-green-300 hover:border-green-500"
                          >
                            {copied === 'new-secret' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    <div className="p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
                      <p className="text-xs text-yellow-800">
                        ⚠️ <strong>Önemli:</strong> Bu API key sadece bir kez gösterilir. Lütfen güvenli bir yerde saklayın! Bu modal 5 dakika sonra otomatik olarak kapanacaktır.
                      </p>
                    </div>
                    
                    <Button
                      onClick={handleCloseModal}
                      className="w-full bg-[#203eec] hover:bg-[#1a32cc] text-white"
                    >
                      Kapat
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* API Keys List */}
        {selectedWorkspace && (
          <div className="mt-6">
            {isLoadingKeys ? (
              <div className="text-center py-4 text-muted-foreground">Yükleniyor...</div>
            ) : apiKeys.length > 0 ? (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-foreground mb-2">Mevcut API Key&apos;ler:</h3>
                {apiKeys.map((key) => (
                  <div
                    key={key.id}
                    className="flex items-center justify-between p-3 bg-[var(--secondary)] rounded-lg border border-[var(--border)]"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-foreground">{key.name || 'İsimsiz Key'}</span>
                        {key.active ? (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">Aktif</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">İptal Edilmiş</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div>Client ID: <code className="bg-white px-1 rounded">{key.clientId}</code></div>
                        <div>Key: <code className="bg-white px-1 rounded">{key.keyPreview || 'bg_...****'}</code></div>
                        {key.lastUsedAt && (
                          <div>Son Kullanım: {new Date(key.lastUsedAt).toLocaleDateString('tr-TR')}</div>
                        )}
                        {key.expiresAt && (
                          <div>Son Kullanma: {new Date(key.expiresAt).toLocaleDateString('tr-TR')}</div>
                        )}
                      </div>
                    </div>
                    {key.active && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRevokeKey(key.id)}
                        className="border-red-300 text-red-600 hover:bg-red-50"
                      >
                        İptal Et
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground text-sm">
                Henüz API key&apos;iniz yok. Yukarıdan yeni bir key oluşturun.
              </div>
            )}
          </div>
        )}
        </div>
      </motion.div>

      {/* Base URL */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-white rounded-xl p-5 border border-[var(--border)]"
      >
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-5 h-5 text-[#203eec]" />
          <h2
            className="text-lg font-medium text-foreground"
            style={{
              fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
            }}
          >
            Base URL
          </h2>
        </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-4 py-2 bg-[var(--secondary)] rounded-lg text-sm font-mono text-foreground">
              {API_BASE_URL}
        </code>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopy(API_BASE_URL, 'baseurl')}
              className="border-[var(--border)] hover:border-[#203eec] hover:text-[#203eec]"
            >
              {copied === 'baseurl' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          <p
            className="text-xs text-muted-foreground mt-2"
          style={{
            fontFamily: 'var(--font-sans), "Inter", sans-serif',
          }}
        >
            Production: <code className="bg-white px-1 rounded">https://api.blogenerate.com</code> | Development: <code className="bg-white px-1 rounded">http://localhost:3001</code><br />
            Tüm API istekleri bu Base URL&apos;yi kullanır
        </p>
      </motion.div>

      {/* Content Format Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.12 }}
        className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200"
      >
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3
              className="text-base font-semibold text-foreground mb-2"
              style={{
                fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
              }}
            >
              İçerik Formatı (Content Format)
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Tüm blog içerikleri veritabanında <strong className="text-foreground">JSON formatında</strong> saklanır. API&apos;den çekerken <code className="bg-white px-1.5 py-0.5 rounded text-xs font-mono">format</code> query parametresi ile istediğiniz formata dönüştürülmüş içeriği alabilirsiniz.
            </p>
            <div className="space-y-2 mt-3">
              <div className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <code className="bg-white px-1.5 py-0.5 rounded text-xs font-mono">format=json</code> <span className="text-muted-foreground">(default) - JSON formatında döner</span>
                  <pre className="text-xs mt-1 p-2 bg-white rounded border border-blue-100 overflow-x-auto">
                    <code>{'{\n  "content": "# Blog Başlığı\\n\\nİçerik...",\n  "metadata": {}\n}'}</code>
                  </pre>
                </div>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <code className="bg-white px-1.5 py-0.5 rounded text-xs font-mono">format=markdown</code> veya <code className="bg-white px-1.5 py-0.5 rounded text-xs font-mono">format=md</code> <span className="text-muted-foreground">- Markdown formatında döner</span>
                  <pre className="text-xs mt-1 p-2 bg-white rounded border border-blue-100 overflow-x-auto">
                    <code># Blog Başlığı\n\nİçerik...</code>
                  </pre>
                </div>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <code className="bg-white px-1.5 py-0.5 rounded text-xs font-mono">format=html</code> <span className="text-muted-foreground">- HTML formatında döner</span>
                  <pre className="text-xs mt-1 p-2 bg-white rounded border border-blue-100 overflow-x-auto">
                    <code>{'<h1>Blog Başlığı</h1>\n<p>İçerik...</p>'}</code>
                  </pre>
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200">
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">Örnek:</strong> <code className="bg-blue-50 px-1.5 py-0.5 rounded text-xs font-mono">GET /v1/api/blog/:id?format=html</code>
              </p>
            </div>
            <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-xs text-amber-900">
                <strong className="text-foreground">Sitede blog görünümü:</strong> Yanıtta her zaman <code className="bg-white px-1 rounded">content_html</code> alanı gelir. Sitede makaleyi göstermek için <code className="bg-white px-1 rounded">content</code> yerine <strong>content_html</strong> kullanın ve HTML olarak render edin (örn. <code className="bg-white px-1 rounded">dangerouslySetInnerHTML</code>). Böylece JSON metni görünmez.
              </p>
            </div>
            <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-xs font-semibold text-red-900 mb-2">⚠️ İçerik ham HTML/markdown olarak görünüyorsa (etiketler yazı gibi)</p>
              <p className="text-xs text-red-800 mb-2">
                Bu durumda <strong>content</strong> veya <strong>content_markdown</strong> metin olarak gösteriliyordur. <strong>content</strong> asla ekranda metin olarak kullanılmamalı.
              </p>
              <p className="text-xs text-red-800 mb-1"><strong>Yanlış:</strong> <code className="bg-white px-1 rounded">{'{post.content}'}</code> veya <code className="bg-white px-1 rounded">{'<p>{post.content}</p>'}</code></p>
              <p className="text-xs text-red-800 mb-1"><strong>Doğru:</strong> <code className="bg-white px-1 rounded">{'<div dangerouslySetInnerHTML={{ __html: post.content_html ?? "" }} />'}</code></p>
              <p className="text-xs text-red-800 mt-2">
                React: <code className="bg-white px-1 rounded">dangerouslySetInnerHTML</code>, Vue: <code className="bg-white px-1 rounded">v-html</code>, vanilla JS: <code className="bg-white px-1 rounded">element.innerHTML = post.content_html</code>
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Authentication */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-white rounded-xl p-4 md:p-6 border border-[var(--border)] shadow-sm"
      >
        <button
          onClick={() => toggleSection('auth')}
          className="w-full flex items-center justify-between gap-3 mb-4"
        >
          <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
            <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
              <Key className="w-4 h-4 md:w-5 md:h-5 text-[#203eec]" />
            </div>
            <div className="text-left flex-1 min-w-0">
              <h2
                className="text-lg md:text-xl font-semibold text-foreground"
          style={{
            fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
          }}
        >
                Authentication
        </h2>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">
                API isteklerinizi nasıl doğrulayacağınızı öğrenin
              </p>
            </div>
          </div>
          {expandedSections.has('auth') ? (
            <ChevronUp className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground flex-shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground flex-shrink-0" />
          )}
        </button>
        {expandedSections.has('auth') && (
          <div className="mt-4 space-y-4">
            {/* Simple Explanation */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Check className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-base font-semibold text-green-900 mb-2">Çok Basit! Sadece API Key Kullanın 🎯</p>
                  <p className="text-sm text-green-800 mb-3">
                    API key&apos;inizi oluşturduktan sonra, tüm isteklerinizde sadece <code className="bg-white px-2 py-1 rounded">Authorization</code> header&apos;ına ekleyin:
                  </p>
                  <div className="relative">
          <code className="block px-4 py-3 bg-[#1e1e1e] rounded-lg text-sm font-mono text-green-400 overflow-x-auto">
            Authorization: Bearer YOUR_API_KEY
          </code>
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2"
                onClick={() => handleCopy('Authorization: Bearer YOUR_API_KEY', 'auth-header')}
          >
                {copied === 'auth-header' ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-white" />}
          </Button>
        </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-red-900 mb-1">⚠️ ÖNEMLİ: API Key&apos;i Frontend&apos;de Kullanmayın</p>
                        <p className="text-xs text-red-800">
                          API key&apos;inizi asla client-side kodda (JavaScript, React, Vue vb.) kullanmayın. API key&apos;leriniz tarayıcıda görünür hale gelir ve güvenlik riski oluşturur. API key&apos;lerinizi sadece:
                        </p>
                        <ul className="text-xs text-red-800 mt-2 space-y-1 list-disc list-inside">
                          <li>Backend servislerinizde (Node.js, Python, PHP vb.)</li>
                          <li>Server-side kodlarda (Next.js API routes, server components)</li>
                          <li>Environment variable&apos;larda saklayın</li>
                        </ul>
                        <p className="text-xs text-red-800 mt-2">
                          <strong>Public embed senaryosu için:</strong> HMAC authentication kullanın (aşağıda detaylar var).
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-green-700 mt-3">
                    💡 Tek bir API key ile blog oluşturma, okuma, güncelleme ve silme işlemlerinin hepsini yapabilirsiniz!
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    <strong>Client ID / Client Secret zorunlu değil.</strong> Sadece API key yeterli. Client ID + Secret (HMAC) sadece read-only veya frontend&apos;de API key göstermemek istediğiniz senaryolarda opsiyonel olarak kullanılır.
                  </p>
                </div>
              </div>
            </div>


            {/* Advanced - Collapsed by default */}
            <details className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 select-none hover:text-gray-900">
                🔧 Advanced: HMAC Authentication (Public Embed için Önerilir)
              </summary>
              <div className="mt-3 space-y-3">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs font-medium text-blue-900 mb-1">📌 Public Embed için HMAC Önerilir</p>
                  <p className="text-xs text-blue-800">
                    Eğer blog içeriklerinizi frontend&apos;de (JavaScript, React, Vue vb.) göstermek istiyorsanız, API key yerine HMAC authentication kullanın. HMAC authentication sadece okuma (GET) yetkisi verir ve client-side kodda güvenle kullanılabilir.
                  </p>
                </div>
                <p className="text-xs text-gray-600">
                  HMAC authentication sadece okuma (GET) yetkisi verir. ISR veya cron job&apos;lar için de API key yerine kullanılabilir.
                </p>
                <div className="bg-white border border-gray-200 rounded p-3">
                  <p className="text-xs font-medium text-gray-700 mb-2">Headers:</p>
                  <div className="space-y-1">
                    <code className="block px-2 py-1 bg-gray-100 rounded text-xs">X-Client-Id: bg_client_xxxxx</code>
                    <code className="block px-2 py-1 bg-gray-100 rounded text-xs">X-Signature: hmac_signature</code>
                    <code className="block px-2 py-1 bg-gray-100 rounded text-xs">X-Timestamp: 1641024000000</code>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  ℹ️ Çoğu kullanım için normal API key yeterlidir. HMAC&apos;ı sadece read-only erişim gerekiyorsa kullanın.
                </p>
              </div>
            </details>
          </div>
        )}
      </motion.div>

      {/* Blog Listing & Management API */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-white rounded-xl p-4 md:p-6 border border-[var(--border)] shadow-sm"
      >
        <button
          onClick={() => toggleSection('management')}
          className="w-full flex items-center justify-between gap-3 mb-4"
        >
          <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
            <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
              <BookOpen className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
            </div>
            <div className="text-left flex-1 min-w-0">
              <h2
                className="text-lg md:text-xl font-semibold text-foreground"
                style={{
                  fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
                }}
              >
                Blog Listing & Management API
              </h2>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">
                Blog yazılarınızı listeleyin, görüntüleyin ve yönetin
              </p>
            </div>
          </div>
          {expandedSections.has('management') ? (
            <ChevronUp className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground flex-shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground flex-shrink-0" />
          )}
        </button>
        {expandedSections.has('management') && (
          <div className="mt-4 space-y-6">
            {/* List Blog Posts */}
            <div className="border-t border-[var(--border)] pt-4">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-medium rounded">GET</span>
                <code className="text-xs md:text-sm font-mono text-foreground break-all">/v1/api/blog</code>
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">✅ Önerilir</span>
                <span className="text-xs text-muted-foreground">veya</span>
                <code className="text-xs md:text-sm font-mono text-muted-foreground line-through">/api/blog</code>
                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">⚠️ Deprecated</span>
              </div>
              <p className="text-xs md:text-sm text-muted-foreground mb-3">
                API key&apos;inize bağlı workspace&apos;teki blog yazılarını listeler. Workspace slug gerekmez, API key zaten workspace&apos;e bağlıdır. <strong className="text-foreground">Her zaman <code className="bg-[var(--secondary)] px-1 rounded">/v1/api/blog</code> endpoint&apos;ini kullanın</strong> - cursor-based pagination ile çalışır.
              </p>

              <div className="bg-red-50 border border-red-200 rounded-lg p-2 md:p-3 mb-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-red-900 mb-1">⚠️ ÖNEMLİ: Her Zaman v1 Endpoint Kullanın</p>
                    <p className="text-xs text-red-800">
                      Eski <code className="bg-white px-1 rounded">/api/blog</code> endpoint&apos;i offset-based pagination kullanır ve deprecated&apos;tir. Response&apos;da uyarı mesajı gösterir. <strong>Her zaman <code className="bg-white px-1 rounded">/v1/api/blog</code> endpoint&apos;ini kullanın</strong> - cursor-based pagination ile çalışır ve daha güvenilirdir.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-2 md:p-3 mb-3">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-green-800">
                    <strong>Workspace Slug Gerekmez:</strong> API key workspace&apos;e bağlı olduğu için workspace slug belirtmenize gerek yoktur. API key hangi workspace&apos;e aitse o workspace&apos;in blogları döner.
                    </p>
                  </div>
                </div>

              <div className="mb-3">
                <h4 className="text-sm font-medium text-foreground mb-2">Query Parametreleri:</h4>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div><code className="bg-[var(--secondary)] px-2 py-1 rounded">status</code> - Blog durumu (draft, generated, review, published)</div>
                  <div><code className="bg-[var(--secondary)] px-2 py-1 rounded">limit</code> - Sayfa başına kayıt sayısı (default: 50, max: 100)</div>
                  <div><code className="bg-green-100 px-2 py-1 rounded text-green-800 font-medium">cursor</code> - <strong>Cursor-based pagination için (v1 endpoint, önerilir)</strong> - Önceki response&apos;daki <code className="bg-white px-1 rounded">meta.next_cursor</code> değerini kullanın</div>
                  <div className="line-through text-muted-foreground"><code className="bg-[var(--secondary)] px-2 py-1 rounded">offset</code> - Offset-based pagination için (legacy endpoint, deprecated - kullanmayın)</div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-blue-900 mb-1">📄 Cursor-Based Pagination Nasıl Çalışır?</p>
                    <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
                      <li><strong>İlk istek:</strong> <code className="bg-white px-1 rounded">GET /v1/api/blog?status=published&limit=50</code> (cursor göndermeyin)</li>
                      <li><strong>Response kontrol:</strong> <code className="bg-white px-1 rounded">meta.has_more</code> değerini kontrol edin</li>
                      <li><strong>Sonraki sayfa:</strong> Eğer <code className="bg-white px-1 rounded">has_more: true</code> ise, <code className="bg-white px-1 rounded">meta.next_cursor</code> değerini bir sonraki istekte <code className="bg-white px-1 rounded">cursor</code> parametresi olarak gönderin</li>
                      <li><strong>Tekrar:</strong> <code className="bg-white px-1 rounded">has_more: false</code> olana kadar devam edin</li>
                    </ol>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-2 md:p-3 mb-3">
                <p className="text-xs font-medium text-green-900 mb-2">✅ Örnek Request (v1 - İlk Sayfa, Önerilir):</p>
                <code className="text-xs block break-words bg-white p-2 rounded border border-green-200">
                  GET {API_BASE_URL}/v1/api/blog?status=published&limit=50<br />
                  Authorization: Bearer YOUR_API_KEY
                </code>
                <p className="text-xs text-green-700 mt-2">
                  💡 İlk istekte <code className="bg-white px-1 rounded">cursor</code> parametresi göndermeyin
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-2 md:p-3 mb-3">
                <p className="text-xs font-medium text-green-900 mb-2">✅ Örnek Request (v1 - Sonraki Sayfa):</p>
                <code className="text-xs block break-words bg-white p-2 rounded border border-green-200">
                  GET {API_BASE_URL}/v1/api/blog?status=published&limit=50&cursor=eyJ0aW1lc3RhbXAiOiIyMDI0LTAxLTA3VDEwOjAwOjAwLjAwMFoiLCJpZCI6IjU1MGU4NDAwLWUyOWItNDFkNC1hNzE2LTQ0NjY1NTQ0MDAwMCJ9<br />
                  Authorization: Bearer YOUR_API_KEY
                </code>
                <p className="text-xs text-green-700 mt-2">
                  💡 <code className="bg-white px-1 rounded">cursor</code> değerini önceki response&apos;daki <code className="bg-white px-1 rounded">meta.next_cursor</code> alanından alın
                </p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-2 md:p-3 mb-3">
                <p className="text-xs font-medium text-red-900 mb-2">⚠️ Örnek Request (Legacy - Deprecated, Kullanmayın):</p>
                <code className="text-xs block break-words bg-white p-2 rounded border border-red-200 line-through text-muted-foreground">
                  GET {API_BASE_URL}/api/blog?status=published&limit=50&offset=0<br />
                  Authorization: Bearer YOUR_API_KEY
                </code>
                <p className="text-xs text-red-700 mt-2">
                  ⚠️ Bu endpoint deprecated&apos;tir ve response&apos;da uyarı mesajı gösterir. Kullanmayın!
                </p>
              </div>

              <div className="bg-[var(--secondary)] rounded-lg p-2 md:p-3">
                <p className="text-xs font-medium text-foreground mb-2">Response (v1 endpoint):</p>
                <pre className="text-xs overflow-x-auto">
                  <code className="break-words whitespace-pre-wrap">{JSON.stringify({
                    success: true,
                    data: [{
                      id: "550e8400-e29b-41d4-a716-446655440000",
                      title: "Getting Started with React Hooks",
                      slug: "getting-started-with-react-hooks",
                      excerpt: "Learn React Hooks with practical examples...",
                      status: "published",
                      language: "en",
                      cover_image_url: "https://images.unsplash.com/photo-...",
                      publishedAt: "2026-01-07T10:00:00Z",
                      createdAt: "2026-01-06T15:30:00Z",
                      updatedAt: "2026-01-07T10:00:00Z",
                      tags: [{ id: "tag-id-1", name: "React", slug: "react" }],
                      author: { id: "user-id", name: "John Doe", email: "john@example.com" }
                    }],
                    meta: {
                      next_cursor: "eyJ0aW1lc3RhbXAiOiIyMDI0LTAxLTA3VDEwOjAwOjAwLjAwMFoiLCJpZCI6IjU1MGU4NDAwLWUyOWItNDFkNC1hNzE2LTQ0NjY1NTQ0MDAwMCJ9",
                      has_more: true,
                      limit: 50
                    }
                  }, null, 2)}</code>
                </pre>
              </div>
            </div>

            {/* Get Blog Post by ID */}
            <div className="border-t border-[var(--border)] pt-4">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-medium rounded">GET</span>
                <code className="text-xs md:text-sm font-mono text-foreground break-all">/api/blog/:id</code>
                <span className="text-xs text-muted-foreground">veya</span>
                <code className="text-xs md:text-sm font-mono text-foreground break-all">/v1/api/blog/:id</code>
              </div>
              <p className="text-xs md:text-sm text-muted-foreground mb-3">
                ID ile tek bir blog yazısını getirir. Tam içerik, SEO, TOC, FAQ bilgileri dahildir. <code className="bg-[var(--secondary)] px-1 rounded">format</code> query parametresi ile <code className="bg-[var(--secondary)] px-1 rounded">content</code> alanının formatını (json | md | html) seçebilirsiniz. <strong>content_html</strong> her zaman döner (sitede render için kullanın). Workspace slug gerekmez, API key workspace&apos;e bağlıdır.
              </p>

              <div className="bg-[var(--secondary)] rounded-lg p-2 md:p-3 mb-3">
                <p className="text-xs font-medium text-foreground mb-2">Query: <code className="bg-white px-1 rounded">format</code> (opsiyonel) — json | md | html</p>
                <p className="text-xs font-medium text-foreground mb-2">Örnek Request:</p>
                <code className="text-xs block break-words">
                  GET {API_BASE_URL}/v1/api/blog/550e8400-e29b-41d4-a716-446655440000?format=html<br />
                  Authorization: Bearer YOUR_API_KEY
                </code>
              </div>

              <div className="bg-[var(--secondary)] rounded-lg p-2 md:p-3">
                <p className="text-xs font-medium text-foreground mb-2">Response:</p>
                <pre className="text-xs overflow-x-auto">
                  <code className="break-words whitespace-pre-wrap">{JSON.stringify({
                    success: true,
                    data: {
                      id: "550e8400-e29b-41d4-a716-446655440000",
                      title: "Getting Started with React Hooks",
                      slug: "getting-started-with-react-hooks",
                      excerpt: "Learn React Hooks with practical examples...",
                      status: "published",
                      content: "<h1>Getting Started with React Hooks</h1><p>...</p>",
                      contentFormat: "html",
                      content_markdown: "# Getting Started with React Hooks\n\n## Introduction\n\n...",
                      content_html: "<h1>Getting Started with React Hooks</h1><p>...</p>",
                      reading_time: 5,
                      language: "en",
                      cover_image_url: "https://images.unsplash.com/photo-...",
                      publishedAt: "2026-01-07T10:00:00Z",
                      createdAt: "2026-01-06T15:30:00Z",
                      updatedAt: "2026-01-07T10:00:00Z",
                      tags: [{ id: "tag-id-1", name: "React", slug: "react" }],
                      author: { id: "user-id", name: "John Doe", email: "john@example.com" },
                      toc: [{ id: "heading-0", title: "Getting Started with React Hooks", level: 1 }],
                      faq: [{ question: "What are React Hooks?", answer: "React Hooks are functions..." }],
                      seo: { metaTitle: "...", metaDescription: "...", robots: "index,follow" }
                    }
                  }, null, 2)}</code>
                </pre>
              </div>
            </div>

            {/* Get Blog Post by Slug */}
            <div className="border-t border-[var(--border)] pt-4">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-medium rounded">GET</span>
                <code className="text-xs md:text-sm font-mono text-foreground break-all">/api/blog/slug/:slug</code>
                <span className="text-xs text-muted-foreground">veya</span>
                <code className="text-xs md:text-sm font-mono text-foreground break-all">/v1/api/blog/slug/:slug</code>
              </div>
              <p className="text-xs md:text-sm text-muted-foreground mb-3">
                Slug ile tek bir blog yazısını getirir. <code className="bg-[var(--secondary)] px-1 rounded">format</code> query parametresi desteklenir. Get Blog Post by ID ile aynı response yapısına sahiptir (content, contentFormat, content_html dahil). Workspace slug gerekmez, API key workspace&apos;e bağlıdır.
              </p>

              <div className="bg-[var(--secondary)] rounded-lg p-2 md:p-3 mb-3">
                <p className="text-xs font-medium text-foreground mb-2">Örnek Request:</p>
                <code className="text-xs block break-words">
                  GET {API_BASE_URL}/v1/api/blog/slug/getting-started-with-react-hooks?format=html<br />
                  Authorization: Bearer YOUR_API_KEY
                </code>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-800">
                    Response yapısı <code className="bg-white px-1 rounded">Get Blog Post by ID</code> ile aynıdır.
                    </p>
                  </div>
                </div>
            </div>

            {/* Publish Blog Post */}
            <div className="border-t border-[var(--border)] pt-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2 py-0.5 bg-purple-500 text-white text-xs font-medium rounded">POST</span>
                <code className="text-xs md:text-sm font-mono text-foreground">/posts/:id/publish</code>
              </div>
              <p className="text-xs md:text-sm text-muted-foreground mb-3">
                Draft bir blog yazısını yayınlar ve herkese açık hale getirir. Sadece <code className="bg-[var(--secondary)] px-1 rounded">draft</code> veya <code className="bg-[var(--secondary)] px-1 rounded">generated</code> durumundaki postlar yayınlanabilir. Webhook event tetiklenir (post.published). Workspace slug gerekmez, JWT token workspace&apos;e bağlıdır.
              </p>

              <div className="mb-3">
                <h4 className="text-sm font-medium text-foreground mb-2">Authentication:</h4>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div><code className="bg-[var(--secondary)] px-2 py-1 rounded">Authorization</code> - Bearer token (JWT token - dashboard authentication)</div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 mt-2">
                    <p className="text-xs text-yellow-800">
                      <strong>Not:</strong> Bu endpoint JWT token gerektirir (dashboard authentication). API key ile çalışmaz.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-[var(--secondary)] rounded-lg p-2 md:p-3 mb-3">
                <p className="text-xs font-medium text-foreground mb-2">Örnek Request:</p>
                <code className="text-xs block break-words">
                  POST {API_BASE_URL}/posts/550e8400-e29b-41d4-a716-446655440000/publish<br />
                  Authorization: Bearer YOUR_JWT_TOKEN
                </code>
              </div>

              <div className="bg-[var(--secondary)] rounded-lg p-2 md:p-3">
                <p className="text-xs font-medium text-foreground mb-2">Response (200 OK):</p>
                <pre className="text-xs overflow-x-auto">
                  <code className="break-words whitespace-pre-wrap">{JSON.stringify({
                    success: true,
                    message: "Post published successfully",
                    data: {
                      id: "550e8400-e29b-41d4-a716-446655440000",
                      title: "Getting Started with React Hooks",
                      status: "published",
                      publishedAt: "2026-01-07T10:05:00Z"
                    }
                  }, null, 2)}</code>
                </pre>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 md:p-3 mt-3">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-blue-900 mb-1">Notlar:</p>
                    <ul className="text-xs text-blue-800 space-y-1">
                      <li>• Sadece <code className="bg-white px-1 rounded">draft</code> veya <code className="bg-white px-1 rounded">generated</code> durumundaki postlar yayınlanabilir</li>
                      <li>• Yayınlama işlemi webhook event <code className="bg-white px-1 rounded">post.published</code> tetikler (eğer yapılandırılmışsa)</li>
                      <li>• Yayınlanan postlar API endpoint&apos;lerinden hemen erişilebilir hale gelir</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-2 md:p-3 mt-3">
                <p className="text-xs font-medium text-red-900 mb-2">Hata Örnekleri:</p>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-red-800 mb-1">401 Unauthorized - API key eksik veya geçersiz:</p>
                    <pre className="text-xs overflow-x-auto bg-white p-2 rounded border border-red-200">
                      <code className="break-words whitespace-pre-wrap">{JSON.stringify({
                        statusCode: 401,
                        message: "Unauthorized",
                        error: "Invalid or missing API key"
                      }, null, 2)}</code>
                    </pre>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-red-800 mb-1">403 Forbidden - Post yayınlanamaz durumda:</p>
                    <pre className="text-xs overflow-x-auto bg-white p-2 rounded border border-red-200">
                      <code className="break-words whitespace-pre-wrap">{JSON.stringify({
                        success: false,
                        message: "Cannot publish post with status: draft",
                        error: "Post must be in draft or generated status to publish"
                      }, null, 2)}</code>
                    </pre>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-red-800 mb-1">429 Too Many Requests - Rate limit aşıldı:</p>
                    <pre className="text-xs overflow-x-auto bg-white p-2 rounded border border-red-200">
                      <code className="break-words whitespace-pre-wrap">{JSON.stringify({
                        statusCode: 429,
                        message: "Too Many Requests",
                        error: "Rate limit exceeded. Please try again later."
                      }, null, 2)}</code>
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* SEO Features */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="bg-white rounded-xl p-6 border border-[var(--border)] shadow-sm"
      >
        <button
          onClick={() => toggleSection('seo')}
          className="w-full flex items-center justify-between mb-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Search className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-left">
              <h2
                className="text-xl font-semibold text-foreground"
              style={{
                  fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
              }}
            >
                SEO Features
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Blog yazılarınızda mevcut SEO verileri ve özellikleri
            </p>
          </div>
            </div>
          {expandedSections.has('seo') ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </button>
        {expandedSections.has('seo') && (
          <div className="mt-4 space-y-4">
            <p
              className="text-sm text-muted-foreground mb-3"
              style={{
                fontFamily: 'var(--font-sans), "Inter", sans-serif',
              }}
            >
              Blog yazılarınızda SEO verileri mevcuttur. Blog detaylarını çekerken <code className="bg-[var(--secondary)] px-2 py-1 rounded">seo</code>, <code className="bg-[var(--secondary)] px-2 py-1 rounded">toc</code>, <code className="bg-[var(--secondary)] px-2 py-1 rounded">faq</code> ve <code className="bg-[var(--secondary)] px-2 py-1 rounded">schema_jsonld</code> alanları otomatik olarak döndürülür.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-blue-900 mb-1">📸 Otomatik Kapak Görseli</p>
                  <p className="text-xs text-blue-800">
                    SEO enabled ise, sistem otomatik olarak Unsplash&apos;ten uygun bir kapak görseli bulur ve <code className="bg-white px-1 rounded">coverImageUrl</code> olarak döndürür. Görsel kredisi bilgileri de dahildir.
            </p>
          </div>
        </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                'Meta Başlık & Açıklama',
                'Başlık Alternatifleri',
                'H1/H2 Yapısı Analizi',
                'FAQ Üretimi',
                'JSON-LD Schema',
                'İç Link Önerileri',
                'Slug & Canonical URL',
                'İçindekiler Tablosu',
                'Kapak Görseli (Unsplash)',
                'Görsel Metadata & Alt Text',
                'Okunabilirlik Skoru',
                'AI İzi Azaltma'
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-2 p-2 bg-[var(--secondary)] rounded-lg">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-foreground">{feature}</span>
          </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>


      {/* Rate Limits & Best Practices */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.68 }}
        className="bg-white rounded-xl p-4 md:p-6 border border-[var(--border)] shadow-sm"
      >
        <button
          onClick={() => toggleSection('ratelimits')}
          className="w-full flex items-center justify-between gap-3 mb-4"
        >
          <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
            <div className="p-2 bg-orange-100 rounded-lg flex-shrink-0">
              <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-orange-600" />
            </div>
            <div className="text-left flex-1 min-w-0">
              <h2
                className="text-lg md:text-xl font-semibold text-foreground"
                style={{
                  fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
                }}
              >
                Rate Limits & Best Practices
              </h2>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">
                API kullanım limitleri ve en iyi uygulamalar
              </p>
            </div>
          </div>
          {expandedSections.has('ratelimits') ? (
            <ChevronUp className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground flex-shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground flex-shrink-0" />
          )}
        </button>
        {expandedSections.has('ratelimits') && (
          <div className="mt-4 space-y-6">
            {/* Rate Limits */}
            <div className="border-t border-[var(--border)] pt-4">
              <h3 className="text-sm md:text-base font-semibold text-foreground mb-3">📊 Rate Limit Tablosu (Plan Bazlı)</h3>
              <div className="overflow-x-auto -mx-2 md:mx-0">
                <table className="w-full text-xs border-collapse min-w-[500px]">
                  <thead>
                    <tr className="bg-[var(--secondary)]">
                      <th className="border border-[var(--border)] px-2 md:px-3 py-2 text-left">Plan</th>
                      <th className="border border-[var(--border)] px-2 md:px-3 py-2 text-left">Requests/Minute</th>
                      <th className="border border-[var(--border)] px-2 md:px-3 py-2 text-left">Requests/Day</th>
                      <th className="border border-[var(--border)] px-2 md:px-3 py-2 text-left">Monthly Quota</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-[var(--border)] px-2 md:px-3 py-2 font-medium">Free</td>
                      <td className="border border-[var(--border)] px-2 md:px-3 py-2">10</td>
                      <td className="border border-[var(--border)] px-2 md:px-3 py-2">100</td>
                      <td className="border border-[var(--border)] px-2 md:px-3 py-2">1,000</td>
                    </tr>
                    <tr className="bg-[var(--secondary)]/50">
                      <td className="border border-[var(--border)] px-2 md:px-3 py-2 font-medium">Starter</td>
                      <td className="border border-[var(--border)] px-2 md:px-3 py-2">30</td>
                      <td className="border border-[var(--border)] px-2 md:px-3 py-2">1,000</td>
                      <td className="border border-[var(--border)] px-2 md:px-3 py-2">30,000</td>
                    </tr>
                    <tr>
                      <td className="border border-[var(--border)] px-2 md:px-3 py-2 font-medium">Pro</td>
                      <td className="border border-[var(--border)] px-2 md:px-3 py-2">100</td>
                      <td className="border border-[var(--border)] px-2 md:px-3 py-2">10,000</td>
                      <td className="border border-[var(--border)] px-2 md:px-3 py-2">300,000</td>
                    </tr>
                    <tr className="bg-[var(--secondary)]/50">
                      <td className="border border-[var(--border)] px-2 md:px-3 py-2 font-medium">Enterprise</td>
                      <td className="border border-[var(--border)] px-2 md:px-3 py-2">Custom</td>
                      <td className="border border-[var(--border)] px-2 md:px-3 py-2">Custom</td>
                      <td className="border border-[var(--border)] px-2 md:px-3 py-2">Custom</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 md:p-3 mt-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-yellow-900 mb-1">429 Too Many Requests</p>
                    <p className="text-xs text-yellow-800 mb-2">
                      Rate limit aşıldığında <code className="bg-white px-1 rounded">429</code> hatası döner. Response header&apos;larında rate limit bilgilerini kontrol edin:
                    </p>
                    <div className="bg-white border border-yellow-200 rounded p-2 mt-2">
                      <p className="text-xs font-medium text-yellow-900 mb-1">Rate Limit Header&apos;ları:</p>
                      <div className="space-y-1 text-xs text-yellow-800">
                        <div><code className="bg-yellow-50 px-1 rounded">X-RateLimit-Limit</code> - Toplam limit (örn: 100)</div>
                        <div><code className="bg-yellow-50 px-1 rounded">X-RateLimit-Remaining</code> - Kalan istek sayısı (örn: 45)</div>
                        <div><code className="bg-yellow-50 px-1 rounded">X-RateLimit-Reset</code> - Reset zamanı (Unix timestamp, örn: 1641024000)</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Best Practices */}
            <div className="border-t border-[var(--border)] pt-4">
              <h3 className="text-sm md:text-base font-semibold text-foreground mb-3">✨ Best Practices</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-2 p-2 md:p-3 bg-green-50 border border-green-200 rounded-lg">
                  <Check className="w-3 h-3 md:w-4 md:h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs md:text-sm font-medium text-green-900 mb-1">1. API Key Güvenliği</p>
                    <ul className="text-xs text-green-800 space-y-1">
                      <li>• Environment variable&apos;larda saklayın (<code className="bg-white px-1 rounded">.env</code>)</li>
                      <li>• Version control&apos;a commit etmeyin</li>
                      <li>• 90 günde bir rotate edin</li>
                      <li>• Dev/Staging/Prod için farklı key&apos;ler kullanın</li>
                    </ul>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-2 md:p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <Info className="w-3 h-3 md:w-4 md:h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs md:text-sm font-medium text-blue-900 mb-1">2. Pagination & Caching</p>
                    <ul className="text-xs text-blue-800 space-y-1">
                      <li>• <strong>v1 endpoint</strong> kullanın (cursor-based pagination)</li>
                      <li>• API response&apos;larını cache&apos;leyin</li>
                      <li>• Next.js ISR ile <code className="bg-white px-1 rounded">revalidate</code> kullanın</li>
                      <li>• CDN edge caching uygulayın</li>
                    </ul>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-2 md:p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <Code className="w-3 h-3 md:w-4 md:h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs md:text-sm font-medium text-purple-900 mb-1">3. Error Handling & Retry Logic</p>
                    <ul className="text-xs text-purple-800 space-y-1">
                      <li>• <code className="bg-white px-1 rounded">429</code> için exponential backoff kullanın</li>
                      <li>• <code className="bg-white px-1 rounded">500</code> hataları için max 3 retry</li>
                      <li>• Timeout değerlerini 10-30 saniye arası tutun</li>
                      <li>• Idempotency-Key ile duplicate request&apos;leri engelleyin</li>
                    </ul>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-2 md:p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <Terminal className="w-3 h-3 md:w-4 md:h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs md:text-sm font-medium text-orange-900 mb-1">4. Job Status Polling</p>
                    <ul className="text-xs text-orange-800 space-y-1">
                      <li>• İlk 30 saniye 2 saniyede bir poll edin</li>
                      <li>• Sonra 5 saniyede bir poll edin</li>
                      <li>• Max 5 dakika bekleyin, sonra timeout</li>
                      <li>• WebSocket yerine polling kullanın (daha basit)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Code Examples */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="bg-white rounded-xl p-4 md:p-6 border border-[var(--border)] shadow-sm"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 md:mb-6">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg flex-shrink-0">
              <Code className="w-4 h-4 md:w-5 md:h-5 text-indigo-600" />
            </div>
            <div>
              <h2
                className="text-lg md:text-xl font-semibold text-foreground"
              style={{
                fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
              }}
            >
                Code Examples
            </h2>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">
                Birden fazla dilde hazır kullanıma hazır kod parçacıkları
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleCopy(getExampleCode(), 'code')}
            className="border-[var(--border)] hover:border-[#203eec] hover:text-[#203eec] w-full sm:w-auto"
          >
            {copied === 'code' ? <Check className="w-4 h-4 mr-1.5" /> : <Copy className="w-4 h-4 mr-1.5" />}
            Copy Code
          </Button>
        </div>
        
        {/* Language Tabs */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-1 bg-[var(--secondary)] p-1 rounded-lg border border-[var(--border)]">
            {[
              { id: 'list', label: 'Blog Listing', shortLabel: 'Listing', lang: 'JS', color: 'bg-blue-500' },
              { id: 'hmac', label: 'HMAC Auth', shortLabel: 'HMAC', lang: 'JS', color: 'bg-blue-500' },
              { id: 'python', label: 'Python', shortLabel: 'Python', lang: 'PY', color: 'bg-yellow-500' },
              { id: 'curl', label: 'cURL', shortLabel: 'cURL', lang: 'SH', color: 'bg-green-500' },
              { id: 'nextjs', label: 'Next.js ISR', shortLabel: 'Next.js', lang: 'TS', color: 'bg-indigo-500' }
          ].map((lang) => (
            <button
              key={lang.id}
              onClick={() => setSelectedExample(lang.id as any)}
                className={'px-2 md:px-4 py-2 md:py-2.5 text-xs md:text-sm font-medium transition-all rounded-md flex items-center gap-1 md:gap-2 flex-1 sm:flex-none ' + 
                  (selectedExample === lang.id
                    ? 'bg-white text-foreground shadow-sm border border-[var(--border)]'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/50')
                }
              >
                <span className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${lang.color} ${selectedExample === lang.id ? 'opacity-100' : 'opacity-50'} flex-shrink-0`}></span>
                <span className="hidden sm:inline">{lang.label}</span>
                <span className="sm:hidden">{lang.shortLabel}</span>
                <span className="text-xs px-1 md:px-1.5 py-0.5 bg-[var(--border)] rounded text-muted-foreground flex-shrink-0">{lang.lang}</span>
            </button>
          ))}
          </div>
        </div>

        <div className="relative">
          <div className="bg-gradient-to-br from-[#1e1e1e] to-[#252525] rounded-lg border border-[#333] shadow-xl overflow-hidden">
            {/* Code Header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#2d2d2d] border-b border-[#333]">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
                  <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
                  <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
                </div>
                <span className="text-xs text-[#888] ml-2 font-medium">
                  {selectedExample === 'python' ? 'python' : selectedExample === 'curl' ? 'bash' : selectedExample === 'nextjs' ? 'typescript' : 'javascript'}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(getExampleCode(), 'code')}
                className="h-7 px-2 text-xs text-[#888] hover:text-white hover:bg-[#3a3a3a]"
              >
                {copied === 'code' ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                Copy
              </Button>
            </div>
            {/* Code Content */}
            <pre className="p-3 md:p-5 overflow-x-auto m-0">
              <code 
                className="text-xs md:text-sm font-mono leading-relaxed text-[#d4d4d4] whitespace-pre-wrap break-words"
                dangerouslySetInnerHTML={{
                  __html: highlightCode(
                    getExampleCode(), 
                    selectedExample === 'python' ? 'python' : 
                    selectedExample === 'curl' ? 'bash' : 
                    selectedExample === 'nextjs' ? 'typescript' : 
                    'javascript'
                  )
                }}
              />
          </pre>
          </div>
        </div>
      </motion.div>

      {/* Error Handling */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="bg-white rounded-xl p-4 md:p-6 border border-[var(--border)] shadow-sm"
      >
        <button
          onClick={() => toggleSection('errors')}
          className="w-full flex items-center justify-between gap-3 mb-4"
        >
          <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
            <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
              <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-red-600" />
            </div>
            <div className="text-left flex-1 min-w-0">
              <h2
                className="text-lg md:text-xl font-semibold text-foreground"
          style={{
            fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
          }}
        >
                Error Handling
        </h2>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">
                Yaygın hatalar ve nasıl ele alınacağı
              </p>
            </div>
          </div>
          {expandedSections.has('errors') ? (
            <ChevronUp className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground flex-shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground flex-shrink-0" />
          )}
        </button>
        {expandedSections.has('errors') && (
          <div className="mt-4 space-y-4">
            <div className="space-y-3">
              <div className="border-l-4 border-red-500 pl-3 md:pl-4">
                <h3 className="text-sm md:text-base font-medium text-foreground mb-1">400 Bad Request</h3>
                <p className="text-xs md:text-sm text-muted-foreground mb-2">Geçersiz parametreler</p>
                <pre className="bg-[var(--secondary)] rounded p-2 text-xs overflow-x-auto">
                  <code className="break-words whitespace-pre-wrap">{JSON.stringify({ success: false, error: "topic must be longer than or equal to 5 characters" }, null, 2)}</code>
                </pre>
              </div>
              <div className="border-l-4 border-yellow-500 pl-3 md:pl-4">
                <h3 className="text-sm md:text-base font-medium text-foreground mb-1">401 Unauthorized</h3>
                <p className="text-xs md:text-sm text-muted-foreground mb-2">Token eksik veya geçersiz</p>
                <pre className="bg-[var(--secondary)] rounded p-2 text-xs overflow-x-auto">
                  <code className="break-words whitespace-pre-wrap">{JSON.stringify({ statusCode: 401, message: "Unauthorized" }, null, 2)}</code>
                </pre>
              </div>
              <div className="border-l-4 border-red-600 pl-3 md:pl-4">
                <h3 className="text-sm md:text-base font-medium text-foreground mb-1">500 Internal Server Error</h3>
                <p className="text-xs md:text-sm text-muted-foreground mb-2">Sunucu hatası</p>
                <pre className="bg-[var(--secondary)] rounded p-2 text-xs overflow-x-auto">
                  <code className="break-words whitespace-pre-wrap">{JSON.stringify({ success: false, message: "Failed to generate blog" }, null, 2)}</code>
                </pre>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Additional Resources */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.9 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-5"
      >
        {/* Full Documentation */}
        <div className="bg-gradient-to-br from-[#203eec] to-[#1a32cc] rounded-xl p-4 md:p-6 text-white shadow-lg">
          <div className="flex items-center gap-2 md:gap-3 mb-3">
            <FileText className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0" />
            <h3
              className="text-base md:text-lg font-semibold"
              style={{
                fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
              }}
            >
              Tam Dokümantasyon
            </h3>
          </div>
          <p className="text-xs md:text-sm text-blue-50 mb-4">
            Detaylı örnekler, en iyi uygulamalar ve sorun giderme rehberleri ile eksiksiz API referansı.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="bg-white/10 hover:bg-white/20 border-white/30 text-white backdrop-blur-sm w-full sm:w-auto"
            onClick={() => window.open('/API_DOCUMENTATION.md', '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Tam Dokümantasyonu Görüntüle</span>
            <span className="sm:hidden">Dokümantasyon</span>
          </Button>
          </div>

        {/* Support & Resources */}
        <div className="bg-white rounded-xl p-4 md:p-6 border border-[var(--border)] shadow-sm">
          <div className="flex items-center gap-2 md:gap-3 mb-3">
            <Info className="w-5 h-5 md:w-6 md:h-6 text-[#203eec] flex-shrink-0" />
            <h3
              className="text-base md:text-lg font-semibold text-foreground"
              style={{
                fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
              }}
            >
              Destek & Kaynaklar
            </h3>
          </div>
          <div className="space-y-2 text-xs md:text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Check className="w-3 h-3 md:w-4 md:h-4 text-green-500 flex-shrink-0" />
              <span className="break-words">E-posta: support@blogenerate.com</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-3 h-3 md:w-4 md:h-4 text-green-500 flex-shrink-0" />
              <span>Yanıt süresi: 24-48 saat</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-3 h-3 md:w-4 md:h-4 text-green-500 flex-shrink-0" />
              <span>Kurumsal: Özel destek</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
