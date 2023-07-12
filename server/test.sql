SELECT p1.id, p1.userid, u1.username, p1.commentid, p1.replyid, p1.reply, p1.postid, 
        p2.userid as rpuserid, u2.username as rpusername, p2.reply as rpreply
FROM postreply p1
JOIN users u1
ON p1.userid = u1.id
LEFT JOIN postreply p2
ON p1.replyid = p2.id
LEFT JOIN users u2
ON p2.userid = u2.id