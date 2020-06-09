# Dating App Clone Server
( *Express + MongoDB + React + Node + Local & JWT Authentication* )


## MongoDB User Schema
- Username
- FirstName + LastName
- Password
- Picture
- Email
- Sex 
- Role (User, Admin)
- Picture
- likedUsers, dislikedUsers, superlikedUsers
- likedBy
- matches
- rooms (for Messages)
- createdAt

## Routers 

### User Routers
- register
- login
- logout
- authenticated
- update, delete (*for account*)
- like, dislike, superlike
- people, matches
- room, sendMessage (*Not implement Socket.io*)

### Image Routers
- Upload (*automatically delete old picture when user uploads new picture*)
- Show

