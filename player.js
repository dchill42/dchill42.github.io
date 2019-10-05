/**
 * MP3 Audio Playlist App
 *
 * @author  dchill42@gmail.com
 */

/**
 * MP3 Track Class
 */
class Track {
  /**
   * Constructor
   *
   * @param file    {String}  File URL
   * @param title   {String}  File title
   */
  constructor({ file, title }) {
    this._file = file;
    this._title = title;

    this.$item = $('<li>');
    this.$row = $('<div>');
    this.$playbox = $('<span>');
    this.$play = $('<button>');
    this.$playrow = $('<div>');
    this.$playicon = $('<span>');
    this.$label = $('<span>');
    this.$clock = $('<span>');
    this.$separator = $('<span>');
    this.$total = $('<span>');
    this.$dlbox = $('<span>');
    this.$download = $('<a>');
    this.$dlicon = $('<span>');
  }

  /**
   * Build track UI
   *
   * @param id      {Number}    Track id
   * @param list    {Object}    Parent list to attach to
   * @param onClick {Function}  Click handler
   */
  build({ id, list, onClick }) {
    this.$item.addClass('track-item').appendTo(list);
    this.$row.addClass('track-row flex-row').appendTo(this.$item);

    this.$playbox.addClass('track-playbox flex-grow-1').appendTo(this.$row);
    this.$play.attr('id', id).addClass('track-play').appendTo(this.$playbox).button();
    this.$playrow.addClass('track-playrow flex-row').appendTo(this.$play);

    this.$playicon.addClass('ui-icon ui-icon-play').appendTo(this.$playrow);
    this.$label.addClass('track-label').text(this._title).appendTo(this.$playrow);
    this.$clock.addClass('track-clock track-time track-time--play flex-grow-1').appendTo(this.$playrow);
    this.$separator.addClass('track-separator track-time track-time--play').text('/').appendTo(this.$playrow);
    this.$total.addClass('track-total track-time').appendTo(this.$playrow);

    this.$dlbox.addClass('track-dlbox').appendTo(this.$row);
    this.$download.addClass('track-download').attr({ href: this._file, download: this._file, target: '_blank' })
      .appendTo(this.$dlbox).button();
    this.$dlicon.addClass('ui-icon ui-icon-arrowthickstop-1-s').appendTo(this.$download);

    this.$play.click(onClick);
  }

  /**
   * Get file name
   *
   * @return  {String}  File name
   */
  get file() {
    return this._file;
  }

  /**
   * (De-)select track button
   *
   * @param selected  {Boolean} Whether selected or not
   */
  select({ selected = true } = {}) {
    this.$play.toggleClass('track-play--playing', selected);
    this.$playicon.toggleClass('ui-icon-pause', selected);
    this.$playicon.toggleClass('ui-icon-play', !selected);
  }

  /**
   * Set current track time display
   *
   * @param time  {String}  Total time
   */
  currentTime(time) {
    this.$clock.text(time);
  }

  /**
   * Set total track time display
   *
   * @param time  {String}  Total time
   */
  totalTime(time) {
    this.$total.text(time);
  }
}

/**
 * Audio Player Controls
 */
class Controls {
  /**
   * Constructor
   */
  constructor() {
    this.$element = $('<div>');
    this.$cells = [
      $('<span>'),
      $('<span>'),
      $('<span>'),
      $('<span>')
    ];
    this.$all = $('<button>');
    this.$allicon = $('<span>');
    this.$alltext = $('<span>');
    this.$stoptext = $('<span>');
    this.$total = $('<span>');
    this.$min = $('<span>');
    this.$max = $('<span>');
    this.$volume = $('<div>');
  }

  /**
   * Build component
   *
   * @param panel     {Object}    Player panel to mount to
   * @param playAll   {Function}  Play all tracks callback
   * @param setVolume {Function}  Set volume callback
   */
  build({ panel, playAll, setVolume }) {
    this.$element.addClass('player-controls flex-row').appendTo(panel);

    this.$cells[0].addClass('player-all-box flex-grow-1').appendTo(this.$element);
    this.$all.addClass('player-play-all').click(playAll).appendTo(this.$cells[0]).button();
    this.$allicon.addClass('ui-icon ui-icon-seek-end').prependTo(this.$all);
    this.$alltext.addClass('player-all-text').text('Play All').appendTo(this.$all);
    this.$total.addClass('player-total').appendTo(this.$all);
    this.$stoptext.addClass('player-stop-text').text('Stop').appendTo(this.$all);

    this.$cells[1].addClass('player-down-box').appendTo(this.$element);
    this.$min.addClass('ui-icon ui-icon-volume-off').appendTo(this.$cells[1]);

    this.$cells[2].addClass('player-vol-box').appendTo(this.$element);
    this.$volume.addClass('player-volume').appendTo(this.$cells[2]).slider({ change: setVolume });

    this.$cells[3].addClass('player-up-box').appendTo(this.$element);
    this.$max.addClass('ui-icon ui-icon-volume-on').appendTo(this.$cells[3]);
  }

  /**
   * (De-)select play all button
   *
   * @param selected  {Boolean} Whether selected or not
   */
  selectAll({ selected = true } = {}) {
    this.$all.toggleClass('player-play-all--playing', selected);
    this.$allicon.toggleClass('ui-icon-stop', selected);
    this.$allicon.toggleClass('ui-icon-seek-end', !selected);
  }

  /**
   * Set total track time display
   *
   * @param time  {String}  Total time
   */
  totalTime(time) {
    this.$total.text(`[${time}]`);
  }

