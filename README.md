# **Welcome to the repo for Virtuoso**

With virtuoso your computer can help you learn your favorite songs on piano for free! Using the very portable midi format, you can quickly load songs and see their playback on a keyboard. You don't even have to have an internet connection to use this. You can download it and fire it up with your favorite browser whenever you feel like practicing.

## **Version Information**

**Current Version:** 0.3.1 Beta

Live Demo: http://notebookinc.byethost15.com/js/virtuoso/virtuoso.html

Current Features:
- Midi playback
- Playback visualization
- Limited midi event engine
- Displays helpful meta info (tempo, key, pedal, etc.)

Planned Features:
- Find way to load default sample in local mode
- Tempo Control
- Layer Color Control
- Instrument Control (including defining waveforms)


## **Download and Setup**

Getting this setup on a server or on your computer is a fairly straightforward process. All you have to do is view the releases and download the zip for the latest release. The files in the zip are a universal build which can be made to fit most typical usage scenarios.

If you want the application to fit in with your servers styles, you can remove the all of the tags surrounding `<div id="app-container">...</div>` except for the closing `</head>` than you can use something along the lines of the following code to make it be served with your pages styles.

```php
<?php

ob_start();

include("Path to your html header");
include("Path to virtuoso.html");
$content = ob_get_contents();

ob_end_clean();

if(substr_count($content, "</head>") > 1){
  $content = substr_replace($content, "", strpos($content, "</head>"), strlen("</head>"));
}

echo $content;

/*
Footer and other stuff that you need
*/
?>
```

You can also use an iframe to fit the application in your page. Or if you just want to use the app locally, you can just open "virtuoso.html" after extracting all the files.

## **License**

Virtuoso is Licensed under GNU General Public License v3.0
