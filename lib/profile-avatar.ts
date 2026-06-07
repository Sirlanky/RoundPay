import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabase';

export const AVATAR_BUCKET = 'avatars';

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export function avatarStoragePath(userId: string, mimeType: string): string {
  const ext = MIME_TO_EXT[mimeType] ?? 'jpg';
  return `${userId}/avatar.${ext}`;
}

export function withAvatarCacheBuster(url: string): string {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}t=${Date.now()}`;
}

export function isAvatarColumnMissing(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const e = error as { message?: string; code?: string };
  return e.code === 'PGRST204' || (e.message?.includes('avatar_url') ?? false);
}

async function ensureMediaPermission(kind: 'library' | 'camera'): Promise<boolean> {
  if (kind === 'library') {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  }
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  return status === 'granted';
}

export class ProfilePhotoPermissionError extends Error {
  constructor() {
    super('Photo permission denied');
    this.name = 'ProfilePhotoPermissionError';
  }
}

async function pickImage(kind: 'library' | 'camera'): Promise<ImagePicker.ImagePickerAsset | null> {
  const allowed = await ensureMediaPermission(kind);
  if (!allowed) throw new ProfilePhotoPermissionError();

  const result =
    kind === 'library'
      ? await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.85,
        })
      : await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.85,
        });

  if (result.canceled || !result.assets[0]) return null;
  return result.assets[0];
}

async function uriToArrayBuffer(uri: string): Promise<ArrayBuffer> {
  const response = await fetch(uri);
  return response.arrayBuffer();
}

export async function uploadProfileAvatar(
  userId: string,
  asset: ImagePicker.ImagePickerAsset
): Promise<string> {
  const mimeType = asset.mimeType ?? 'image/jpeg';
  const path = avatarStoragePath(userId, mimeType);
  const bytes = await uriToArrayBuffer(asset.uri);

  const { error: uploadError } = await supabase.storage.from(AVATAR_BUCKET).upload(path, bytes, {
    contentType: mimeType,
    upsert: true,
  });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  const publicUrl = withAvatarCacheBuster(data.publicUrl);

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', userId);
  if (profileError) throw profileError;

  return publicUrl;
}

export async function removeProfileAvatar(userId: string): Promise<void> {
  const { data: files } = await supabase.storage.from(AVATAR_BUCKET).list(userId);
  if (files?.length) {
    const paths = files.map((file) => `${userId}/${file.name}`);
    await supabase.storage.from(AVATAR_BUCKET).remove(paths);
  }

  const { error } = await supabase.from('profiles').update({ avatar_url: null }).eq('id', userId);
  if (error) throw error;
}

export async function pickAndUploadProfileAvatar(userId: string, kind: 'library' | 'camera') {
  const asset = await pickImage(kind);
  if (!asset) return null;
  return uploadProfileAvatar(userId, asset);
}
