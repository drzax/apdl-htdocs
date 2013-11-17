<!DOCTYPE html>
<!--[if !IE]><!-->
<html lang="$ContentLocale">
<!--<![endif]-->
<!--[if IE 6 ]><html lang="$ContentLocale" class="ie ie6"><![endif]-->
<!--[if IE 7 ]><html lang="$ContentLocale" class="ie ie7"><![endif]-->
<!--[if IE 8 ]><html lang="$ContentLocale" class="ie ie8"><![endif]-->
<head>
	<% base_tag %>
	<title><% if MetaTitle %>$MetaTitle<% else %>$Title<% end_if %> &raquo; $SiteConfig.Title</title>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0;">
	<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
	$MetaTags(false)
	<link rel="shortcut icon" href="$ThemeDir/images/favicon.ico">
	<link href='http://fonts.googleapis.com/css?family=Playfair+Display:400,700,900,400italic,700italic,900italic' rel='stylesheet' type='text/css'>
	<link rel="stylesheet" href="$ThemeDir/css/style.css">
</head>
<body class="$ClassName">
	<div id="container">
		<nav id="off-screen-nav">
			<% include SideBar %>
		</nav>

		<div id="pusher">
			<div id="content">
				<div id="content-inner">
					<h1 class="site-title"><a href="$BaseHREF">$SiteConfig.Title</a></h1>

					$Layout

					<span id="nav-trigger" class="si-icon si-icon-hamburger-cross" data-icon-name="hamburgerCross"></span>
				</div>
			</div>
		</div>

	</div>
	<script src="$ThemeDir/javascript/lib.js"></script>
	<script src="https://login.persona.org/include.js"></script>
	<script src="$ThemeDir/javascript/app.js"></script>
</body>
</html>