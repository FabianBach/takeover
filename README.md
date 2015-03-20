takeover
=========

##description

Server with frontend to send OSC, MIDI and DMX signals. 

The idea is to configure buttons, sliders, touch-areas and other inputs on the server,
then group them by views and render them on any client browser.

The interactions of the client will be send to the server via web-sockets in real time.
On the server the received values will be mapped on previously configured DMX, MIDI and DMX values
and be sent to listening hardware and software.

For more information see the documentation directory (german) or read (the comments in) the code.
This will be documented better at some time. I promise.


##installation
This Version does send DMX if you have an Enttec Open USB interface and MIDI if you are using a MidiMate II.
It does not send any OSC Signals yet.
To run this alpha state of the project follow these steps:

- Install node.js

- Windows:
    - install Visual Studio Express for DMX
    - install .NET Framework
  
- Unix:
    - install some C++ compiler
    - install Mono
    
- open console in project root directory and 
    - npm install
    - grunt sass
    - grunt copy
    
- run the server:
    - open the console
    - change to this project directory
    - type: node server.js

- to configure the server edit the server.js and restart server if running
- to configure the inputs edit the json files in resources/config/ and restart server
- to configure the views edit the json files in resources/config/ and restart server


To develop you will also need ruby with sass gem and grunt