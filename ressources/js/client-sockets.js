/**
 * Created by Farting Dog on 22.01.2015.
 */
var socket = io.connect('/');

socket.on('connecting', function(){
    console.log('Connecting...');
});
socket.on('connect', function(){
   console.log('Connection to server established!');
});
socket.on('disconnect', function(){
   console.log('Disconnected.');
});


socket.on('reconnecting', function(){
    console.log('Reconnecting...');
});
socket.on('reconnect', function(){
    console.log('Reconnected.');
});


socket.on('connect_failed', function(){
    console.log('Connection failed!');
});
socket.on('error', function(){
    console.log('Error!');
});
