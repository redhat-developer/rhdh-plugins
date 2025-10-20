import assert from 'power-assert';
import RelativeTime from '../src/RelativeTime';
import React from 'react';
import ReactDOMServer from 'react-dom/server';



describe('react-relative-time', function() {
  let date = new Date(Date.UTC(1987, 4, 8, 5, 0, 0, 0));

  it('renders date', function() {
    let markup = ReactDOMServer.renderToString(<RelativeTime value={date} />);
    assert(/1987\-05\-08/.test(markup));
  });

  it('renders the title in specified format', function() {
    let markup = ReactDOMServer.renderToString(<RelativeTime value={date} titleFormat="YYYY" />);
    assert(/title="1987"/.test(markup));
  });

  it('transfers props down to DOM element', function() {
    let markup = ReactDOMServer.renderToString(<RelativeTime value={date} className="xyz" />);
    assert(/class="xyz"/.test(markup));
  });

  it('allows passing milliseconds from epoch', function() {
    let markup = ReactDOMServer.renderToString(<RelativeTime value={1} />);
    assert(/1970\-01\-01/.test(markup) || /1969\-12\-31/.test(markup));
  });

  it('allows passing ISO-8601 string and "iso8601" as titleFormat specifier', function() {
    let markup = ReactDOMServer.renderToString(<RelativeTime value="1992-11-01T00:00:00Z" titleFormat="iso8601"/>);
    assert(/1992\-11\-01T00/.test(markup));
  });

  it('does not render current date if value is invalid or null', function() {
    let markup = ReactDOMServer.renderToString(<RelativeTime />);
    assert(/Invalid date/.test(markup));
  });
});
