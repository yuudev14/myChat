const { index } = require('../../models/messages');
const { update } = require('../../models/user');
const User = require('../../models/user');
module.exports = socket => {
    socket.on('connectToUser', room => {
        socket.join(room);
        console.log(socket.id + ' ' + room);
    });
    socket.on('disconnectUser', room =>{
        socket.leave(room);
    });

    socket.on('sendMessage', ({message, to, username, senderProfile, sender_id, room, images}) => {

        User.findOne({_id : sender_id})
            .then(senderUser => {
                if(senderUser.messages.some(messageUser => messageUser.user_id === to)){
                    senderUser.messages.forEach(messageUser => {
                        if(messageUser.user_id === to){
                            messageUser.username = username;
                            messageUser.senderProfile = senderProfile;
                            messageUser.messages.push({message, sender_id, images});
                            messageUser.date = Date.now();
                        }
                    });
                }else{
                    senderUser.messages.push({user_id : to, username, senderProfile, messages : [{sender_id, message, images}]});
                }
                senderUser.messages = senderUser.messages.sort((a, b) => new Date(b.date) - new Date(a.date));
                senderUser.save()
                    .then(updatedSenderUser => {
                        User.findOne({_id : to})
                            .then(toSendUser => {
                                const messageFilter = updatedSenderUser.messages.filter(msgUser => msgUser.user_id === to)[0];
                                const message_id = messageFilter.messages[messageFilter.messages.length - 1]._id;
                                const _id = updatedSenderUser.messages.filter(msgUser => msgUser.user_id === to)[0]._id
                                if(toSendUser.messages.some(messageUser => messageUser.user_id === sender_id)){
                                    toSendUser.messages.forEach(messageUser => {
                                        if(messageUser.user_id === sender_id){
                                            messageUser.username = updatedSenderUser.username;
                                            messageUser.senderProfile = updatedSenderUser.profile;
                                            messageUser.messages.push({_id : message_id, message, sender_id, images});
                                            messageUser.date = Date.now();
                                        }
                                    });
                                }else{
                                    toSendUser.messages.push({_id, user_id : sender_id, username : updatedSenderUser.username, senderProfile : updatedSenderUser.profile, messages : [{sender_id, message, images}]});
                                }
                                toSendUser.messages = toSendUser.messages.sort((a, b) => new Date(b.date) - new Date(a.date));
                                toSendUser.save()
                                    .then(updatedToSendUser => {
                                        const sendedUser = {
                                            _id : updatedToSendUser._id,
                                            username : updatedToSendUser.username,
                                            profile : updatedToSendUser.profile,
                                            online : updatedToSendUser.online
                                        }
                                        const currentUser = {
                                            _id : updatedSenderUser._id,
                                            username : updatedSenderUser.username,
                                            profile : updatedSenderUser.profile,
                                            online : updatedSenderUser.online
                                        }
                                        socket.broadcast.to(to).emit('updateUserData', updatedToSendUser)
                                        socket.emit('updateUserData', updatedSenderUser)
                                        socket.broadcast.to(room).emit('send', currentUser)
                                        socket.emit('send', sendedUser)
                                        

                                    })
                            })
                    });
            })

        // User.findOne({_d : sender})
        // .then(user=>{
        //     if(user.messages.some(messageUser => messageUser._id.toString() === room)){
        //         user.messages.forEach(messageUser => {
        //             if(messageUser._id.toString() === room){
        //                 messageUser.messages.push({message, sender, images});
        //                 messageUser.date = Date.now();
        //             }
        //         });
        //     }else{
        //         user.messages.push({_id: room, username, messages : [{sender , message, images}]});
        //         user.messages.forEach(messageUser => {
        //             if(messageUser._id.toString() === room){
        //                 messageUser.date = Date.now();
        //             }
        //         });
        //     }
        //     user.messages = user.messages.sort((a, b) => new Date(b.date) - new Date(a.date))
        //     user.save()
        //         .then(currentUser => {   
        //             User.findOne({username})
        //                 .then(user=>{
        //                     const index = currentUser.messages.findIndex(messageUser => messageUser.username === username);
        //                     const _id = currentUser.messages[index]._id;
        //                     const length = currentUser.messages[index].messages.length - 1
        //                     const message_id = currentUser.messages[index].messages[length]._id;
        //                     if(user.messages.some(messageUser => messageUser._id.toString() === _id.toString())){
        //                         user.messages.forEach(messageUser => {
        //                             if(messageUser._id.toString() === _id.toString()){
        //                                 messageUser.messages.push({message, sender, _id : message_id, images});
        //                                 messageUser.date = Date.now();
        //                             }
        //                         });
        //                     }else{
        //                         user.messages.push({_id, username : sender, messages : [{sender , message, _id : message_id, images}]});
        //                         user.messages.forEach(messageUser => {
        //                             if(messageUser.username === username){
        //                                 messageUser.date = Date.now();
        //                             }
        //                         });
        //                     }
        //                     user.messages = user.messages.sort((a, b) => new Date(b.date) - new Date(a.date));
        //                     user.save()
        //                         .then(user => {
        //                             socket.broadcast.to(room).emit('send', user)
        //                             socket.emit('send', currentUser)
        //                             socket.broadcast.to(room).emit('updateUserData', user)
        //                             socket.emit('updateUserData', currentUser)
        //                         });
        //                 });
        //         });
        // });
    });
}