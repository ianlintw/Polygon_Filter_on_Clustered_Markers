import React, { Component } from 'react';
import compose from 'recompose/compose';
import defaultProps from 'recompose/defaultProps';
import layoutStyles from './Layout.sass';
import GMap from './GMap';
// for hmr to work I need the first class to extend Component
export class Layout extends Component {
  render() {
    const { styles: { layout, header, main, footer, logo } } = this.props;
    return (
      <div className={layout}>
        <main className={main}>
          <GMap />
        </main>
      </div>
    );
  }
}

export const layoutHOC = compose(
  defaultProps({
    styles: layoutStyles,
  })
);

export default layoutHOC(Layout);
