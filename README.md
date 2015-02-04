takeover
=========

##description

Server with frontend to send OSC, MIDI and DMX signals. 

The idea is to configure buttons, sliders, touch-areas and other inputs on the server,
then group them by views and render them on any client browser.

The interactions of the client will be send to the server via web-sockets in real time.
On the server the received values will be mapped on previously configured DMX, MIDI and DMX values
and be sent to listening hardware and software.

For more information see the documentation directory (german) or read the comments in the code.


##installation
This version does not send any MIDI, DMX or OSC Signals yet, it just logs to the console.
To run this alpha state of the project follow the steps:

- Install node.js
- Install grunt globally 
    (console: npm install grunt-cli -g)
    (http://gruntjs.com/getting-started)
    
- Install Ruby
- Install Sass Gem for Ruby
    
- open console in project root directory and 
    - npm install
    - grunt sass
    - grunt copy
    
- run the server: node server.js

- to configure the inputs edit the json files in resources/config/