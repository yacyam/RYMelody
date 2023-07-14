import { HighlightPost } from "./Post"

export interface UserProfile {
  id: number,
  username: string,
  contact: string,
  bio: string,
  canModify: boolean,
  likes: HighlightPost[],
  posts: HighlightPost[],
  isVerified: boolean
}