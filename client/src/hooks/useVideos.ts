import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface Video {
  id: number;
  name: string;
  description?: string;
  duration?: number;
  fileSize?: number;
  status: string;
  createdAt: string;
  url: string;
}

export const useVideos = () => {
  const queryClient = useQueryClient();

  // Get all videos
  const videosQuery = useQuery<{ success: boolean, data: Video[] }>({
    queryKey: ['/api/videos'],
  });

  // Get a single video
  const useVideo = (id: number) => {
    return useQuery<{ success: boolean, data: Video }>({
      queryKey: [`/api/videos/${id}`],
      enabled: !!id,
    });
  };

  // Upload a video
  const uploadMutation = useMutation({
    mutationFn: async ({ formData }: { formData: FormData }) => {
      const res = await fetch('/api/videos/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || res.statusText);
      }
      
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/videos'] });
    },
  });

  // Trim a video
  const trimMutation = useMutation({
    mutationFn: async ({ 
      videoId, 
      startTime, 
      endTime, 
      outputName 
    }: { 
      videoId: number, 
      startTime: number, 
      endTime: number, 
      outputName?: string 
    }) => {
      return apiRequest('POST', `/api/videos/${videoId}/trim`, {
        startTime,
        endTime,
        output: outputName ? { name: outputName } : undefined
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
    },
  });

  // Add subtitles to a video
  const subtitlesMutation = useMutation({
    mutationFn: async ({ 
      videoId, 
      subtitles, 
      style 
    }: { 
      videoId: number, 
      subtitles: { text: string, startTime: number, endTime: number }[],
      style?: {
        fontSize?: number,
        fontColor?: string,
        backgroundColor?: string,
        position?: 'top' | 'middle' | 'bottom'
      }
    }) => {
      return apiRequest('POST', `/api/videos/${videoId}/subtitles`, {
        subtitles,
        style
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
    },
  });

  // Render a video
  const renderMutation = useMutation({
    mutationFn: async ({ 
      videoId, 
      operations, 
      output 
    }: { 
      videoId: number, 
      operations?: number[],
      output?: {
        name?: string,
        format?: 'mp4' | 'webm' | 'mov',
        quality?: 'low' | 'medium' | 'high'
      }
    }) => {
      return apiRequest('POST', `/api/videos/${videoId}/render`, {
        operations,
        output
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
    },
  });

  return {
    videosQuery,
    useVideo,
    uploadMutation,
    trimMutation,
    subtitlesMutation,
    renderMutation
  };
};
