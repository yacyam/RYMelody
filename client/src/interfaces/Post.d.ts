export interface Comment {
  id: number,
  username: string,
  comment: string
}

export interface HighlightPost {
  id: number,
  username: string,
  title: string,
  description: string
}

export interface FullPost extends HighlightPost {
  audio: string
  comments: Comment[]
}