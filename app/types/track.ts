export interface TrackMetadata {
  title: string;
  artist: string;
  album?: string;
  coverUrl?: string;
  duration?: number;
  filename: string;
}

export interface Track {
  filename: string;
  title: string;
  artist: string;
  album: string;
  coverPath: string;
  duration: number;
  year?: string;
  genre?: string;
} 