export interface TrackMetadata {
  title: string;
  artist: string;
  album?: string;
  coverUrl?: string;
  duration?: number;
  filename: string;
}

export interface Track {
  id: string;
  path: string;
  metadata: TrackMetadata;
} 