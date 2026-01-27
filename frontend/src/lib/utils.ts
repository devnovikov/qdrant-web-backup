import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return formatDate(date);
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'green':
    case 'ok':
    case 'completed':
    case 'Active':
      return 'text-green-600 bg-green-100';
    case 'yellow':
    case 'indexing':
    case 'running':
    case 'pending':
    case 'Partial':
    case 'PartialSnapshot':
      return 'text-yellow-600 bg-yellow-100';
    case 'red':
    case 'failed':
    case 'Dead':
      return 'text-red-600 bg-red-100';
    case 'grey':
    case 'cancelled':
    case 'Initializing':
    case 'Recovery':
      return 'text-gray-600 bg-gray-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

export function getStatusDot(status: string): string {
  switch (status) {
    case 'green':
    case 'ok':
    case 'completed':
    case 'Active':
      return 'bg-green-500';
    case 'yellow':
    case 'indexing':
    case 'running':
    case 'Partial':
      return 'bg-yellow-500';
    case 'red':
    case 'failed':
    case 'Dead':
      return 'bg-red-500';
    case 'pending':
      return 'bg-blue-500';
    default:
      return 'bg-gray-400';
  }
}
