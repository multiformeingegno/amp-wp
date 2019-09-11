/**
 * WordPress dependencies
 */
import { withDispatch, withSelect } from '@wordpress/data';
import { compose, createHigherOrderComponent } from '@wordpress/compose';
import isShallowEqual from '@wordpress/is-shallow-equal';

/**
 * Internal dependencies
 */
import { STORY_PAGE_INNER_HEIGHT, STORY_PAGE_INNER_WIDTH } from '../../constants';
import { getBlockInnerElement } from '../../helpers';

/**
 * Higher-order component that returns snap targets for the current block.
 *
 * Snap targets are divided into horizontal and vertical ones, and are based on the following data:
 *
 * - The page's width / height constraints and center.
 * - The block's position in relation to its siblings.
 *
 * The snap targets are stored in a map with the snap target as the key and the snap lines to be shown as the value.
 */
const applyWithSelect = withSelect( ( select, { clientId } ) => {
	const {
		getBlocksByClientId,
		getBlockRootClientId,
		getBlock,
		getBlockOrder,
	} = select( 'core/block-editor' );
	const { getCurrentPage, getSnapLines } = select( 'amp/story' );

	const parentBlock = getBlockRootClientId( clientId );

	const defaultData = {
		horizontalSnaps: [],
		verticalSnaps: [],
		snapLines: [],
		parentBlockOffsetTop: 0,
		parentBlockOffsetLeft: 0,
	};

	if ( getCurrentPage() !== parentBlock ) {
		return defaultData;
	}

	const parentBlockElement = getBlockInnerElement( getBlock( parentBlock ) );

	if ( ! parentBlockElement ) {
		return defaultData;
	}

	const { left: parentBlockOffsetLeft, top: parentBlockOffsetTop } = parentBlockElement.getBoundingClientRect();

	const siblings = getBlocksByClientId( getBlockOrder( parentBlock ) ).filter( ( { clientId: blockId } ) => blockId !== clientId );

	const getVerticalLine = ( offsetX ) => [ [ offsetX, 0 ], [ offsetX, STORY_PAGE_INNER_HEIGHT ] ];
	const getHorizontalLine = ( offsetY ) => [ [ 0, offsetY ], [ STORY_PAGE_INNER_WIDTH, offsetY ] ];

	// Setter used for the proxied objects.
	const proxySet = ( obj, prop, value ) => {
		prop = Math.round( prop );

		if ( prop < 0 || prop > STORY_PAGE_INNER_WIDTH ) {
			return true;
		}

		const hasSnapLine = ( item ) => obj[ prop ].find( ( snapLine ) => isShallowEqual( item[ 0 ], snapLine[ 0 ] ) && isShallowEqual( item[ 1 ], snapLine[ 1 ] ) );

		if ( obj.hasOwnProperty( prop ) && ! hasSnapLine( value ) ) {
			obj[ prop ].push( value );
		} else {
			obj[ prop ] = [ value ];
		}

		obj[ prop ] = obj[ prop ].sort();

		return true;
	};

	return {
		horizontalSnaps: () => {
			const snaps = new Proxy( {
				// Left page border.
				0: [ getVerticalLine( 0 ) ],
				// Center of the page.
				[ STORY_PAGE_INNER_WIDTH / 2 ]: [ getVerticalLine( STORY_PAGE_INNER_WIDTH / 2 ) ],
				// Right page border.
				[ STORY_PAGE_INNER_WIDTH ]: [ getVerticalLine( STORY_PAGE_INNER_WIDTH ) ],
			},
			{
				set: proxySet,
			} );

			for ( const block of siblings ) {
				const blockElement = getBlockInnerElement( block );

				if ( ! blockElement ) {
					continue;
				}

				const { left, right } = blockElement.getBoundingClientRect();

				snaps[ left - parentBlockOffsetLeft ] = getVerticalLine( left - parentBlockOffsetLeft );
				snaps[ right - parentBlockOffsetLeft ] = getVerticalLine( right - parentBlockOffsetLeft );
			}

			return snaps;
		},
		verticalSnaps: () => {
			const snaps = new Proxy( {
				// Top page border.
				0: [ getHorizontalLine( 0 ) ],
				// Center of the page.
				[ STORY_PAGE_INNER_HEIGHT / 2 ]: [ getHorizontalLine( STORY_PAGE_INNER_HEIGHT / 2 ) ],
				// Bottom page border.
				[ STORY_PAGE_INNER_HEIGHT ]: [ getHorizontalLine( STORY_PAGE_INNER_HEIGHT ) ],
			},
			{
				set: proxySet,
			} );

			for ( const block of siblings ) {
				const blockElement = getBlockInnerElement( block );

				if ( ! blockElement ) {
					continue;
				}

				const { top, bottom } = blockElement.getBoundingClientRect();

				snaps[ top - parentBlockOffsetTop ] = getVerticalLine( top - parentBlockOffsetTop );
				snaps[ bottom - parentBlockOffsetTop ] = getVerticalLine( bottom - parentBlockOffsetTop );
			}

			return snaps;
		},
		snapLines: getSnapLines(),
		parentBlockOffsetTop,
		parentBlockOffsetLeft,
	};
} );

const applyWithDispatch = withDispatch( ( dispatch ) => {
	const {
		showSnapLines,
		hideSnapLines,
		setSnapLines,
		clearSnapLines,
	} = dispatch( 'amp/story' );

	return {
		showSnapLines,
		hideSnapLines,
		setSnapLines,
		clearSnapLines,
	};
} );

const enhance = compose(
	applyWithSelect,
	applyWithDispatch,
);

/**
 * Higher-order component that provides snap targets.
 *
 * @return {Function} Higher-order component.
 */
export default createHigherOrderComponent(
	enhance,
	'withSnapTargets'
);
