/*
 * Data storage is moved from Parse to Gists. It won't be possible anymore to
 * save new revisions of existing Parse snippets. We let the visitor know.
 */

import React from 'react';
import {connect} from 'react-redux';
import {getRevision} from '../store/selectors';
import type {Revision, AppState} from '../types';

const buttonStyle: React.CSSProperties = {
  backgroundColor: 'transparent',
  border: 'none',
  cursor: 'pointer',
  float: 'left',
  fontSize: 14,
  margin: 0,
  padding: 0,
  paddingRight: 10,
};

type GistBannerProps = {
  revision?: Revision | null;
};

class GistBanner extends React.Component<GistBannerProps, {visible: boolean}> {
    constructor(props: GistBannerProps) {
    super(props);
    this.state = {
      visible: true,
    };
  }

  componentDidUpdate(prevProps: GistBannerProps) {
    const newRevision = this.props.revision;
    const oldRevision = prevProps.revision;
    if (newRevision &&
      (!oldRevision || newRevision.getSnippetID() !== oldRevision.getSnippetID())) {
      this.setState({visible: true});
    }
  }

  _hide = () => {
    this.setState({visible: false});
  };

  render() {
    if (!this.state.visible) {
      return null;
    }

    if (!this.props.revision || this.props.revision.canSave()) {
      return null;
    }

    return (
      <div className="banner">
        This snippet is <strong>read-only</strong>. You can still save changes
        by forking it.
        <button style={buttonStyle} onClick={this._hide}>
          <i className="fa fa-times" aria-hidden="true"></i>
        </button>
      </div>
    );
  }
}


export default connect((state: AppState) => ({revision: getRevision(state)}))(GistBanner);
