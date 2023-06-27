import { HighlightPost } from "./Post"

export interface UserProfile {
  userid: number,
  username: string,
  contact: string,
  bio: string,
  canModify: boolean,
  likes: HighlightPost[],
  posts: HighlightPost[]
}