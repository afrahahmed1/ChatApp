const { on } = require('process');

var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/chat.html');
});

//New User id number
var user = 1;
//List of all online users
var onlineusers = new Array();
//List of messages
var listOfMssgs = [];


io.on('connection', (socket) => {
    var color = '';
    var assignUsername = 'User' + user.toString();
    onlineusers.push(assignUsername);
    user = user + 1;

    //dispaly old messages 
    var message;
    console.log(listOfMssgs);
    for(var i = listOfMssgs.length - 1; i > -1; i--){
        message = listOfMssgs[i];
        socket.emit('chat message', message);
    }

    // console.log(assignUsername + ' connected' );
    socket.emit('online user title', 'Online Users:');
    socket.emit('activeUser', assignUsername + '(You)');
    socket.broadcast.emit('active users list', assignUsername);

    for(var i = 0; i < onlineusers.length; i++)
    {
        if(assignUsername !== onlineusers[i].toString())
        {
            socket.emit('active users list', onlineusers[i]);
        }
    }

    socket.emit('displayuser', 'You are ' + assignUsername);
    
    socket.on('disconnect', () => {
        console.log(assignUsername + ' disconnected');
        for (var i = 0; i < onlineusers.length; i++) {
            if(onlineusers[i] === assignUsername)
            {
                onlineusers.splice(i, 1);

            }
          }
          socket.broadcast.emit('user disconnected', assignUsername);
            for(var i = 0; i < onlineusers.length; i++)
            {
                socket.broadcast.emit('active users list', onlineusers[i]);
            }      
        
    });
    
    socket.on('chat message', (msg) => {
        //Current message time 
        var today = new Date();
        var time = today.getHours() + ':' + today.getMinutes() + ' ';
        
        if(msg !== '' && msg.split(' ').length !== 2 )
        {
            var fullMsg = time + assignUsername + ': ' + msg;

            // console.log(time + 'message: ' + msg);
            var styledFullMsg = '<span ' + color + '>' + assignUsername + '</span>';
            if(color !== '')
            {
                fullMsg = fullMsg.replace(assignUsername, styledFullMsg)
            }
            socket.broadcast.emit('chat message', fullMsg);
            socket.emit('chat message to self', fullMsg);

            //Save full message to the list of messages (listOfMssgs)
            listOfMssgs.unshift(fullMsg);
            //If list of messages (listOfMssgs) is > 200 remove oldest message
            if(listOfMssgs.length === 201) {
                listOfMssgs.pop();
            }
            
        }
        else if (msg.split(' ').length === 2) 
        {
            var message = msg.split(' ');
            var firstWord = message[0];

            //if changing name
            if(firstWord === '/name')
            {
                var taken = false;
    
                if(message[1].length !== 0) {
                    //check if username already taken
                    for(var i = 0; i < onlineusers.length; i++)
                    {
                    if(message[1].trim() === onlineusers[i])
                    {    
                        taken = true;
                    } 
                    }

                    if(taken === true)
                    {
                        socket.emit('chat message', 'This username is already taken, please re enter command with another username');
                    } else {
                        //delete old user from list
                        for (var i = 0; i < onlineusers.length; i++) {
                            if(onlineusers[i] === assignUsername)
                            {
                                onlineusers.splice(i, 1);
                                
                                assignUsername = message[1].trim();

                                onlineusers.push(assignUsername);
                            }
                        }
                        
                        socket.emit('displayuser', 'You are ' + assignUsername);
                        socket.emit('activeUser', assignUsername + '(You)');
                        socket.broadcast.emit('user disconnected', assignUsername);
                        for(var i = 0; i < onlineusers.length; i++)
                        {
                        socket.broadcast.emit('active users list', onlineusers[i]);
                        }  
                    }
                }
                else {
                    socket.emit('chat message', 'Enter valid username');
                }
                
            }
            else if (firstWord === '/color')
            {
                if(message[1].length !== 0)
                {
                    var line = message[1].split(",");
                    if(line.length != 3)
                    {
                        socket.emit('chat message', 'Enter valid colour format with 3 numbers seperated by commas');
                    }
                    else 
                    {
                        console.log(line[0]);
                        console.log(line[1]);
                        console.log(line[2]);
                        if(Number.isInteger(+line[0]) === false || Number.isInteger(+line[1]) === false || Number.isInteger(+line[2]) === false){
                            socket.emit('chat message', 'Invalid Color Format: Values must be numerical values');
                          }else if(parseInt(line[0]) < 0 || parseInt(line[0]) > 255 || parseInt(line[1]) < 0 || parseInt(line[1]) > 255 || parseInt(line[2]) < 0 || parseInt(line[2]) > 255){
                            socket.emit('chat message', 'Invalid Color Format: Values must be between 0 to 255');
                          }else {
                              var prevColor = color;
                                color = "style=\"color:rgb(" + parseInt(line[0]) + "," + parseInt(line[1]) + "," + parseInt(line[2]) + ");\"";
                                for(var i = 0; i < listOfMssgs.length; i++)
                                {
                                    if(prevColor !== '')
                                    {
                                        if(listOfMssgs[i].split(' ')[2].includes(assignUsername)){
                                            var oldStyledFullMsg = '<span ' + prevColor + '>' + assignUsername + '</span>';
                                            var styledFullMsg = '<span ' + color + '>' + assignUsername + '</span>';
                                            listOfMssgs[i] = listOfMssgs[i].replace(oldStyledFullMsg, styledFullMsg);
                                        }

                                    } else if(listOfMssgs[i].split(' ')[1].includes(assignUsername)){
                                        var styledFullMsg = '<span ' + color + '>' + assignUsername + '</span>';
                                        listOfMssgs[i] = listOfMssgs[i].replace(assignUsername, styledFullMsg);

                                    }
                                }
                                io.emit('empty messages', '');

                                //dispaly old messages 
                                var message;
                                console.log(listOfMssgs);
                                for(var i = listOfMssgs.length - 1; i > -1; i--){
                                    message = listOfMssgs[i];
                                    io.emit('chat message', message);
                                }
                            
                
                          }

                    }

                }
                else 
                {
                    socket.emit('chat message', 'Enter valid username color');
                }
                

            }
            else
            {
                if(firstWord.charAt(0) === '/')
                {
                    socket.emit('chat message', 'Invalid command: To change username use "/name <new Name>". To change color use "/color RR,GG,BB"');
                }
                else 
                {
                    var fullMsg = time + assignUsername + ': ' + msg;

                    // console.log(time + 'message: ' + msg);
                    var styledFullMsg = '<span ' + color + '>' + assignUsername + '</span>';
                    if(color !== '')
                    {
                        fullMsg = fullMsg.replace(assignUsername, styledFullMsg)
                    }
                    socket.broadcast.emit('chat message', fullMsg);
                    socket.emit('chat message to self', fullMsg);
        
                    //Save full message to the list of messages (listOfMssgs)
                    listOfMssgs.unshift(fullMsg);
                    //If list of messages (listOfMssgs) is > 200 remove oldest message
                    if(listOfMssgs.length === 201) {
                        listOfMssgs.pop();
                    }
                }
               
            }

        }
        else
        {
            socket.emit('chat message', 'Invalid message please write another message' );
        }

      });

});

http.listen(3001, () => {
    console.log('listening on *:3001');
});