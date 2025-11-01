'use client';
import { useAuth } from '@/hooks/useAuth';

export default function AuthInitializer() {
  useAuth();
  return null;
}
