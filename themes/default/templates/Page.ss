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
<body class="$ClassName<% if Menu(2) %><% else %> no-sidebar<% end_if %>">
	<div id="container">
		<div id="sidebar">
			<header>
				<h1>Kindred</h1>
			</header>
			<nav>
				<a href=""></a>
			</nav>
			<footer>
				<% include LogInOut %>
			</footer>
		</div>
		<div id="content-scroller">
			<div id="content-wrapper">
				<section id="profile" class="content-pane">
					$Layout
				</section>
				<section id="timeline" class="content-pane">
					
				</section>
				<section id="network" class="content-pane">
					
				</section>
			</div>
		</div>
	</div>
</body>
</html>