var tween = require(global.tkvrBasePath + '/resources/server/tween-module.js');
var animations = {};

function triggerAnimation(config, onUpdateCallback, onCompleteCallback, objRef){
    onUpdateCallback = onUpdateCallback || function(){};
    onCompleteCallback = onCompleteCallback || function(){};

    var animation = getAnimation(config);

    // fist check if any animation is running on that channel
    // and what should be done if any other animation comes in
    if (animation) {
        switch (animation.config.trigger) {
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
        animation = setUpAnimation(config, onUpdateCallback, onCompleteCallback, objRef);
    }
}

function setUpAnimation(config, onUpdateCallback, onCompleteCallback, objRef){
    objRef = objRef || {value : 0};
    var animation = tween;
    animation.tkvrId = parseInt(Math.random() * new Date().getTime() * 10000000).toString(36).toUpperCase();
    animation.tkvrKey = getAnimationKey(config);
    animation.config = config;

    var steps = config.steps;
    var actualValue = objRef.value;
    for(var step in steps){
        switch (steps[step].type){
            case 'animate':
                animation.to(objRef, steps[step].time/1000, {value: steps[step].to});
                actualValue = steps[step].to;
                break;

            case 'wait':
                animation.to(objRef, steps[step].time/1000, {value: actualValue});
                break;
        }
    }

    animation.eventCallback('onComplete', function onComplete(){
        var repeat = config.loop;
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

        onUpdateCallback(newValue, oldValue);
        animation.oldValue = newValue;
    });

    animations[animation.tkvrKey] = animation;
    return animation;
}

function getAnimation(config){
    var key = getAnimationKey(config);
    return animations[key] || null;
}

function getAnimationKey(config){
    //TODO: OSC is not in here yet

    var key = config.key;
    if (key){ return key }

    var out = config.universe || config.midiOut;
    out = out.toLowerCase();
    return (config.type +'_'+ config.channel +'_'+ out);
}

function animationIsRunning(config){
    var animation = getAnimation(config);
    if(animation === null){return false}
    //TODO: not the real interface: running()
    return animation.isActive();
}


var that = {};
that.triggerAnimation = triggerAnimation;
that.isRunning = animationIsRunning;
that.getAnimationKey = getAnimationKey;
module.exports = that;