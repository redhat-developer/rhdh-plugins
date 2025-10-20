# React Relative Time

[![Collaborizm](https://img.shields.io/badge/Collaborizm-Join%20now-blue.svg)](https://www.collaborizm.com/) [![Build Status](https://travis-ci.org/aharshac/react-relative-time.svg?branch=master)](https://travis-ci.org/aharshac/react-relative-time)    

 [![NPM](https://nodei.co/npm/react-relative-time.png?mini=true)](https://nodei.co/npm/react-relative-time/)


React Component for rendering relative dates as `<time>` HTML5 element and preserving machine readable format in `datetime`
attribute.

Does not depend on [**moment.js**](https://github.com/moment/moment)

&nbsp;

## Acknowledgement
This module was inspired by a few awesome open source projects.
* [**moment.js**](https://github.com/moment/moment)
* [**react-time**](https://github.com/andreypopp/react-time)
* [**timeago**](http://timeago.yarp.com/)

&nbsp;

## Installation
```
npm install react-relative-time
```  

&nbsp;

## Usage

```jsx
import React from 'react'
import RelativeTime from 'react-relative-time'

class MyComponent extends React.Component {

  render() {
    let now = new Date()
    let wasDate = new Date("Thu Jul 18 2013 15:48:59 GMT+0400")
    return (
      <div>
        <p><RelativeTime value={1492630940000} titleFormat="YYYY/MM/DD HH:mm" /></p>
        <p><RelativeTime value="1970-01-01T00:00:00Z" titleformat="iso8601" /></p>
        <p><RelativeTime value={new Date(2017, 3, 19, 22, 33, 44, 666)} /></p>
      </div>
    )
  }
}
```

&nbsp;

## Reference
### Attribute `value`
The input date and time, which will be displayed in relative terms to the present date and time.

Supported types:
* *Date* object   
  `new Date(2017, 3, 19, 22, 33, 44, 666)`

* *number* - UNIX timestamp in milliseconds   
  `1492630940000`

* *string* - ISO-8601 date string   
  `1970-01-01T00:00:00Z`

### Attribute `titleFormat`
The specifier for the date and time format to be shown in the `title` attribute.    
Default: `iso8601`.

Supported formats:
* `iso8601` - ISO-8601 date string
* *Custom string placeholders*.   
  Replaces with numbered date/time. Text like "Sunday", "Mon", etc. are not supported.   
  Ex: `YYYY/MM/DD HH:mm`    

Supported number placeholders:
```
M = month
D = date
H = hour
m = minute
s = second
```
