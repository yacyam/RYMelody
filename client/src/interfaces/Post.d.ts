export interface Comment {
  id: number,
  userid: number,
  username: string,
  comment: string,
  canModify: boolean,
  replies: ReplyData[]
}

export interface Tags extends Record<string, boolean> {
  electronic: boolean,
  hiphop: boolean,
  pop: boolean,
  rock: boolean,
  punk: boolean,
  metal: boolean,
  jazz: boolean,
  classical: boolean
}

export interface HighlightPost {
  id: number,
  userid: number,
  username: string,
  title: string,
  description: string
}

export interface FullPost extends HighlightPost {
  audio: string,
  tags: Tags
}

export interface FullPostData extends FullPost {
  isPostLiked: boolean,
  amountLikes: number,
  canModify: boolean
}

export interface ReplyData {
  id: number,
  userid: number,
  username: string,
  commentid: number,
  replyid: number | null,
  postid: number,
  reply: string
}

export interface ReplyToData extends ReplyData {
  rpuserid: number | null,
  rpusername: string | null,
  rpreply: string | null,
  canModify: boolean
}