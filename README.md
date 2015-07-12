takeover
=========
(v 0.5.0)

This is a system developed for easy to build interactive installations.
It contains a server to send OSC, MIDI and DMX signals, and a frontend for anyone to control these protocols.

It is configured by creating buttons, sliders, touch-areas and other inputs on the server.
Those are then grouped into views and be available via browser on any client.
The interactions of the client will be send to the server via web-sockets in real time.
On the server the received values will be mapped on previously configured DMX, MIDI and DMX values
and be sent to hardware and software over those protocols.

##install
To run this version of of the project follow these steps:

- Install node.js


- Windows:
    - install Visual Studio Express for DMX
    - install .NET Framework
  
- Unix:
    - install some C++ compiler
    - install Mono
    
- open console, change to project directory and install by running `npm install` .


- to get the application ready, execute the following grunt tasks: `grunt sass`, `grunt copy`, and `grunt concat` .
    
##start
To run the server open the console, change to project directory and run `node server.js`.
Server will then listen on localhost:80.

##configure
All configurations are made in JSON-files and can be found in `/resources/config/`.
The server has to be restarted to apply any changes.

Read the sample configs to learn more about the configuration of the application.