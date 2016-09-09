import Tracker from './Tracker';
import ViolaJones from '../detection/ViolaJones';

/**
 * ObjectTracker utility.
 * @constructor
 * @param {string|Array.<string|Array.<number>>} opt_classifiers Optional
 *     object classifiers to track.
 * @extends {tracking.Tracker}
 */
export default class ObjectTracker extends Tracker {
  constructor(opt_classifiers) {
    super();

    /**
     * Specifies the edges density of a block in order to decide whether to skip
     * it or not.
     * @default 0.2
     * @type {number}
     */
    this.edgesDensity = 0.2;

    /**
     * Specifies the initial scale to start the feature block scaling.
     * @default 1.0
     * @type {number}
     */
    this.initialScale = 1.0;

    /**
     * Specifies the scale factor to scale the feature block.
     * @default 1.25
     * @type {number}
     */
    this.scaleFactor = 1.25;

    /**
     * Specifies the block step size.
     * @default 1.5
     * @type {number}
     */
    this.stepSize = 1.5;

    this.violaJones = new ViolaJones();

    if (opt_classifiers) {
      if (!Array.isArray(opt_classifiers)) {
        opt_classifiers = [opt_classifiers];
      }

      if (Array.isArray(opt_classifiers)) {
        opt_classifiers.forEach((classifier, i) => {
          if (typeof classifier === 'string') {
            opt_classifiers[i] = this.violaJones.classifiers[classifier];
          }
          if (!opt_classifiers[i]) {
            throw new Error('Object classifier not valid, try `new tracking.ObjectTracker("face")`.');
          }
        });
      }
    }

    this.setClassifiers(opt_classifiers);
  }


  /**
   * Gets the tracker HAAR classifiers.
   * @return {TypedArray.<number>}
   */
  getClassifiers () {
    return this.classifiers;
  }

  /**
   * Gets the edges density value.
   * @return {number}
   */
  getEdgesDensity () {
    return this.edgesDensity;
  }

  /**
   * Gets the initial scale to start the feature block scaling.
   * @return {number}
   */
  getInitialScale () {
    return this.initialScale;
  }

  /**
   * Gets the scale factor to scale the feature block.
   * @return {number}
   */
  getScaleFactor () {
    return this.scaleFactor;
  }

  /**
   * Gets the block step size.
   * @return {number}
   */
  getStepSize () {
    return this.stepSize;
  }

  /**
   * Tracks the `Video` frames. This method is called for each video frame in
   * order to emit `track` event.
   * @param {Uint8ClampedArray} pixels The pixels data to track.
   * @param {number} width The pixels canvas width.
   * @param {number} height The pixels canvas height.
   */
  track (pixels, width, height) {
    var self = this;
    var classifiers = this.getClassifiers();

    if (!classifiers) {
      throw new Error('Object classifier not specified, try `new tracking.ObjectTracker("face")`.');
    }

    var results = [];

    classifiers.forEach((classifier) => {
      results = results.concat(this.violaJones.detect(pixels, width, height, self.getInitialScale(), self.getScaleFactor(), self.getStepSize(), self.getEdgesDensity(), classifier));
    });

    this.emit('track', {
      data: results
    });
  }

  /**
   * Sets the tracker HAAR classifiers.
   * @param {TypedArray.<number>} classifiers
   */
  setClassifiers (classifiers) {
    this.classifiers = classifiers;
  }

  /**
   * Sets the edges density.
   * @param {number} edgesDensity
   */
  setEdgesDensity (edgesDensity) {
    this.edgesDensity = edgesDensity;
  }

  /**
   * Sets the initial scale to start the block scaling.
   * @param {number} initialScale
   */
  setInitialScale (initialScale) {
    this.initialScale = initialScale;
  }

  /**
   * Sets the scale factor to scale the feature block.
   * @param {number} scaleFactor
   */
  setScaleFactor (scaleFactor) {
    this.scaleFactor = scaleFactor;
  }

  /**
   * Sets the block step size.
   * @param {number} stepSize
   */
  setStepSize (stepSize) {
    this.stepSize = stepSize;
  }
}
