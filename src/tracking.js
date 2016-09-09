import TrackerTask from './trackers/TrackerTask';
import Canvas from './utils/Canvas';
export ObjectTracker from './trackers/ObjectTracker';

/**
 * Captures the user camera when tracking a video element and set its source
 * to the camera stream.
 * @param {HTMLVideoElement} element Canvas element to track.
 * @param {object} opt_options Optional configuration to the tracker.
 */
const initUserMedia_ = function(element, opt_options) {
  navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
  navigator.getUserMedia({
    video: true,
    audio: !!(opt_options && opt_options.audio)
  }, function(stream) {
    try {
      element.src = URL.createObjectURL(stream);
    } catch (err) {
      element.src = stream;
    }
  }, function() {
    throw Error('Cannot capture user camera.');
  }
  );
};

/**
 * Tests whether the object is the `window` object.
 * @param {object} o Object to be tested.
 * @return {boolean} True if the object is the `window` object.
 */
const isWindow = function(o) {
  return !!(o && o.alert && o.document);
};

/**
 * Tests whether the object is a dom node.
 * @param {object} o Object to be tested.
 * @return {boolean} True if the object is a dom node.
 */
const isNode = function(o) {
  return o.nodeType || isWindow(o);
};

/**
 * Selects a dom node from a CSS3 selector using `document.querySelector`.
 * @param {string} selector
 * @param {object} opt_element The root element for the query. When not
 *     specified `document` is used as root element.
 * @return {HTMLElement} The first dom element that matches to the selector.
 *     If not found, returns `null`.
 */
const one = function(selector, opt_element) {
  if (isNode(selector)) {
    return selector;
  }
  return (opt_element || document).querySelector(selector);
};

/**
 * Tracks a canvas element based on the specified `tracker` instance. This
 * method extract the pixel information of the input element to pass to the
 * `tracker` instance.
 * @param {HTMLCanvasElement} element Canvas element to track.
 * @param {tracking.Tracker} tracker The tracker instance used to track the
 *     element.
 * @param {object} opt_options Optional configuration to the tracker.
 * @private
 */
const trackCanvasInternal_ = function(element, tracker) {
  var width = element.width;
  var height = element.height;
  var context = element.getContext('2d');
  var imageData = context.getImageData(0, 0, width, height);
  tracker.track(imageData.data, width, height);
};

/**
 * Tracks a canvas element based on the specified `tracker` instance and
 * returns a `TrackerTask` for this track.
 * @param {HTMLCanvasElement} element Canvas element to track.
 * @param {tracking.Tracker} tracker The tracker instance used to track the
 *     element.
 * @param {object} opt_options Optional configuration to the tracker.
 * @return {tracking.TrackerTask}
 * @private
 */
const trackCanvas_ = function(element, tracker) {
  var task = new TrackerTask(tracker);
  task.on('run', () => {
    trackCanvasInternal_(element, tracker);
  });
  return task.run();
};

/**
 * Tracks a image element based on the specified `tracker` instance. This
 * method extract the pixel information of the input element to pass to the
 * `tracker` instance.
 * @param {HTMLImageElement} element Canvas element to track.
 * @param {tracking.Tracker} tracker The tracker instance used to track the
 *     element.
 * @param {object} opt_options Optional configuration to the tracker.
 * @private
 */
const trackImg_ = function(element, tracker) {
  var width = element.width;
  var height = element.height;
  var canvas = document.createElement('canvas');

  canvas.width = width;
  canvas.height = height;

  var task = new TrackerTask(tracker);
  task.on('run', function() {
    Canvas.loadImage(canvas, element.src, 0, 0, width, height, function() {
      trackCanvasInternal_(canvas, tracker);
    });
  });
  return task.run();
};

/**
 * Tracks a video element based on the specified `tracker` instance. This
 * method extract the pixel information of the input element to pass to the
 * `tracker` instance. The `tracker.track(pixels, width, height)` will be in
 * a `requestAnimationFrame` loop in order to track all video frames.
 * @param {HTMLVideoElement} element Canvas element to track.
 * @param {tracking.Tracker} tracker The tracker instance used to track the
 *     element.
 * @param {object} opt_options Optional configuration to the tracker.
 * @private
 */
const trackVideo_ = function(element, tracker, opt_options) {
  var canvas = document.createElement('canvas');
  var context = canvas.getContext('2d');
  var width;
  var height;
  var freq = 'freq' in opt_options ? opt_options.freq : 100;

  var resizeCanvas_ = function() {
    width = element.offsetWidth;
    height = element.offsetHeight;
    canvas.width = width;
    canvas.height = height;
  };
  resizeCanvas_();
  element.addEventListener('resize', resizeCanvas_);

  var requestId;
  var count = 0;
  var requestAnimationFrame_ = function() {
    requestId = window.requestAnimationFrame(function() {
      if ( ++count % freq == 0 ) {
        count = 0;
        if (element.readyState === element.HAVE_ENOUGH_DATA) {
          try {
            // Firefox v~30.0 gets confused with the video readyState firing an
            // erroneous HAVE_ENOUGH_DATA just before HAVE_CURRENT_DATA state,
            // hence keep trying to read it until resolved.
            context.drawImage(element, 0, 0, width, height);
          } catch (err) {}
          trackCanvasInternal_(canvas, tracker);
        }
      }
      requestAnimationFrame_();
    });
  };

  var task = new TrackerTask(tracker);
  task.on('stop', function() {
    window.cancelAnimationFrame(requestId);
  });
  task.on('run', function() {
    requestAnimationFrame_();
  });
  return task.run();
};

/**
 * Tracks a canvas, image or video element based on the specified `tracker`
 * instance. This method extract the pixel information of the input element
 * to pass to the `tracker` instance. When tracking a video, the
 * `tracker.track(pixels, width, height)` will be in a
 * `requestAnimationFrame` loop in order to track all video frames.
 *
 * Example:
 * var tracker = new tracking.ColorTracker();
 *
 * tracking.track('#video', tracker);
 * or
 * tracking.track('#video', tracker, { camera: true });
 *
 * tracker.on('track', function(event) {
 *   // console.log(event.data[0].x, event.data[0].y)
 * });
 *
 * @param {HTMLElement} element The element to track, canvas, image or
 *     video.
 * @param {tracking.Tracker} tracker The tracker instance used to track the
 *     element.
 * @param {object} opt_options Optional configuration to the tracker.
 */
export const track = function(element, tracker, opt_options) {
  element = one(element);
  if (!element) {
    throw new Error('Element not found, try a different element or selector.');
  }
  if (!tracker) {
    throw new Error('Tracker not specified, try `tracking.track(element, new tracking.FaceTracker())`.');
  }

  switch (element.nodeName.toLowerCase()) {
    case 'canvas':
      return trackCanvas_(element, tracker, opt_options);
    case 'img':
      return trackImg_(element, tracker, opt_options);
    case 'video':
      if (opt_options) {
        if (opt_options.camera) {
          initUserMedia_(element, opt_options);
        }
      }
      return trackVideo_(element, tracker, opt_options);
    default:
      throw new Error('Element not supported, try in a canvas, img, or video.');
  }
};


