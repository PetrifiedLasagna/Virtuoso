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

Getting this setup on a server or on your computer is a fairly straightforward process. For servers with PHP installed, copy the files from the **bin/server** folder to any directory. You can modify "virtioso.php" to suit the needs of your server. The HTML file assumes that the document header has not been closed and you may need to make adjustments to suit your needs. For example, you could use the following.

```php
<?php

ob_start();

include("Path to header");
include("Path to virtuoso.html");
$content = ob_get_contents();

ob_end_clean();

if(substr_count($content, "</head>") > 1){
  $content = substr_replace($content, "", strpos($content, "</head>"), strlen("</head>"));
}

/*
Rest of file
*/
?>
```

Additionally, the **bin/local** folder contains the files organized in a way that is suitable for use on personal computers and servers without PHP. All you need to do is put the files in a directory of your choosing and then open **virtuoso.html**.

## **License**

Virtuoso is Licensed under GNU General Public License v3.0
