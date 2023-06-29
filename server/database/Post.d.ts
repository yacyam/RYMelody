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

export interface Comment {
  id: number,
  userid: number,
  username: string,
  comment: string
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