import EventEmitter from '../utils/EventEmitter';

/**
 * TrackerTask utility.
 * @constructor
 * @extends {tracking.EventEmitter}
 */
export default class TrackerTask extends EventEmitter {
  constructor(tracker) {
    super();

    /**
     * Holds the tracker instance managed by this task.
     * @type {tracking.Tracker}
     * @private
     */
    this.tracker_ = null;

    /**
     * Holds if the tracker task is in running.
     * @type {boolean}
     * @private
     */
    this.running_ = false;

    if (!tracker) {
      throw new Error('Tracker instance not specified.');
    }

    this.setTracker(tracker);
  }


  /**
   * Gets the tracker instance managed by this task.
   * @return {tracking.Tracker}
   */
  getTracker () {
    return this.tracker_;
  }

  /**
   * Returns true if the tracker task is in running, false otherwise.
   * @return {boolean}
   * @private
   */
  inRunning () {
    return this.running_;
  }

  /**
   * Sets if the tracker task is in running.
   * @param {boolean} running
   * @private
   */
  setRunning (running) {
    this.running_ = running;
  }

  /**
   * Sets the tracker instance managed by this task.
   * @return {tracking.Tracker}
   */
  setTracker (tracker) {
    this.tracker_ = tracker;
  }

  /**
   * Emits a `run` event on the tracker task for the implementers to run any
   * child action, e.g. `requestAnimationFrame`.
   * @return {object} Returns itself, so calls can be chained.
   */
  run () {
    var self = this;

    if (this.inRunning()) {
      return;
    }

    this.setRunning(true);
    this.reemitTrackEvent_ = function(event) {
      self.emit('track', event);
    };
    this.tracker_.on('track', this.reemitTrackEvent_);
    this.emit('run');
    return this;
  }

  /**
   * Emits a `stop` event on the tracker task for the implementers to stop any
   * child action being done, e.g. `requestAnimationFrame`.
   * @return {object} Returns itself, so calls can be chained.
   */
  stop () {
    if (!this.inRunning()) {
      return;
    }

    this.setRunning(false);
    this.emit('stop');
    this.tracker_.removeListener('track', this.reemitTrackEvent_);
    return this;
  }
}

