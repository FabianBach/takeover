takeover
=========

##description

Server with frontend to send OSC, MIDI and DMX signals. 

The idea is to configure buttons, sliders, touch-areas and other inputs on the server,
then group them by views and render them on any client browser.

The interactions of the client will be send to the server via web-sockets in real time.
On the server the received values will be mapped on previously configured DMX, MIDI and DMX values
and be sent to listening hardware and software.

See documentation directory for more information (written in german).