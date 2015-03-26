var tween = require(global.tkvrBasePath + '/resources/server/tween-module.js');
var animations = {};

function doAnimation(mapping, objRef, onUpdateCallback, onCompleteCallback){
    onUpdateCallback = onUpdateCallback || function(){};
    onCompleteCallback = onCompleteCallback || function(){};

    var animation = getAnimation(mapping);

    // fist check if any animation is running on that channel
    // and what should be done if any other animation comes in
    if (animation) {
        switch (animation.mapping.animation) {
            //TODO: implement the cases
            case 'ignore':
            case 'continue':
                // if it is running
                // do nothing... animation is running till end
                // if not running start new animaton
                break;

            case 'reverse':
                // reverse if animation.id is the same
                // else start new animation
                break;

            case 'stop':
                //.kill()
                // also start new animation
                break;

            case 'pause':
                // if animation.id is the same
                // .pause() or .resume() if .paused()

                //else start new animation
                break;

            case 'restart':
            default:
                // restart if animation.id is the same
                // else start new animation
        }
    }

    function startNewAnimation(){
        animation = setUpAnimation(mapping, objRef, onUpdateCallback, onCompleteCallback);
    }
}

function setUpAnimation(mapping, objRef, onUpdateCallback, onCompleteCallback){
    var animation = tween;
    animation.tkvrId = parseInt(Math.random() * new Date().getTime() * 10000000).toString(36).toUpperCase();
    animation.tkvrKey = getAnimationKey(mapping);
    animation.mapping = mapping;

    var actualValue = objRef.value;
    for(var step in mapping.animation.steps){
        switch (step.type){
            case 'animate':
                animation.to(objRef, mapping.time/1000, {value: mapping.to});
                actualValue = mapping.to;
                break;

            case 'wait':
                animation.to(objRef, mapping.time/1000, {value: actualValue});
                break;
        }
    }

    animation.eventCallback('onComplete', function onComplete(){
        var repeat = mapping.animation.loop;
        switch (repeat){
            case 'reverse':
                // reverse
                // if reversed() have to restart()?
                break;

            case 'restart':
                //restart

            default:
                // .kill()
                onCompleteCallback();
        }
    });

    animation.eventCallback('onUpdate', function onUpdate(){
        var oldValue = animation.oldValue || objRef.value;
        var newValue = parseInt(objRef.value);
        if(oldValue === newValue){ return }

        animation.oldValue = newValue;
        onUpdateCallback(newValue, oldValue);
    });

    animations[animation.tkvrKey] = animation;
    return animation;
}

function getAnimation(mapping){
    var key = getAnimationKey(mapping);
    return animations[key] || null;
}

function getAnimationKey(mapping){
    //TODO: OSC is not in here yet
    var out = mapping.universe || mapping.midiOut;
    out = out.toLowerCase();
    return (mapping.type +'_'+ mapping.channel +'_'+ out);
}

function animationIsRunning(mapping){
    var animation = getAnimation(mapping);
    if(animation === null){return false}
    //TODO: not the real interface: running()
    return animation.isActive();
}


var that = {};
that.doAnimation = doAnimation;
that.isRunning = animationIsRunning;
that.getAnimationKey = getAnimationKey;
module.exports = that;