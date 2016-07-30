$(document).foundation()
(function( root, factory ) {
    if( typeof define === 'function' && define.amd ) {
        // AMD module
        define( factory );
    } else {
        // Browser global
        root.Meny = factory();
    }
}(this, function () {

// Date.now polyfill
if( typeof Date.now !== 'function' ) Date.now = function() { return new Date().getTime(); };

var Meny = {

	// Creates a new instance of Meny
	create: function( options ) {
		return (function(){

			// Make sure the required arguments are defined
			if( !options || !options.menuElement || !options.contentsElement ) {
				throw 'You need to specify which menu and contents elements to use.';
			}

			// Make sure the menu and contents have the same parent
			if( options.menuElement.parentNode !== options.contentsElement.parentNode ) {
				throw 'The menu and contents elements must have the same parent.';
			}

			// Constants
			var POSITION_T = 'top',
				POSITION_R = 'right',
				POSITION_B = 'bottom',
				POSITION_L = 'left';

			// Feature detection for 3D transforms
			var supports3DTransforms =  'WebkitPerspective' in document.body.style ||
										'MozPerspective' in document.body.style ||
										'msPerspective' in document.body.style ||
										'OPerspective' in document.body.style ||
										'perspective' in document.body.style;

			// Default options, gets extended by passed in arguments
			var config = {
				width: 300,
				height: 300,
				position: POSITION_L,
				threshold: 40,
				angle: 30,
				overlap: 6,
				transitionDuration: '0.5s',
				transitionEasing: 'ease',
				gradient: 'rgba(0,0,0,0.20) 0%, rgba(0,0,0,0.65) 100%)',
				mouse: true,
				touch: true
			};

			// Cache references to DOM elements
			var dom = {
				menu: options.menuElement,
				contents: options.contentsElement,
				wrapper: options.menuElement.parentNode,
				cover: null
			};

			// State and input
			var indentX = dom.wrapper.offsetLeft,
				indentY = dom.wrapper.offsetTop,
				touchStartX = null,
				touchStartY = null,
				touchMoveX = null,
				touchMoveY = null,
				isOpen = false,
				isMouseDown = false;

				// Precalculated transform and style states
			var menuTransformOrigin,
				menuTransformClosed,
				menuTransformOpened,
				menuStyleClosed,
				menuStyleOpened,

				contentsTransformOrigin,
				contentsTransformClosed,
				contentsTransformOpened,
				contentsStyleClosed,
				contentsStyleOpened;

			var originalStyles = {},
				addedEventListeners = [];

			// Ongoing animations (for fallback mode)
			var menuAnimation,
				contentsAnimation,
				coverAnimation;

			configure( options );

			/**
			 * Initializes Meny with the specified user options,
			 * may be called multiple times as configuration changes.
			 */
			function configure( o ) {
				// Extend the default config object with the passed in
				// options
				Meny.extend( config, o );

				setupPositions();
				setupWrapper();
				setupCover();
				setupMenu();
				setupContents();

				bindEvents();
			}

			/**
			 * Prepares the transforms for the current positioning
			 * settings.
			 */
			function setupPositions() {
				menuTransformOpened = '';
				contentsTransformClosed = '';
				menuAngle = config.angle;
				contentsAngle = config.angle / -2;

				switch( config.position ) {
					case POSITION_T:
					// Primary transform:
						menuTransformOrigin = '50% 0%';
						menuTransformClosed = 'rotateX( ' + menuAngle + 'deg ) translateY( -100% ) translateY( '+ config.overlap +'px )';
						contentsTransformOrigin = '50% 0';
						contentsTransformOpened = 'translateY( '+ config.height +'px ) rotateX( ' + contentsAngle + 'deg )';

						// Position fallback:
						menuStyleClosed = { top: '-' + (config.height-config.overlap) + 'px' };
						menuStyleOpened = { top: '0px' };
						contentsStyleClosed = { top: '0px' };
						contentsStyleOpened = { top: config.height + 'px' };
						break;

					case POSITION_R:
						// Primary transform:
						menuTransformOrigin = '100% 50%';
						menuTransformClosed = 'rotateY( ' + menuAngle + 'deg ) translateX( 100% ) translateX( -2px ) scale( 1.01 )';
						contentsTransformOrigin = '100% 50%';
						contentsTransformOpened = 'translateX( -'+ config.width +'px ) rotateY( ' + contentsAngle + 'deg )';

						// Position fallback:
						menuStyleClosed = { right: '-' + (config.width-config.overlap) + 'px' };
						menuStyleOpened = { right: '0px' };
						contentsStyleClosed = { left: '0px' };
						contentsStyleOpened = { left: '-' + config.width + 'px' };
						break;

					case POSITION_B:
						// Primary transform:
						menuTransformOrigin = '50% 100%';
						menuTransformClosed = 'rotateX( ' + -menuAngle + 'deg ) translateY( 100% ) translateY( -'+ config.overlap +'px )';
						contentsTransformOrigin = '50% 100%';
						contentsTransformOpened = 'translateY( -'+ config.height +'px ) rotateX( ' + -contentsAngle + 'deg )';

						// Position fallback:
						menuStyleClosed = { bottom: '-' + (config.height-config.overlap) + 'px' };
						menuStyleOpened = { bottom: '0px' };
						contentsStyleClosed = { top: '0px' };
						contentsStyleOpened = { top: '-' + config.height + 'px' };
						break;

					default:
						// Primary transform:
						menuTransformOrigin = '100% 50%';
						menuTransformClosed = 'translateX( -100% ) translateX( '+ config.overlap +'px ) scale( 1.01 ) rotateY( ' + -menuAngle + 'deg )';
						contentsTransformOrigin = '0 50%';
						contentsTransformOpened = 'translateX( '+ config.width +'px ) rotateY( ' + -contentsAngle + 'deg )';

						// Position fallback:
						menuStyleClosed = { left: '-' + (config.width-config.overlap) + 'px' };
						menuStyleOpened = { left: '0px' };
						contentsStyleClosed = { left: '0px' };
						contentsStyleOpened = { left: config.width + 'px' };
						break;
				}
			}

			/**
			 * The wrapper element holds the menu and contents.
			 */
			function setupWrapper() {
				// Add a class to allow for custom styles based on
				// position
				Meny.addClass( dom.wrapper, 'meny-' + config.position );

				originalStyles.wrapper = dom.wrapper.style.cssText;

				dom.wrapper.style[ Meny.prefix( 'perspective' ) ] = '800px';
				dom.wrapper.style[ Meny.prefix( 'perspectiveOrigin' ) ] = contentsTransformOrigin;
			}

			/**
			 * The cover is used to obfuscate the contents while
			 * Meny is open.
			 */
			function setupCover() {
				if( dom.cover ) {
					dom.cover.parentNode.removeChild( dom.cover );
				}

				dom.cover = document.createElement( 'div' );

				// Disabled until a falback fade in animation is added
				dom.cover.style.position = 'absolute';
				dom.cover.style.display = 'block';
				dom.cover.style.width = '100%';
				dom.cover.style.height = '100%';
				dom.cover.style.left = 0;
				dom.cover.style.top = 0;
				dom.cover.style.zIndex = 1000;
				dom.cover.style.visibility = 'hidden';
				dom.cover.style.opacity = 0;

				// Silence unimportant errors in IE8
				try {
					dom.cover.style.background = 'rgba( 0, 0, 0, 0.4 )';
					dom.cover.style.background = '-ms-linear-gradient('+ config.position +','+ config.gradient;
					dom.cover.style.background = '-moz-linear-gradient('+ config.position +','+ config.gradient;
					dom.cover.style.background = '-webkit-linear-gradient('+ config.position +','+ config.gradient;
				}
				catch( e ) {}

				if( supports3DTransforms ) {
					dom.cover.style[ Meny.prefix( 'transition' ) ] = 'all ' + config.transitionDuration +' '+ config.transitionEasing;
				}

				dom.contents.appendChild( dom.cover );
			}