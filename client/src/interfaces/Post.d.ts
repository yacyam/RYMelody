export interface Comment {
  id: number,
  userid: number,
  username: string,
  comment: string
}

export interface HighlightPost {
  id: number,
  userid: number,
  username: string,
  title: string,
  description: string
}

export interface FullPost extends HighlightPost {
  userid: number,
  audio: string,
  comments: Comment[]
}

export interface FullPostData extends FullPost {
  isPostLiked: boolean,
  amountLikes: number,
  canModify: boolean
}