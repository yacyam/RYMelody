export interface Post {
  id: number,
  userid: number,
  username: string,
  title: string,
  description: string,
  audio: string
}

export interface HomePost {
  id: number,
  userid: number,
  username: string,
  title: string,
  description: string
}

export interface RawComment {
  id: number,
  userid: number,
  postid: number,
  comment: string
}

export interface Comment {
  id: number,
  userid: number,
  username: string,
  comment: string
}

export interface ModifyComment extends Comment {
  canModify: boolean
}

export interface Tags {
  electronic: boolean,
  hiphop: boolean,
  pop: boolean,
  rock: boolean,
  punk: boolean,
  metal: boolean,
  jazz: boolean,
  classical: boolean
}

export interface RawReply {
  id: number,
  userid: number,
  commentid: number,
  replyid: number | null,
  postid: number
}

export interface Reply extends RawReply {
  username: string,
  reply: string,
}

export interface ReplyTo extends Reply {
  rpuserid: number | null,
  rpusername: string | null,
  rpreply: string | null
}

export interface ReplyToModify extends ReplyTo {
  canModify: boolean
}