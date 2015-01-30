/**
 * Created by Farting Dog on 22.01.2015.
 */


(function(){

    //var $slider = $('<input type="range" min="0" max="127" value="63">');
    var $slider = $( "<input type='number' data-type='range' min='0' max='127' step='1' value='63'>");

    $slider.on('change', function(){
        socket.emit('value_change', this.value);
    });

    //$('#controls').append($slider);
})();


