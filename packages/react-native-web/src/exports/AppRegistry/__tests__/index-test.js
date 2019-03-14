/* eslint-env jasmine, jest */

import AppRegistry from '..';
import ExecutionEnvironment from 'fbjs/lib/ExecutionEnvironment';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { render } from 'enzyme';
import StyleSheet from '../../StyleSheet';
import Text from '../../Text';
import View from '../../View';

const NoopComponent = () => <div />;

const styles = StyleSheet.create({ root: { borderWidth: 1234, backgroundColor: 'purple' } });
const RootComponent = () => <View />;
const AlternativeComponent = () => <Text style={styles.root} />;

describe('AppRegistry', () => {
  describe('getApplication', () => {
    const canUseDOM = ExecutionEnvironment.canUseDOM;

    beforeEach(() => {
      ExecutionEnvironment.canUseDOM = false;
    });

    afterEach(() => {
      ExecutionEnvironment.canUseDOM = canUseDOM;
    });

    test('does not throw when missing appParameters', () => {
      AppRegistry.registerComponent('App', () => NoopComponent);
      expect(() => AppRegistry.getApplication('App')).not.toThrow();
    });

    test('returns "element" and "getStyleElement"', () => {
      AppRegistry.registerComponent('App', () => NoopComponent);
      const { element, getStyleElement } = AppRegistry.getApplication('App', {});
      const styleElement = ReactDOMServer.renderToStaticMarkup(getStyleElement());

      expect(element).toMatchSnapshot();
      expect(styleElement).toMatchSnapshot();
    });

    test('"getStyleElement" adds props to <style>', () => {
      const nonce = '2Bz9RM/UHvBbmo3jK/PbYZ==';
      AppRegistry.registerComponent('App', () => NoopComponent);
      const { getStyleElement } = AppRegistry.getApplication('App', {});
      const styleElement = getStyleElement({ nonce });
      expect(styleElement.props.nonce).toBe(nonce);
    });

    test('"getStyleElement" produces styles that are a function of rendering "element"', () => {
      const getApplicationStyles = appName => {
        const { element, getStyleElement } = AppRegistry.getApplication(appName, {});
        render(element);
        return getStyleElement().props.dangerouslySetInnerHTML.__html;
      };

      // First render "RootComponent"
      AppRegistry.registerComponent('App', () => RootComponent);
      const first = getApplicationStyles('App');
      expect(first).toMatchSnapshot();

      // Second render "AlternativeComponent"
      AppRegistry.registerComponent('AlternativeApp', () => AlternativeComponent);
      const second = getApplicationStyles('AlternativeApp');
      expect(first).not.toEqual(second);

      // Third render "RootComponent" again
      const third = getApplicationStyles('App');
      expect(third).toEqual(first);
    });
  });

  describe('runApplication', () => {
    test('callback after render', () => {
      // setup
      const rootTag = document.createElement('div');
      rootTag.id = 'react-root';
      document.body.appendChild(rootTag);

      const callback = jest.fn();
      AppRegistry.registerComponent('App', () => NoopComponent);
      AppRegistry.runApplication('App', { initialProps: {}, rootTag, callback });
      expect(callback).toHaveBeenCalledTimes(1);

      // cleanup
      document.body.removeChild(rootTag);
    });
  });
});
