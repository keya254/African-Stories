;
(function($, window, undefined) {

	'use strict';

	
	var $event = $.event,
	$special,
	resizeTimeout;

	$special = $event.special.debouncedresize = {
		setup: function() {
			$( this ).on( "resize", $special.handler );
		},
		teardown: function() {
			$( this ).off( "resize", $special.handler );
		},
		handler: function( event, execAsap ) {
			// Save the context
			var context = this,
				args = arguments,
				dispatch = function() {
					// set correct event type
					event.type = "debouncedresize";
					$event.dispatch.apply( context, args );
				};

			if ( resizeTimeout ) {
				clearTimeout( resizeTimeout );
			}

			execAsap ?
				dispatch() :
				resizeTimeout = setTimeout( dispatch, $special.threshold );
		},
		threshold: 150
	};

	// global
	var $window = $(window),
		Modernizr = window.Modernizr;

	$.BookBlock = function(options, element) {

		this.$el = $(element);
		this._init(options);

	};

	// the options
	$.BookBlock.defaults = {
		// speed for the flip transition in ms
		speed : 1000,
		// easing for the flip transition
		easing : 'ease-in-out',
		// if set to true, both the flipping page and the sides will have an overlay to simulate shadows
		shadows : true,
		// opacity value for the "shadow" on both sides (when the flipping page is over it)
		// value : 0.1 - 1
		shadowSides : 0.2,
		// opacity value for the "shadow" on the flipping page (while it is flipping)
		// value : 0.1 - 1
		shadowFlip : 0.1,
		// perspective value
		perspective : 1300,
		// if we should show the first item after reaching the end
		circular : false,
		// if we want to specify a selector that triggers the next() function. example: '#bb-nav-next'
		nextEl : '',
		// if we want to specify a selector that triggers the prev() function
		prevEl : '',
		// autoplay. If true it overwrites the circular option to true
		autoplay : false,
		// time (ms) between page switch, if autoplay is true
		interval : 3000,
		//if we want to navigate the slides with the keyboard arrows
		keyboard : true,
		// callback after the flip transition
		// old is the index of the previous item
		// page is the current item's index
		// isLimit is true if the current page is the last one (or the first one)
		onEndFlip : function(old, page, isLimit) {
			return false;
		},
		// callback before the flip transition
		// page is the current item's index
		onBeforeFlip : function(page) {
			return false;
		}
	};

	$.BookBlock.prototype = {

		_init: function(options) {

			// options
			this.options = $.extend(true, {}, $.BookBlock.defaults, options);
			// set the perspective
			this.$el.css('perspective', this.options.perspective);
			// items
			this.$items = this.$el.children('.bb-item');
			// total items
			this.itemsCount = this.$items.length;
			// current item's index
			this.current = 0;
			// previous item's index
			this.previous = -1;
			// show first item
			this.$current = this.$items.eq(this.current).show();
			// get width of this.$el
			// this will be necessary to create the flipping layout
			this.elWidth = this.$el.width();
			var transEndEventNames = {
				'WebkitTransition': 'webkitTransitionEnd',
				'MozTransition': 'transitionend',
				'OTransition': 'oTransitionEnd',
				'msTransition': 'MSTransitionEnd',
				'transition': 'transitionend'
			};
			this.transEndEventName = transEndEventNames[Modernizr.prefixed('transition')] + '.bookblock';
			// support (3dtransforms && transitions)
			this.support = Modernizr.csstransitions && Modernizr.csstransforms3d;
			// initialize/bind some events
			this._initEvents();
			// start slideshow
			if (this.options.autoplay) {

				this.options.circular = true;
				this._startSlideshow();

			}

		},
		_initEvents: function() {

			var self = this;

			if (this.options.nextEl !== '') {

				$(this.options.nextEl).on('click.bookblock', function() {

					self._action('next');
					return false;

				});

			}

			if (this.options.prevEl !== '') {

				$(this.options.prevEl).on('click.bookblock', function() {

					self._action('prev');
					return false;

				});

			}

			if (this.options.keyboard == true) {
				$(document).keydown(function(e) {
					var keyCode = e.keyCode || e.which,
						arrow = {
							left : 37,
							up : 38,
							right : 39,
							down : 40
						};

					switch (keyCode) {
						case arrow.left:
							self._action('prev');
							break;
						case arrow.right:
							self._action('next');
							break;
					}
				});
			}

			$window.on( 'debouncedresize', function() {
							
				// update width value
				self.elWidth = self.$el.width();

			} )

		},
		_action : function(dir, page) {

			this._stopSlideshow();
			this._navigate(dir, page);

		},
		_navigate: function(dir, page) {

			if (this.isAnimating) {
				return false;
			}

			// callback trigger
			this.options.onBeforeFlip(this.current);

			this.isAnimating = true;
			this.$current = this.$items.eq(this.current);

			if (page !== undefined) {

				this.current = page;

			} else if (dir === 'next') {

				if (!this.options.circular && this.current === this.itemsCount - 1) {

					this.end = true;

				} else {

					this.previous = this.current;
					this.current = this.current < this.itemsCount - 1 ? this.current + 1 : 0;

				}

			} else if (dir === 'prev') {

				if (!this.options.circular && this.current === 0) {

					this.end = true;

				} else {

					this.previous = this.current;
					this.current = this.current > 0 ? this.current - 1 : this.itemsCount - 1;

				}

			}

			this.$nextItem = !this.options.circular && this.end ? this.$current : this.$items.eq(this.current);
			
			if (!this.support) {

				this._layoutNoSupport(dir);

			} else {

				this._layout(dir);

			}

		},