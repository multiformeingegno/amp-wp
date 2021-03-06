/**
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import { metaToAttributeNames } from '../helpers';

/**
 * WordPress dependencies
 */
import { PluginDocumentSettingPanel } from '@wordpress/edit-post';
import { __ } from '@wordpress/i18n';
import { compose } from '@wordpress/compose';
import {
	withSelect,
	withDispatch,
} from '@wordpress/data';
import {
	SelectControl,
	RangeControl,
} from '@wordpress/components';

const MetaFields = ( props ) => {
	const {
		meta,
		autoAdvanceAfterOptions,
		updateMeta,
	} = props;

	const {
		autoAdvanceAfter,
		autoAdvanceAfterDuration,
	} = metaToAttributeNames( meta );

	const currentOption = autoAdvanceAfterOptions.find( ( i ) => i.value === autoAdvanceAfter ) || {};

	return (
		<>
			<p>{ __( 'These settings are applied to new pages.', 'amp' ) }</p>
			<SelectControl
				label={ __( 'Advance to next page', 'amp' ) }
				help={ currentOption.description || '' }
				value={ autoAdvanceAfter }
				options={ autoAdvanceAfterOptions }
				onChange={ ( value ) => updateMeta( { amp_story_auto_advance_after: value } ) }
				className="amp-story-settings-advance-after"
			/>
			{ 'time' === autoAdvanceAfter && (
				<RangeControl
					label={ __( 'Time in seconds', 'amp' ) }
					value={ autoAdvanceAfterDuration ? parseInt( autoAdvanceAfterDuration ) : 0 }
					onChange={ ( value ) => updateMeta( { amp_story_auto_advance_after_duration: value } ) }
					min={ 0 }
					max={ 100 }
					className="amp-story-settings-advance-after-duration"
				/>
			) }
		</>
	);
};

MetaFields.propTypes = {
	autoAdvanceAfterOptions: PropTypes.array.isRequired,
	updateMeta: PropTypes.func.isRequired,
	meta: PropTypes.shape( {
		amp_story_auto_advance_after: PropTypes.string,
		amp_story_auto_advance_after_duration: PropTypes.number,
	} ),
};

const EnhancedMetaFields = compose(
	withSelect( ( select ) => {
		const { getEditedPostAttribute } = select( 'core/editor' );
		const { getSettings } = select( 'amp/story' );
		const { storySettings } = getSettings();
		const { autoAdvanceAfterOptions } = storySettings || {};

		return {
			meta: getEditedPostAttribute( 'meta' ),
			autoAdvanceAfterOptions,
		};
	} ),
	withDispatch( ( dispatch, { meta } ) => {
		const { editPost } = dispatch( 'core/editor' );
		return {
			updateMeta( newMeta ) {
				editPost( {
					meta: {
						...meta,
						...newMeta,
					},
				} );
			},
		};
	} ),
)( MetaFields );

export const name = 'amp-story-settings-panel';

export const icon = 'book';

export const render = () => {
	return (
		<PluginDocumentSettingPanel
			name={ name }
			className={ name }
			title={ __( 'Story Settings', 'amp' ) }
		>
			<EnhancedMetaFields />
		</PluginDocumentSettingPanel>
	);
};
