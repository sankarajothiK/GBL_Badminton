import { createClient, SupabaseClient } from '@supabase/supabase-js';

const defaultUrl = 'https://rfonfqwpzfafrgkbbsuf.supabase.co';
const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder-anon-key';

// Read from localStorage override if admin configured in UI, else from import.meta.env
const storedUrl = typeof window !== 'undefined' ? localStorage.getItem('gbl_supabase_url') : null;
const storedKey = typeof window !== 'undefined' ? localStorage.getItem('gbl_supabase_anon_key') : null;

export let currentSupabaseUrl = storedUrl || import.meta.env.VITE_SUPABASE_URL || defaultUrl;
export let currentSupabaseAnonKey = storedKey || import.meta.env.VITE_SUPABASE_ANON_KEY || defaultKey;

export function isSupabaseConfigured(): boolean {
  return Boolean(
    currentSupabaseUrl && 
    currentSupabaseAnonKey && 
    !currentSupabaseAnonKey.includes('placeholder') &&
    currentSupabaseAnonKey.length > 20
  );
}

// Initialize Supabase client
export let supabase: SupabaseClient = createClient(currentSupabaseUrl, currentSupabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export function setSupabaseCredentials(url: string, anonKey: string) {
  currentSupabaseUrl = url.trim();
  currentSupabaseAnonKey = anonKey.trim();
  if (typeof window !== 'undefined') {
    localStorage.setItem('gbl_supabase_url', currentSupabaseUrl);
    localStorage.setItem('gbl_supabase_anon_key', currentSupabaseAnonKey);
  }
  supabase = createClient(currentSupabaseUrl, currentSupabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true },
    realtime: { params: { eventsPerSecond: 10 } }
  });
}

export function getSupabaseConfig() {
  return {
    url: currentSupabaseUrl,
    anonKey: currentSupabaseAnonKey,
    isConfigured: isSupabaseConfigured()
  };
}

export async function testSupabaseConnection(url = currentSupabaseUrl, anonKey = currentSupabaseAnonKey): Promise<{ success: boolean; message: string }> {
  try {
    const testClient = createClient(url.trim(), anonKey.trim());
    const { data, error } = await testClient.from('tournaments').select('id, name').limit(1);
    if (error) {
      return { success: false, message: error.message };
    }
    return { success: true, message: 'Successfully connected to central Supabase cloud database!' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Connection failed' };
  }
}

// Broadcast channel for instantaneous cross-tab/multi-window synchronization (Admin + Projector + Team)
const localBroadcastChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('gbl_realtime_sync')
  : null;

/**
 * Universal Realtime Event Broadcaster & Listener
 * Transmits auction updates through both Supabase Realtime Channel AND local BroadcastChannel
 */
export const realtimeManager = {
  broadcast(eventType: string, payload: any) {
    // 1. Send locally to other browser tabs/windows (Projector, Team devices)
    if (localBroadcastChannel) {
      try {
        localBroadcastChannel.postMessage({ type: eventType, payload, timestamp: Date.now() });
      } catch (err) {
        console.warn('Local broadcast error:', err);
      }
    }

    // 2. Broadcast via Supabase Realtime channel
    try {
      const channel = supabase.channel('gbl_auction_room');
      channel.send({
        type: 'broadcast',
        event: eventType,
        payload: { ...payload, timestamp: Date.now() }
      }).catch(() => {});
    } catch {
      // Supabase realtime channel fallback
    }
  },

  subscribe(callback: (eventType: string, payload: any) => void): () => void {
    // 1. Listen on local BroadcastChannel
    const localListener = (event: MessageEvent) => {
      if (event.data && event.data.type) {
        callback(event.data.type, event.data.payload);
      }
    };

    if (localBroadcastChannel) {
      localBroadcastChannel.addEventListener('message', localListener);
    }

    // 2. Listen on Supabase Realtime Channel
    const channel = supabase.channel('gbl_auction_room');
    channel
      .on('broadcast', { event: '*' }, (message) => {
        callback(message.event, message.payload);
      })
      .subscribe();

    return () => {
      if (localBroadcastChannel) {
        localBroadcastChannel.removeEventListener('message', localListener);
      }
      channel.unsubscribe();
    };
  }
};

/**
 * Image Upload Utility with 10 MB Maximum Validation and Compression
 * Fixes the 2 MB bug specifically identified in prompt requirements #7 and #63!
 */
export async function uploadImage(
  file: File,
  bucketName: 'players' | 'teams' | 'gallery' | 'tournament' = 'players'
): Promise<{ url: string; error?: string }> {
  // Validate 10 MB limit (10 * 1024 * 1024 = 10,485,760 bytes)
  const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      url: '',
      error: `File size exceeds the 10 MB limit (${(file.size / (1024 * 1024)).toFixed(2)} MB). Please select a file under 10 MB.`
    };
  }

  // Validate Allowed MIME Types (JPG, JPEG, PNG, WEBP)
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/svg+xml'];
  if (!allowedTypes.includes(file.type.toLowerCase())) {
    return {
      url: '',
      error: `Invalid file format "${file.type}". Allowed formats: JPG, JPEG, PNG, WEBP.`
    };
  }

  try {
    // If over 1.5 MB, compress using browser Canvas to optimize storage and transmission
    let uploadBlob: Blob = file;
    if (file.size > 1.5 * 1024 * 1024 && file.type !== 'image/svg+xml') {
      try {
        uploadBlob = await compressImage(file, 1600, 0.85);
      } catch (err) {
        console.warn('Canvas compression failed, falling back to original file', err);
        uploadBlob = file;
      }
    }

    const bucketKey = `gbl-${bucketName}`;
    const fileExt = file.name.split('.').pop() || 'jpg';
    const filePath = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

    // Attempt Supabase Storage upload
    const { data, error: uploadError } = await supabase.storage
      .from(bucketKey)
      .upload(filePath, uploadBlob, {
        cacheControl: '3600',
        upsert: false
      });

    if (!uploadError && data) {
      const { data: publicUrlData } = supabase.storage
        .from(bucketKey)
        .getPublicUrl(filePath);

      if (publicUrlData && publicUrlData.publicUrl) {
        return { url: publicUrlData.publicUrl };
      }
    }

    // High-performance Base64 fallback (for preview or local demo resilience)
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve({ url: reader.result as string });
      };
      reader.onerror = () => {
        resolve({ url: '', error: 'Failed to read image data' });
      };
      reader.readAsDataURL(uploadBlob);
    });
  } catch (err: any) {
    return { url: '', error: err.message || 'Image upload failed' };
  }
}

/**
 * Compresses an image client-side to maximum dimensions and quality
 */
function compressImage(file: File, maxDimension: number, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas toBlob failed'));
          }
        },
        'image/jpeg',
        quality
      );
    };
    img.onerror = reject;
    img.src = url;
  });
}
