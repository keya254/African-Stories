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