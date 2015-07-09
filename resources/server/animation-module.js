// TODO: fix this weird way of getting the TimelineLite ... should be fixed by greensock
var tween = require(global.tkvrBasePath + '/resources/server/tween-module.js');
var TimelineLite = global.com.greensock.TimelineLite;

// we are going to cache every animation created in here
var animations = {};


function triggerAnimation(config, onUpdateCallback, onCompleteCallback, objRef){
    onUpdateCallback = onUpdateCallback || function(){};
    onCompleteCallback = onCompleteCallback || function(){};

    // get or creates the animation
    var animation = getAnimation(config);

    // fist check if this animation is already existing and probably running
    if (animation) {
        //console.log('Animation '.yellow + getAnimationId(config), 'trigger', animation.config.trigger);

        // then check what to do when animation is triggered and do that
        switch (config.trigger) {

            case 'ignore':
            case 'continue':
                if (!animation.isActive()){
                    startNewAnimation();
                }
                break;

            case 'finish':
                if (!animation.isActive()){
                    startNewAnimation();
                }else{
                    // should not forget to set that back to original. FIXME: not so nice to do like this...
                    config.loop = 'stop';
                }
                break;

            case 'reverse':
                if(animation.reversed()){
                    animation.reversed(false);
                    animation.play();
                } else {
                    animation.reverse();
                }
                break;

            case 'pause':
                animation.paused( !animation.paused() );
                break;

            case 'restart':
                animation.restart();
                break;

            case 'stop':
            default:
                if (animation.isActive()){
                    animation.kill();
                }else{
                    startNewAnimation();
                }
        }

    // if we do not have that animation in cache, we create it
    } else {
        startNewAnimation();
    }

    //console.log('Animation '.yellow + getAnimationId(config), 'running:', animation.isActive());

    function startNewAnimation(){
        animation = setUpAnimation(config, onUpdateCallback, onCompleteCallback, objRef);
    }
}

// creates a new animation and
function setUpAnimation(config, onUpdateCallback, onCompleteCallback, objRef){
    objRef = objRef || {value : config.startValue};
    config.originalLoop = config.loop;

    //set up start point
    var animation = new TimelineLite().to(objRef, 0, {value: config.startValue} );

    // set up all the steps
    var steps = config.steps;
    var actualValue = objRef.value;
    for(var step in steps){
        switch (steps[step].type){
            case 'animate':
                animation = animation.to(objRef, steps[step].time/1000, {value: steps[step].to, ease: steps[step].curve});
                actualValue = steps[step].to;
                break;

            case 'wait':
                animation = animation.to(objRef, steps[step].time/1000, {value: actualValue});
                break;
        }
    }

    animation.eventCallback('onComplete', onComplete);
    animation.eventCallback('onReverseComplete', onComplete);

    // check what to do when the animation has reached its end
    //
    function onComplete(){

        //console.log('Animation '.yellow + getAnimationId(config), 'onComplete', config.loop);

        var repeat = config.loop;
        switch (repeat){
            case 'reverse':
                if(animation.reversed()){
                    animation.reversed(false);
                    animation.play();
                } else {
                    animation.reverse();
                }
                break;

            case 'restart':
                animation.restart();
                break;

            case 'wait':
                // nothing to do here
                // this case makes it possible to re-trigger the animation e.g. reverse it
                onCompleteCallback();
                break;

            case 'stop':
                if(config.trigger == 'finish'){ config.loop = config.originalLoop; }
                // no break intended!
            default:
                animation.kill();
                onCompleteCallback();
        }
    }

    // set what to do when the animation has reached a new value
    // and check if value has really changed for us
    animation.eventCallback('onUpdate', onUpdate);

    function onUpdate(){
        var oldValue = animation.oldValue || config.startValue;
        var newValue = parseInt(objRef.value);
        if(oldValue === newValue){ return }

        onUpdateCallback(newValue, oldValue);
        animation.oldValue = newValue;
    }

    animation.config = config;
    animations[getAnimationId(config)] = animation;
    return animation;
}

function getAnimation(config){
    var id = getAnimationId(config);
    return animations[id] || null;
}

// create a new id and set it in animation if it does not have one yet
function getAnimationId(config){
    var id = config.tkvrId;
    if (!id){
        id = parseInt(Math.random() * new Date().getTime() * 10000000).toString(36).toUpperCase();
        config.tkvrId = id;
    }
    return id;
}

function animationIsRunning(config){
    var animation = getAnimation(config);
    if(animation === null){return false}
    return animation.isActive();
}


var that = {};
that.triggerAnimation = triggerAnimation;
that.isRunning = animationIsRunning;
module.exports = that;