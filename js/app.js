$(document).foundation()
var Page = (function() {

	var $container = $( '#container' ),
		$bookBlock = $( '#bb-bookblock' ),
		$items = $bookBlock.children(),
		itemsCount = $items.length,
		current = 0,
		bb = $( '#bb-bookblock' ).bookblock( {
			speed : 800,
			perspective : 2000,
			shadowSides	: 0.8,
			shadowFlip	: 0.4,
			onEndFlip : function(old, page, isLimit) {
				
				current = page;
				// update TOC current
				updateTOC();
				// updateNavigation
				updateNavigation( isLimit );
				// initialize jScrollPane on the content div for the new item
				setJSP( 'init' );
				// destroy jScrollPane on the content div for the old item
				setJSP( 'destroy', old );

			}
		} ),
		$navNext = $( '#bb-nav-next' ),
		$navPrev = $( '#bb-nav-prev' ).hide(),
		$menuItems = $container.find( 'ul.menu-toc > li' ),
		$tblcontents = $( '#tblcontents' ),
		transEndEventNames = {
			'WebkitTransition': 'webkitTransitionEnd',
			'MozTransition': 'transitionend',
			'OTransition': 'oTransitionEnd',
			'msTransition': 'MSTransitionEnd',
			'transition': 'transitionend'
		},
		transEndEventName = transEndEventNames[Modernizr.prefixed('transition')],
		supportTransitions = Modernizr.csstransitions;

	function init() {

		// initialize jScrollPane on the content div of the first item
		setJSP( 'init' );
		initEvents();

	}