  /**
   * Set player volume
   *
   * @param level {Number}  Volume (0-100)
   */
  volume(level) {
    this.$volume.slider('value', level);
  }
}

/**
 * Audio Player
 */
class Player {
  /**
   * Constructor
   */
  constructor() {
    this.onClick = this.onClick.bind(this);
    this.onTime = this.onTime.bind(this);
    this.onEnd = this.onEnd.bind(this);
    this.playAll = this.playAll.bind(this);
    this.setVolume = this.setVolume.bind(this);

    this.$element = $('<div>');
    this.$title = $('<h2>');
    this.$audio = $('<audio>');
    this._controls = new Controls();
    this.$list = $('<ul>');

    this._index = -1;
    this._playing = false;
    this._all = false;
  }

  /**
   * Build player UI
   *
   * @param root    {String}        Root node selector
   * @param tracks  {Array<Track>}  Track list
   */
  build({ root, tracks }) {
    this.$element.addClass('player-panel ui-widget ui-corner-all').appendTo(root);
    this.$title.addClass('player-title ui-widget ui-widget-header ui-corner-all')
      .text('Portfolio of audio samples').appendTo(this.$element);
    $('<div style="color: white">').text(`Width: ${window.innerWidth}px`).appendTo(this.$element);
    this.$audio.appendTo(this.$element);
    this._controls.build({ panel: this.$element, playAll: this.playAll, setVolume: this.setVolume });
    this.$list.addClass('player-list').appendTo(this.$element);

    this._player = this.$audio[0];
    this._tracks = tracks
    this._tracks.forEach((track, id) => { track.build({ id: id, list: this.$list, onClick: this.onClick }); });
    this._totalTimes();

    this.$audio.on('timeupdate', this.onTime);
    this.$audio.on('ended', this.onEnd);
  }

  /**
   * Deselect current track
   */
  deselect() {
    if (this._index < 0) return;
    this._tracks[this._index].select({ selected: false });
    this._index = -1;
  }

  /**
   * Play selected track
   *
   * @param index [Number]  Track index
   */
  play(index) {
    if (this._tracks[index].file !== this._player.src.split('/').pop()) {
      this.deselect();
      this._player.src = this._tracks[index].file;
    }
    this._player.play();
    this._playing = true;
    this._index = index;
    this._tracks[index].select();
  }

  /**
   * Pause playing track
   */
  pause() {
    this._player.pause();
    this._playing = false;
    this._all = false;
    this.deselect();
    this._controls.selectAll({ selected: false });
  }

  /**
   * Play all tracks
   *
   * @param ev  {Event} Change event
   */
  playAll(ev) {
    if (this._all) {
      this.pause();
    } else {
      this._all = true;
      this._controls.selectAll();
      this.play(0);
    }
    $(ev.currentTarget).blur();
  }

  /**
   * Play next track if available
   */
  playNext() {
    var next = this._index + 1;

    if (next < this._tracks.length) this.play(next);
    else pause();
  }

  /**
   * Set player volume level
   *
   * @param ev  {Event} Change event
   */
  setVolume(ev) {
    let $button = $(ev.target);

    this._player.volume = $button.slider('value') / 100;
    $button.blur();
  }

  /**
   * Handle track button click event
   *
   * @param ev  {Event} Event object
   */
  onClick(ev) {
    let $button = $(ev.currentTarget),
        index = parseInt($button.attr('id')),
        previous = this._index;

    this.pause();
    if (index !== previous) this.play(index);
    $button.blur();
  }

  /**
   * Handle player time update event
   */
  onTime() {
    if (this._index < 0) return;
    this._tracks[this._index].currentTime(this._convertTime(this._player.currentTime || 0));
  }

  /**
   * Handle track end event
   */
  onEnd() {
    if (this._all) this.playNext();
    else this.deselect();
  }

  /**
   * Convert time from a float to a m:ss string
   *
   * @param time  {Number}  Time as float
   * @return  {String}  Time as string
   */
  _convertTime(time) {
    let minutes, seconds;

    time = Math.round(time);
    minutes = Math.floor(time / 60).toString(),
    seconds = (time % 60).toString();

    if (seconds.length < 2) seconds = `0${seconds}`;
    return `${minutes}:${seconds}`;
  }

  /**
   * Initialize track total times on list items
   */
  _totalTimes() {
    var index = 0, total = 0;

    this.$audio.on('loadedmetadata', (ev) => {
      this._tracks[index].totalTime(this._convertTime(ev.target.duration));
      total += ev.target.duration;
      index += 1;
      if (index >= this._tracks.length) {
        this.$audio.off('loadedmetadata');
        this._controls.totalTime(this._convertTime(total));
        this._controls.volume(this._player.volume * 100);
        this._player.src = '';
      }
      else this._player.src = this._tracks[index].file;
    });

    this._player.src = this._tracks[0].file;
  }
}

/**
 * Initialize app
 */
$().ready(() => {
  const tracks = [
        new Track({ file: 'EBS_Test.mp3', title: 'EBS Test' }),
        new Track({ file: 'Press_One.mp3', title: 'Press One' }),
        new Track({ file: 'Disclaimer.mp3', title: 'Disclaimer' }),
        new Track({ file: 'Bernie_Runs_Again.mp3', title: 'Bernie Runs Again' }),
        new Track({ file: 'Sunday_Sunday.mp3', title: 'Sunday, Sunday' }),
        new Track({ file: 'Schtupefy.mp3', title: 'Schtupefy' })
      ],
      player = new Player();

  player.build({ root: '#player', tracks });
});
