'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { generateBlog } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const blogSchema = z.object({
  topic: z.string().min(5, 'Topic must be at least 5 characters').max(200, 'Topic is too long'),
  additionalContext: z.string().max(500, 'Context is too long').optional(),
  tone: z.string().max(50, 'Tone is too long').optional(),
  targetAudience: z.string().max(50, 'Target audience is too long').optional(),
});

type BlogFormData = z.infer<typeof blogSchema>;

export default function BlogGenerator() {
  const [generatedBlog, setGeneratedBlog] = useState<{
    title: string;
    content: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<BlogFormData>({
    resolver: zodResolver(blogSchema),
  });

  const onSubmit = async (data: BlogFormData) => {
    setIsLoading(true);
    setError(null);
    setGeneratedBlog(null);

    try {
      const response = await generateBlog(data);

      if (response.success && response.data) {
        setGeneratedBlog(response.data);
        reset();
      } else {
        setError(response.error || 'Failed to generate blog');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle>Blog İçeriği Oluştur</CardTitle>
          <CardDescription>AI destekli blog içeriğinizi oluşturmak için formu doldurun</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Blog Konusu *</label>
              <Input
                placeholder="e.g., The Future of Artificial Intelligence"
                className="bg-black border-gray-800 focus-visible:ring-purple-500"
                {...register('topic')}
              />
              {errors.topic && (
                <p className="mt-1 text-sm text-red-500">{errors.topic.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Ek Bağlam (Opsiyonel)</label>
              <Textarea
                placeholder="Ek bilgiler veya özel noktalar..."
                className="bg-black border-gray-800 focus-visible:ring-purple-500 min-h-[100px]"
                {...register('additionalContext')}
              />
              {errors.additionalContext && (
                <p className="mt-1 text-sm text-red-500">{errors.additionalContext.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Ton (Opsiyonel)</label>
                <Input
                  placeholder="e.g., Professional, Casual, Friendly"
                  className="bg-black border-gray-800 focus-visible:ring-purple-500"
                  {...register('tone')}
                />
                {errors.tone && (
                  <p className="mt-1 text-sm text-red-500">{errors.tone.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Hedef Kitle (Opsiyonel)</label>
                <Input
                  placeholder="e.g., Developers, Marketers, Students"
                  className="bg-black border-gray-800 focus-visible:ring-purple-500"
                  {...register('targetAudience')}
                />
                {errors.targetAudience && (
                  <p className="mt-1 text-sm text-red-500">{errors.targetAudience.message}</p>
                )}
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg">
                <p className="text-red-400">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {isLoading ? 'Oluşturuluyor...' : 'Blog İçeriği Oluştur'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {generatedBlog && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Oluşturulan Blog</CardTitle>
              <Button
                variant="outline"
                className="border-gray-700 hover:bg-gray-800"
                onClick={() => {
                  setGeneratedBlog(null);
                  setError(null);
                }}
              >
                Temizle
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-invert max-w-none">
              <h1 className="text-3xl font-bold mb-4">{generatedBlog.title}</h1>
              <div
                className="blog-content text-gray-300 whitespace-pre-wrap"
                dangerouslySetInnerHTML={{
                  __html: generatedBlog.content
                    .replace(/\n/g, '<br />')
                    .replace(/#{3}\s+(.+)/g, '<h3 class="text-xl font-semibold mt-6 mb-3">$1</h3>')
                    .replace(/#{2}\s+(.+)/g, '<h2 class="text-2xl font-semibold mt-8 mb-4">$1</h2>')
                    .replace(/#{1}\s+(.+)/g, '<h1 class="text-3xl font-bold mt-8 mb-4">$1</h1>')
                    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.+?)\*/g, '<em>$1</em>'),
                }}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
